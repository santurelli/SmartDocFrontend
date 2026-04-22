
/**
 * Utility functions for date manipulation.
 */

/**
 * Returns a date string in YYYY-MM-DD format for a given date or today.
 * @param {Date} date 
 * @returns {string}
 */
export const formatDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns a date string for N days ago in YYYY-MM-DD format.
 * @param {number} days 
 * @returns {string}
 */
export const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDate(date);
};

/**
 * Returns the default search range (last 30 days).
 * @returns {object} { dataDa: string, dataA: string }
 */
export const getDefaultSearchRange = (days = 30) => {
    return {
        dataDa: getDaysAgo(days),
        dataA: formatDate(new Date())
    };
};
