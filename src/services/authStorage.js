const getCurrentUser = () => {
    try {
        const userStr = sessionStorage.getItem('user');
        if (!userStr) return null;
        
        const user = JSON.parse(userStr);
        if (!user || !user.token) return null;

        // Proactive token expiration check
        try {
            const payload = JSON.parse(atob(user.token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                console.warn("Token expired, logging out...");
                logout();
                return null;
            }
        } catch (e) {
            console.error("Error checking token expiration", e);
        }

        return user;
    } catch (error) {
        console.error("Error reading current user", error);
        return null;
    }
};

const logout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('appConfig');
};

const authStorage = {
    getCurrentUser,
    logout
};

export default authStorage;
