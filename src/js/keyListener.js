/**
 * Key Listener for Night Owl Extension
 * Handles keyboard shortcuts for quick navigation
 */

/**
 * Initialize keyboard shortcuts listener
 */
function initKeyListener() {
    // Load stored shortcuts
    shortcutManager.getShortcuts().then(shortcuts => {
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

// Initialize the key listener when the extension loads
if (typeof chrome !== 'undefined' && chrome.runtime) {
    initKeyListener();
}
