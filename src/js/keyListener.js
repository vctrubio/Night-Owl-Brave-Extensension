/**
 * Key Listener for Night Owl Extension
 * Handles keyboard shortcuts for quick navigation when the popup is open
 * For global shortcuts, see background.js
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
                        
                        // Log to console that we're handling this in popup
                        console.log(`Popup handling Ctrl+${num}. Opening: ${shortcut.name}`);

                        // Send message to background script to open the URL
                        chrome.runtime.sendMessage({
                            action: 'openShortcut',
                            key: num
                        }).catch(err => {
                            // Fallback if background script is not responsive
                            console.log('Fallback: opening URL directly');
                            chrome.tabs.create({ url: shortcut.url });
                        });
                    }
                }
            }
        });
    });
}

// Initialize the key listener when the popup is open
initKeyListener();

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

// Export functions for use in popup.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getShortcuts,
        saveShortcut,
        deleteShortcut
    };
}
