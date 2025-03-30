/**
 * Background script for Night Owl Browser Extension
 * Handles global keyboard shortcuts regardless of popup state
 */

// Store shortcuts in memory for quick access
let cachedShortcuts = [];

// Initialize: load shortcuts on extension startup
loadShortcutsFromStorage();

/**
 * Load shortcuts from storage to memory cache
 */
function loadShortcutsFromStorage() {
    chrome.storage.local.get(['shortcuts'], function(data) {
        cachedShortcuts = data.shortcuts || [];
        console.log('Shortcuts loaded into memory:', cachedShortcuts);
    });
}

// Listen for keyboard shortcuts registered in manifest
chrome.commands.onCommand.addListener(function(command) {
    console.log('Command received:', command);
    
    if (command === '_execute_action') {
        // This is the command to open the extension popup
        console.log('Opening extension popup');
    }
    else if (command.startsWith('open-shortcut-')) {
        const shortcutKey = parseInt(command.replace('open-shortcut-', ''), 10);
        openShortcutByKey(shortcutKey);
    }
});

/**
 * Open a shortcut by its numeric key
 * @param {number} key - The shortcut key (0-9)
 */
function openShortcutByKey(key) {
    console.log('Looking for shortcut with key:', key);
    
    // Get fresh data from storage to ensure we have the latest
    chrome.storage.local.get(['shortcuts'], function(data) {
        const shortcuts = data.shortcuts || [];
        const shortcut = shortcuts.find(s => s.key === key);
        
        if (shortcut) {
            console.log(`Opening shortcut ${key}: ${shortcut.name} (${shortcut.url})`);
            chrome.tabs.create({ url: shortcut.url });
        } else {
            console.log(`No shortcut found for key ${key}`);
        }
    });
}

// Listen for changes to shortcuts in storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.shortcuts) {
        console.log('Shortcuts updated in storage, refreshing memory cache');
        cachedShortcuts = changes.shortcuts.newValue || [];
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Background script received message:', request);
    
    if (request.action === 'openShortcut' && typeof request.key === 'number') {
        openShortcutByKey(request.key);
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'refreshShortcuts') {
        loadShortcutsFromStorage();
        sendResponse({ success: true });
        return true;
    }
    
    return false;
});

// Log when the background script is initialized
console.log('Night Owl background script initialized');
