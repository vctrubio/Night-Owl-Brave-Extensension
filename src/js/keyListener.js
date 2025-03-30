/**
 * Key Listener for Night Owl Extension
 * Handles keyboard shortcuts for quick navigation
 */

// Store shortcuts in Chrome storage
const SHORTCUTS_STORAGE_KEY = 'shortcuts';

/**
 * Initialize keyboard shortcuts listener
 */
function initKeyListener() {
    // Load stored shortcuts
    chrome.storage.local.get([SHORTCUTS_STORAGE_KEY], function(data) {
        const shortcuts = data[SHORTCUTS_STORAGE_KEY] || [];
        
        // Set up event listener for the whole document
        document.addEventListener('keydown', function(event) {
            // Check if Ctrl key is pressed along with a number key
            if (event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
                const num = parseInt(event.key, 10);
                
                // Check if key pressed is a number between 0-9
                if (!isNaN(num) && num >= 0 && num <= 9) {
                    // Find the corresponding shortcut
                    const shortcut = shortcuts.find(s => s.key === num);
                    
                    if (shortcut) {
                        // Prevent default action (like browser shortcut)
                        event.preventDefault();
                        
                        // Log to console to check if the shortcut is triggered
                        console.log(`Ctrl+${num} pressed. Opening: ${shortcut.name} (${shortcut.url})`);

                        // Open the URL in a new tab
                        chrome.tabs.create({ url: shortcut.url });
                        
                        // Log usage
                        console.log(`Opened shortcut ${num}: ${shortcut.name} (${shortcut.url})`);
                    }
                }
            }
        });
    });
}

/**
 * Get all saved shortcuts
 * @returns {Promise<Array>} - Promise that resolves to array of shortcuts
 */
function getShortcuts() {
    return new Promise((resolve) => {
        chrome.storage.local.get([SHORTCUTS_STORAGE_KEY], function(data) {
            resolve(data[SHORTCUTS_STORAGE_KEY] || []);
        });
    });
}

/**
 * Save shortcuts to storage
 * @param {Array} shortcuts - Array of shortcut objects
 * @returns {Promise<void>} - Promise that resolves when shortcuts are saved
 */
function saveShortcuts(shortcuts) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [SHORTCUTS_STORAGE_KEY]: shortcuts }, resolve);
    });
}

/**
 * Add or update a shortcut
 * @param {Object} shortcut - Shortcut object with key, name, and url
 * @returns {Promise<Array>} - Promise that resolves to updated shortcuts array
 */
async function saveShortcut(shortcut) {
    const shortcuts = await getShortcuts();
    const existingIndex = shortcuts.findIndex(s => s.key === shortcut.key);
    
    if (existingIndex >= 0) {
        // Update existing shortcut by removing it first
        shortcuts.splice(existingIndex, 1);
    }
    
    // Add the new or updated shortcut
    shortcuts.push(shortcut);
    
    await saveShortcuts(shortcuts);
    return shortcuts;
}

/**
 * Delete a shortcut by key
 * @param {number} key - The shortcut key to delete
 * @returns {Promise<Array>} - Promise that resolves to updated shortcuts array
 */
async function deleteShortcut(key) {
    const shortcuts = await getShortcuts();
    const updatedShortcuts = shortcuts.filter(s => s.key !== key);
    await saveShortcuts(updatedShortcuts);
    return updatedShortcuts;
}

// Initialize the key listener when the extension loads
if (typeof chrome !== 'undefined' && chrome.runtime) {
    initKeyListener();
}

// Export functions for use in popup.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getShortcuts,
        saveShortcut,
        deleteShortcut
    };
}
