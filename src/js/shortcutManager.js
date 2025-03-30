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
        console.log('Retrieved shortcuts from storage:', data[STORAGE_KEYS.SHORTCUTS] || []);
        return data[STORAGE_KEYS.SHORTCUTS] || [];
    },
    
    /**
     * Save shortcuts to storage
     * @param {Array} shortcuts - Array of shortcut objects
     * @returns {Promise<void>} - Promise resolving when shortcuts are saved
     */
    saveShortcuts: function(shortcuts) {
        console.log('Saving shortcuts to storage:', shortcuts);
        return storageHelper.set({ [STORAGE_KEYS.SHORTCUTS]: shortcuts });
    },
    
    /**
     * Add or update a shortcut
     * @param {Object} shortcut - Shortcut object with key, name, and url
     * @returns {Promise<Array>} - Promise resolving to updated shortcuts array
     */
    saveShortcut: async function(shortcut) {
        console.log('Saving shortcut:', shortcut);
        const shortcuts = await this.getShortcuts();
        const existingIndex = shortcuts.findIndex(s => s.key === shortcut.key);
        
        if (existingIndex >= 0) {
            console.log(`Updating existing shortcut at index ${existingIndex}`);
            shortcuts.splice(existingIndex, 1);
        }
        
        // Add the new or updated shortcut
        shortcuts.push(shortcut);
        console.log('Updated shortcuts array:', shortcuts);
        
        // Save to storage before notifying background
        await this.saveShortcuts(shortcuts);
        
        // Notify background script to refresh shortcuts
        try {
            if (chrome.runtime && chrome.runtime.sendMessage) {
                console.log('Notifying background script about shortcut update');
                await chrome.runtime.sendMessage({ 
                    action: 'refreshShortcuts',
                    shortcut: shortcut 
                });
                console.log('Background script notification complete');
            }
        } catch (error) {
            console.warn('Could not notify background script:', error);
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
