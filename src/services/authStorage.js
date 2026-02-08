const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const logout = () => {
    localStorage.removeItem('user');
};

const authStorage = {
    getCurrentUser,
    logout
};

export default authStorage;
