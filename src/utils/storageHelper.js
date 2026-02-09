/**
 * Utility to manage module-specific search and pagination state in sessionStorage.
 */
const storageHelper = {
    /**
     * Saves the state for a specific module.
     * @param {string} moduleName - Unique name for the feature (e.g., 'articoli', 'preventivi')
     * @param {object} state - The state object to save
     */
    saveState: (moduleName, state) => {
        try {
            const key = `sd_state_${moduleName}`;
            sessionStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error saving state for ${moduleName}:`, error);
        }
    },

    /**
     * Loads the state for a specific module.
     * @param {string} moduleName - Unique name for the feature
     * @param {object} defaultState - Fallback value if no state is saved
     * @returns {object} The saved state or defaultState
     */
    loadState: (moduleName, defaultState) => {
        try {
            const key = `sd_state_${moduleName}`;
            const saved = sessionStorage.getItem(key);
            if (saved) {
                return { ...defaultState, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error(`Error loading state for ${moduleName}:`, error);
        }
        return defaultState;
    },

    /**
     * Clears the state for a specific module.
     * @param {string} moduleName 
     */
    clearState: (moduleName) => {
        const key = `sd_state_${moduleName}`;
        sessionStorage.removeItem(key);
    }
};

export default storageHelper;
