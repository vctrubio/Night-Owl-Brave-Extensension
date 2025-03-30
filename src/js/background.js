/**
 * Background script for Night Owl Browser Extension
 * Handles global keyboard shortcuts regardless of popup state
 */

console.log('Night Owl background script initialized');

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
        console.log('Opening extension popup');
        // Chrome handles this automatically, no action needed
    }
    else if (command.startsWith('shortcut-')) {
        // Extract the key number (1-3) from the command
        const keyNumber = parseInt(command.replace('shortcut-', ''), 10);
        if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 3) {
            openShortcutByKey(keyNumber);
        }
    }
});

/**
 * Open a shortcut by its numeric key
 * @param {number} key - The shortcut key (1-3)
 */
function openShortcutByKey(key) {
    console.log('Looking for shortcut with key:', key);
    
    // Get fresh data from storage to ensure we have the latest
    chrome.storage.local.get(['shortcuts'], function(data) {
        const shortcuts = data.shortcuts || [];
        console.log('Available shortcuts:', shortcuts);
        
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
        console.log('Old shortcuts:', changes.shortcuts.oldValue);
        console.log('New shortcuts:', changes.shortcuts.newValue);
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
        console.log('Shortcuts reloaded. New shortcuts:', cachedShortcuts);
        sendResponse({ success: true });
        return true;
    }
    
    return false;
});
