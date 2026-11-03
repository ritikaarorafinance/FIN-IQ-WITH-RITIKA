import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase"; // Switch storage to db
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile as updateFirebaseProfile,
    updatePassword as updateFirebasePassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { mockAuth } from "../mockService";


const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password, fullName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (fullName) {
                await updateProfile(user.uid, { fullName });
            }
            await signOut(auth);
            return userCredential;
        } catch (error) {
            console.warn("Firebase signup failed, falling back to mock:", error);
            return mockAuth.signup(email, password);
        } finally {
            setCurrentUser(null);
            try {
                if (window?.storage?.remove) window.storage.remove('auth_currentUser');
                else localStorage.removeItem('auth_currentUser');
            } catch (e) { }
        }
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password).catch((err) => {
            console.warn("Firebase login failed, falling back to mock:", err);
            return mockAuth.login(email, password).then(u => {
                setCurrentUser(u);
                return { user: u };
            });
        });
    }

    function logout() {
        const p = signOut(auth).catch(() => mockAuth.logout());
        try {
            if (window?.storage?.remove) {
                window.storage.remove('auth_currentUser');
                window.storage.remove('auth_users'); // Optional: clear cached users if strict
            } else {
                localStorage.removeItem('auth_currentUser');
            }
        } catch (e) { }
        mockAuth.logout(); // Ensure mock is cleared too
        setCurrentUser(null);
        return p;
    }

    useEffect(() => {
        let unsub = null;
        try {
            unsub = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    let additionalData = {};
                    try {
                        const userDocRef = doc(db, "users", user.uid);
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            additionalData = userDoc.data();
                        }
                    } catch (dbErr) {
                        console.error("Error fetching user profile from DB:", dbErr);
                    }

                    if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
                        return;
                    }

                    const mappedUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        id: user.uid,
                        fullName: additionalData.fullName || user.displayName,
                        photo: additionalData.photo || user.photoURL
                    };
                    setCurrentUser(mappedUser);
                } else {
                    // Check if mock user is logged in
                    if (mockAuth.currentUser) {
                        setCurrentUser(mockAuth.currentUser);
                    } else {
                        setCurrentUser(null);
                    }
                }
                setLoading(false);
            });
        } catch (e) {
            // fallback generic
            if (mockAuth.currentUser) {
                setCurrentUser(mockAuth.currentUser);
            }
            setLoading(false);
        }

        return () => {
            if (typeof unsub === "function") unsub();
        };
    }, []);

    // allow other components to set currentUser locally (persisted)
    // In strict Firebase mode, we generally trust onAuthStateChanged, but checks for profile updates might need this.
    const setCurrentUserLocal = async (user) => {
        setCurrentUser(user);
        // We still keep local storage as a "fast load" cache, but it's not the master.
        try {
            localStorage.setItem('auth_currentUser', JSON.stringify(user));
        } catch (e) { }
    };

    // update profile helper: updates Firestore `users` collection and current user state
    const updateProfile = async (userId, patch) => {
        try {
            const idKey = userId || (currentUser && (currentUser.id || currentUser.uid)) || (auth.currentUser && auth.currentUser.uid);
            if (!idKey) {
                console.error("Debug Info: currentUser", currentUser);
                console.error("Debug Info: auth.currentUser", auth.currentUser);
                throw new Error("No user ID found. Please try logging out and logging back in.");
            }

            // Prepare data for Firestore
            // We store the Base64 photo string directly in the document
            // Prepare data for Firestore
            // We store the Base64 photo string directly in the document
            const firestoreUpdate = { ...patch };
            // Ensure we don't accidentally overwrite critical auth fields if passed (though patch usually comes from controlled form)
            delete firestoreUpdate.id;
            delete firestoreUpdate.uid;

            // Save to Firestore 'users' collection
            // specific error handling for Firestore
            try {
                const userDocRef = doc(db, "users", idKey);
                await setDoc(userDocRef, firestoreUpdate, { merge: true });
            } catch (dbErr) {
                console.error("Firestore update failed", dbErr);
                if (dbErr.code === 'permission-denied') {
                    throw new Error("Database permission denied. Please enable Cloud Firestore in your console (Test Mode).");
                }
                throw new Error("Failed to save profile to database: " + dbErr.message);
            }

            // Also try to update Basic Firebase Auth Profile where possible
            if (auth.currentUser) {
                try {
                    const authPatch = {};
                    if (patch.fullName) authPatch.displayName = patch.fullName;
                    // We CANNOT save large base64 photos to auth.currentUser.photoURL
                    // So we only update displayName here. The photo will come from Firestore.
                    if (Object.keys(authPatch).length > 0) {
                        await updateFirebaseProfile(auth.currentUser, authPatch);
                    }
                } catch (e) { console.warn("Auth profile update warning:", e); }
            }

            // Update Local State ONLY if we are still authenticated as the target user
            // This prevents "Ghost Logins" where a background update finishes after logout
            if (auth.currentUser && (auth.currentUser.uid === idKey)) {
                const merged = { ...currentUser, ...patch };
                setCurrentUser(merged);
            }

            return true;
        } catch (err) {
            console.error('updateProfile failed', err);
            throw err;
        }
    };

    const changePassword = async (userId, newPassword) => {
        if (!auth.currentUser) throw new Error("No user logged in to change password");
        try {
            await updateFirebasePassword(auth.currentUser, newPassword);
            return true;
        } catch (error) {
            console.error("Password update failed", error);
            if (error.code === 'auth/requires-recent-login') {
                throw new Error("Security check: Please logout and login again before changing your password.");
            }
            throw error;
        }
    };

    const value = {
        currentUser,
        signup,
        login,
        logout,
        setCurrentUserLocal,
        updateProfile,
        changePassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
