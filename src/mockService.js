// This acts as a local database simulation using localStorage
// allowing the app to work without valid Firebase credentials.

// --- AUTHENTICATION ---

export const mockAuth = {
    currentUser: JSON.parse(localStorage.getItem("mock_user")),

    signup: async (email, password) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const existingUsers = JSON.parse(localStorage.getItem("mock_users_db") || "[]");

        // Check if user exists
        const found = existingUsers.find(u => u.email === email);
        if (found) throw new Error("User already exists");

        const user = {
            uid: "local_" + Date.now(),
            email,
            password
        };

        existingUsers.push(user);
        localStorage.setItem("mock_users_db", JSON.stringify(existingUsers));

        localStorage.setItem("mock_user", JSON.stringify(user));
        mockAuth.currentUser = user;
        return user;
    },

    login: async (email, password) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const existingUsers = JSON.parse(localStorage.getItem("mock_users_db") || "[]");
        const found = existingUsers.find(u => u.email === email && u.password === password);

        // Fallback for demo: if user not found in DB but trying to login (old behavior), just create a volatile one
        // OR better: Just create a "Guest" account that persists so next login works
        if (!found) {
            throw new Error("Invalid email or password");
        }
        const user = found;

        localStorage.setItem("mock_user", JSON.stringify(user));
        mockAuth.currentUser = user;
        return user;
    },

    logout: async () => {
        localStorage.removeItem("mock_user");
        mockAuth.currentUser = null;
    }
};

// --- DATABASE ---

export const mockDb = {
    // Save a quiz result
    saveResult: async (resultData) => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const existing = JSON.parse(localStorage.getItem("mock_results") || "[]");
        const newResult = {
            id: "res_" + Date.now(),
            ...resultData
        };
        existing.push(newResult);
        localStorage.setItem("mock_results", JSON.stringify(existing));
        return newResult;
    },

    // Get results for a user
    getUserHistory: async (userId) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const existing = JSON.parse(localStorage.getItem("mock_results") || "[]");
        // Filter by userId and sort by timestamp desc
        return existing
            .filter(r => r.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
};
