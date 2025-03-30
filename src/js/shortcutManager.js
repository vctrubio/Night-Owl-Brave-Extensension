/**
 * Shortcut Manager - Handles keyboard shortcuts for the extension
 */

const shortcutManager = {
    /**
     * Get all saved shortcuts
     * @returns {Promise<Array>} - Promise resolving to shortcuts array
     */
    getShortcuts: async function() {
        const data = await storageHelper.get([STORAGE_KEYS.SHORTCUTS]);
        return data[STORAGE_KEYS.SHORTCUTS] || [];
    },
    
    /**
     * Save shortcuts to storage
     * @param {Array} shortcuts - Array of shortcut objects
     * @returns {Promise<void>} - Promise resolving when shortcuts are saved
     */
    saveShortcuts: function(shortcuts) {
        return storageHelper.set({ [STORAGE_KEYS.SHORTCUTS]: shortcuts });
    },
    
    /**
     * Add or update a shortcut
     * @param {Object} shortcut - Shortcut object with key, name, and url
     * @returns {Promise<Array>} - Promise resolving to updated shortcuts array
     */
    saveShortcut: async function(shortcut) {
        const shortcuts = await this.getShortcuts();
        const existingIndex = shortcuts.findIndex(s => s.key === shortcut.key);
        
        if (existingIndex >= 0) {
            // Update existing shortcut by removing it first
            shortcuts.splice(existingIndex, 1);
        }
        
        // Add the new or updated shortcut
        shortcuts.push(shortcut);
        
        await this.saveShortcuts(shortcuts);
        
        // Notify background script to refresh shortcuts
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'refreshShortcuts' })
                .catch(err => console.log('Error notifying background script:', err));
        }
        
        return shortcuts;
    },
    
    /**
     * Delete a shortcut by key
     * @param {number} key - The shortcut key to delete
     * @returns {Promise<Array>} - Promise resolving to updated shortcuts array
     */
    deleteShortcut: async function(key) {
        const shortcuts = await this.getShortcuts();
        const updatedShortcuts = shortcuts.filter(s => s.key !== key);
        await this.saveShortcuts(updatedShortcuts);
        
        // Notify background script to refresh shortcuts
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'refreshShortcuts' })
                .catch(err => console.log('Error notifying background script:', err));
        }
        
        return updatedShortcuts;
    }
};
