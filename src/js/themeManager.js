/**
 * Theme Manager - Handles theme changes and preferences
 */

const themeManager = {
    currentTheme: 'dark', // Default theme
    
    /**
     * Load theme preference from storage
     * @returns {Promise<string>} - Promise resolving to theme name
     */
    loadThemePreference: async function() {
        const data = await storageHelper.get([STORAGE_KEYS.THEME]);
        if (data[STORAGE_KEYS.THEME]) {
            this.currentTheme = data[STORAGE_KEYS.THEME];
        }
        return this.currentTheme;
    },
    
    /**
     * Save theme preference to storage
     * @param {string} theme - Theme name to save
     * @returns {Promise<void>} - Promise resolving when theme is saved
     */
    saveThemePreference: function(theme) {
        this.currentTheme = theme;
        return storageHelper.set({ [STORAGE_KEYS.THEME]: theme });
    },
    
    /**
     * Apply theme to the document
     * @param {string} theme - Theme name to apply
     */
    applyTheme: function(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }
};
