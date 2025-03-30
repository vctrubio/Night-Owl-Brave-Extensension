/**
 * Utility functions for Night Owl extension
 */

// Storage key constants
const STORAGE_KEYS = {
    SESSIONS: 'sessions',
    SORT_PREFERENCE: 'sortPreference',
    THEME: 'theme',
    SHORTCUTS: 'shortcuts'
};

/**
 * Sorting functions for different sort methods
 */
const sortFunctions = {
    /**
     * Sort sessions by name (alphabetically)
     */
    name: (a, b) => a.name.localeCompare(b.name),
    
    /**
     * Sort sessions by last modified date (newest first)
     */
    date: (a, b) => new Date(b.lastModified) - new Date(a.lastModified),
    
    /**
     * Sort sessions by number of tabs (most tabs first)
     */
    tabs: (a, b) => b.tabs.length - a.tabs.length
};

/**
 * Sort an array of sessions based on the specified sort method
 * @param {Array} sessions - Array of session objects
 * @param {string} method - Sort method ('name', 'date', or 'tabs')
 * @returns {Array} - Sorted array of sessions
 */
function sortSessions(sessions, method) {
    if (!Array.isArray(sessions) || sessions.length === 0) {
        return [];
    }
    
    if (!sortFunctions.hasOwnProperty(method)) {
        // Default to 'name' if method is not recognized
        method = 'name';
    }
    
    return [...sessions].sort(sortFunctions[method]);
}

/**
 * Format a tab count for display
 * @param {number} count - Number of tabs
 * @returns {string} - Formatted string (e.g., "1 tab" or "5 tabs")
 */
function formatTabCount(count) {
    return count === 1 ? "1 tab" : `${count} tabs`;
}

/**
 * Format a date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch (e) {
        return "Unknown date";
    }
}

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Format a URL for display (truncates if too long)
 * @param {string} url - URL to format
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Formatted URL
 */
function formatUrl(url, maxLength = 30) {
    if (url.length <= maxLength) return url;
    
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // If even the domain is too long, truncate it
    if (domain.length >= maxLength - 3) {
        return domain.substring(0, maxLength - 3) + '...';
    }
    
    // Otherwise, show domain + beginning of path
    const pathSpace = maxLength - domain.length - 3;
    if (pathSpace <= 0) return domain;
    
    const path = urlObj.pathname;
    return domain + path.substring(0, pathSpace) + '...';
}

// Storage helper methods
const storageHelper = {
    /**
     * Get value from Chrome storage
     * @param {string|Array<string>} keys - Key(s) to fetch from storage
     * @returns {Promise<Object>} - Promise resolving to storage data
     */
    get: (keys) => {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
        });
    },
    
    /**
     * Set value in Chrome storage
     * @param {Object} data - Key-value pairs to store
     * @returns {Promise<void>} - Promise resolving when storage is updated
     */
    set: (data) => {
        return new Promise((resolve) => {
            chrome.storage.local.set(data, resolve);
        });
    }
};
