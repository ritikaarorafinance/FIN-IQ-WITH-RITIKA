
import { db, auth } from "../firebase";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    arrayUnion,
    serverTimestamp,
    query,
    where,
    collectionGroup
} from "firebase/firestore";

/**
 * Save a quiz result for a user.
 * ...
 */
export const saveQuizResult = async (userId, resultData) => {
    // ... (start of saveQuizResult) match existing context or just replace imports

    try {
        if (!userId) throw new Error("User ID is required");

        // Reference to the user's document
        const userRef = doc(db, "users", userId);

        // We will store results in a subcollection called 'quiz_results'
        // This scales better than a single array if the user takes many quizzes
        const resultRef = doc(collection(userRef, "quiz_results"));

        await setDoc(resultRef, {
            ...resultData,
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
        });

        // Also update a summary in the main user doc for easier access if needed
        // Or strictly strictly rely on subcollection. 
        // For admin ease, let's also push to a 'recent_results' array in user doc
        await setDoc(userRef, {
            lastActive: serverTimestamp(),
            email: auth.currentUser?.email,
            displayName: auth.currentUser?.displayName // Ensure basics are there
        }, { merge: true });

        return true;
    } catch (error) {
        console.error("Error saving quiz result:", error);
        throw error;
    }
};

/**
 * Fetch all quiz history for a specific user.
 * @param {string} userId 
 */
export const getStudentHistory = async (userId) => {
    try {
        if (!userId) return [];
        const resultsRef = collection(db, "users", userId, "quiz_results");
        const snapshot = await getDocs(resultsRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

/**
 * Fetch all users and their quiz results (For Admin).
 * Note: This can be expensive if there are thousands of users.
 */
/**
 * Fetch ALL quiz results from the entire database (Collection Group Query).
 * This is the most robust way to get Admin data.
 */
export const getAllAdminResults = async () => {
    try {
        // Query all collections named 'quiz_results' regardless of parent
        const q = query(collectionGroup(db, 'quiz_results'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure we have student info attached (from new records)
            // If old records missing name, we might see "Unknown", but that's acceptable for now.
            return {
                id: doc.id,
                ...data
            };
        });
    } catch (error) {
        console.error("Error fetching admin results:", error);
        throw error;
    }
};

/**
 * Fetch All Users for Admin Student Directory
 */
export const getAllUsers = async () => {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

/**
 * Legacy support or Full User Dump if needed
 */
export const getAllStudentsData = async () => {
    return getAllAdminResults(); // re-route to new logic if anyone calls this
};

/**
 * Sync (Merge) local quiz state for Work-In-Progress quizzes.
 * This effectively replaces the useQuizState localStorage logic.
 */
export const saveQuizProgress = async (userId, listId, state) => {
    try {
        if (!userId) return;
        const progressRef = doc(db, "users", userId, "quiz_progress", listId);
        await setDoc(progressRef, {
            state: JSON.stringify(state),
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.warn("Failed to save progress remotely", e);
    }
};

export const getQuizProgress = async (userId, listId) => {
    try {
        if (!userId) return null;
        const progressRef = doc(db, "users", userId, "quiz_progress", listId);
        const docSnap = await getDoc(progressRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.state ? JSON.parse(data.state) : null;
        }
        return null;
    } catch (e) {
        console.warn("Failed to fetch progress", e);
        return null;
    }
}
/**
 * Fetch all feedback submissions
 */
export const getAllFeedback = async () => {
    try {
        const q = query(collection(db, "feedback"));
        // Client-side sort is safer if index is missing
        const snapshot = await getDocs(q);
        const feedback = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Sort by submittedAt desc
        return feedback.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return [];
    }
};

/**
 * Fetch Admin Credentials from Firestore
 */
export const getAdminSettings = async () => {
    try {
        const docRef = doc(db, "settings", "admin");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching admin settings:", error);
        return null;
    }
};

/**
 * Update Admin Credentials in Firestore
 */
export const updateAdminSettings = async (newCreds) => {
    try {
        const docRef = doc(db, "settings", "admin");
        await setDoc(docRef, newCreds, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating admin settings:", error);
        throw error;
    }
};
