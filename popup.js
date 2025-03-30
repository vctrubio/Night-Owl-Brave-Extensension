document.addEventListener('DOMContentLoaded', function() {
    const sessionNameInput = document.getElementById('sessionName');
    const saveButton = document.getElementById('saveButton');
    const settingsButton = document.getElementById('settingsButton');
    const sessionsList = document.getElementById('sessionsList');
    const settingsPanel = document.getElementById('settingsPanel');
    const sortByNameOption = document.getElementById('sortByNameOption');
    const sortByDateOption = document.getElementById('sortByDateOption');
    const darkThemeOption = document.getElementById('darkThemeOption');
    const lightThemeOption = document.getElementById('lightThemeOption');
    const sortByTabsOption = document.getElementById('sortByTabsOption');
    const shortcutsList = document.getElementById('shortcutsList');
    const shortcutKey = document.getElementById('shortcutKey');
    const shortcutName = document.getElementById('shortcutName');
    const shortcutUrl = document.getElementById('shortcutUrl');
    const saveShortcutButton = document.getElementById('saveShortcutButton');
    
    let sessions = [];
    let currentSortMethod = 'name'; // Default sort method
    let isSettingsVisible = false;
    let currentTheme = 'dark'; // Default theme
    
    // Load existing sessions, sort preference, theme preference, and shortcuts
    function loadSessions() {
        chrome.storage.local.get(['sessions', 'sortPreference', 'theme'], function(data) {
            if (data.sessions) {
                sessions = data.sessions;
            }
            
            // Apply saved sort preference if available
            if (data.sortPreference) {
                currentSortMethod = data.sortPreference;
                
                // Update radio buttons to reflect current sort method
                sortByNameOption.checked = currentSortMethod === 'name';
                sortByDateOption.checked = currentSortMethod === 'date';
                sortByTabsOption.checked = currentSortMethod === 'tabs';
            }
            
            // Apply saved theme if available
            if (data.theme) {
                currentTheme = data.theme;
                applyTheme(currentTheme);
                
                // Update radio buttons to reflect current theme
                darkThemeOption.checked = currentTheme === 'dark';
                lightThemeOption.checked = currentTheme === 'light';
            }
            
            renderSessionsList(currentSortMethod);
            
            // Load shortcuts
            loadShortcuts();
        });
    }
    
    // Function to apply the theme
    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }
    
    // Save theme preference to local storage
    function saveThemePreference(theme) {
        chrome.storage.local.set({ theme: theme });
    }
    
    // Save sort preference to local storage
    function saveSortPreference(method) {
        chrome.storage.local.set({ sortPreference: method });
    }
    
    // Save or update a session
    function saveSession() {
        const name = sessionNameInput.value.trim();
        if (!name) return;
        
        // Get current tabs
        chrome.tabs.query({currentWindow: true}, function(tabs) {
            const tabUrls = tabs.map(tab => ({
                url: tab.url,
                title: tab.title
            }));
            
            const existingSessionIndex = sessions.findIndex(s => s.name === name);
            const timestamp = new Date().toISOString();
            
            if (existingSessionIndex >= 0) {
                // Update existing session
                sessions[existingSessionIndex] = {
                    name: name,
                    tabs: tabUrls,
                    lastModified: timestamp
                };
            } else {
                // Create new session
                sessions.push({
                    name: name,
                    tabs: tabUrls,
                    lastModified: timestamp
                });
            }
            
            // Save to storage
            chrome.storage.local.set({sessions: sessions}, function() {
                sessionNameInput.value = '';
                saveButton.textContent = 'Save';
                renderSessionsList();
            });
        });
    }
    
    // Check if session name exists as user types
    sessionNameInput.addEventListener('input', function() {
        const name = sessionNameInput.value.trim();
        const sessionExists = sessions.some(session => session.name === name);
        
        if (sessionExists) {
            saveButton.textContent = 'Update';
            saveButton.title = 'Update existing session';
        } else {
            saveButton.textContent = 'Save';
            saveButton.title = 'Save current tabs';
        }
    });
    
    // Toggle between sessions list and settings panel
    function toggleSettings() {
        isSettingsVisible = !isSettingsVisible;
        
        if (isSettingsVisible) {
            sessionsList.classList.add('hidden');
            settingsPanel.classList.remove('hidden');
            settingsButton.classList.add('active');
        } else {
            sessionsList.classList.remove('hidden');
            settingsPanel.classList.add('hidden');
            settingsButton.classList.remove('active');
        }
    }
    
    // Add event listener for Enter key on session name input
    sessionNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission behavior
            saveSession();
        }
    });
    
    // Render the sessions list
    function renderSessionsList(sortMethod = currentSortMethod) {
        // Update current sort method
        currentSortMethod = sortMethod;
        
        // Save the sort preference
        saveSortPreference(currentSortMethod);
        
        // Sort sessions using the utility function
        const sortedSessions = sortSessions(sessions, sortMethod);
        
        // Clear the current list
        sessionsList.innerHTML = '';
        
        // Create session elements
        sortedSessions.forEach(session => {
            const sessionItem = document.createElement('div');
            sessionItem.className = 'session-item';
            
            const sessionNameWrapper = document.createElement('div');
            sessionNameWrapper.className = 'session-name-wrapper';
            
            const sessionName = document.createElement('div');
            sessionName.className = 'session-name';
            sessionName.textContent = session.name;
            sessionName.setAttribute('data-original', session.name);
            sessionName.addEventListener('click', function() {
                makeSessionNameEditable(sessionName, session.name);
            });
            
            const tabCount = document.createElement('span');
            tabCount.className = 'tab-count';
            tabCount.textContent = formatTabCount(session.tabs.length);
            
            sessionNameWrapper.appendChild(sessionName);
            sessionNameWrapper.appendChild(tabCount);
            sessionItem.appendChild(sessionNameWrapper);
            
            const controls = document.createElement('div');
            controls.className = 'session-controls';
            
            const openButton = document.createElement('button');
            openButton.textContent = 'Open';
            openButton.title = 'Open all tabs in this session';
            openButton.className = 'open-button';
            openButton.addEventListener('click', () => openSession(session));
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.title = 'Delete this session';
            deleteButton.addEventListener('click', () => deleteSession(session.name));
            
            controls.appendChild(openButton);
            controls.appendChild(deleteButton);
            sessionItem.appendChild(controls);
            
            sessionsList.appendChild(sessionItem);
        });
    }
    
    // Make session name editable
    function makeSessionNameEditable(element, originalName) {
        // Create input element to replace the text
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.className = 'edit-session-input';
        
        // Replace the text element with input
        const parent = element.parentNode;
        parent.replaceChild(input, element);
        input.focus();
        
        // Find the related buttons
        const controlsDiv = parent.querySelector('.session-controls');
        const openButton = controlsDiv.querySelector('.open-button');
        
        // Clone the button to remove all event listeners
        const newOpenButton = openButton.cloneNode(true);
        newOpenButton.textContent = 'Update';
        newOpenButton.title = 'Update session name';
        controlsDiv.replaceChild(newOpenButton, openButton);
        
        // Save function for the edited name
        function saveEditedName() {
            const newName = input.value.trim();
            
            // If empty, revert to original
            if (!newName) {
                revertEdit();
                return;
            }
            
            // Check if name already exists (other than original)
            const nameExists = sessions.some(s => s.name === newName && s.name !== originalName);
            if (nameExists) {
                alert('A session with this name already exists.');
                input.focus();
                return;
            }
            
            // Update session name in the array
            const sessionIndex = sessions.findIndex(s => s.name === originalName);
            if (sessionIndex >= 0) {
                const sessionToUpdate = {...sessions[sessionIndex], name: newName};
                sessions[sessionIndex] = sessionToUpdate;
                
                // Save to storage
                chrome.storage.local.set({sessions: sessions}, function() {
                    // Replace input with text element
                    const updatedElement = document.createElement('div');
                    updatedElement.className = 'session-name';
                    updatedElement.textContent = newName;
                    updatedElement.setAttribute('data-original', newName);
                    updatedElement.addEventListener('click', function() {
                        makeSessionNameEditable(updatedElement, newName);
                    });
                    
                    parent.replaceChild(updatedElement, input);
                    
                    // Replace the update button with a new open button
                    const finalOpenButton = newOpenButton.cloneNode(false);
                    finalOpenButton.textContent = 'Open';
                    finalOpenButton.title = 'Open all tabs in this session';
                    finalOpenButton.addEventListener('click', () => openSession(sessionToUpdate));
                    controlsDiv.replaceChild(finalOpenButton, newOpenButton);
                });
            }
        }
        
        // Cancel edit function
        function revertEdit() {
            const revertElement = document.createElement('div');
            revertElement.className = 'session-name';
            revertElement.textContent = originalName;
            revertElement.setAttribute('data-original', originalName);
            revertElement.addEventListener('click', function() {
                makeSessionNameEditable(revertElement, originalName);
            });
            
            parent.replaceChild(revertElement, input);
            
            // Find original session to restore open functionality
            const originalSession = sessions.find(s => s.name === originalName);
            
            // Replace update button with a fresh open button
            const finalOpenButton = newOpenButton.cloneNode(false);
            finalOpenButton.textContent = 'Open';
            finalOpenButton.title = 'Open all tabs in this session';
            finalOpenButton.addEventListener('click', () => openSession(originalSession));
            controlsDiv.replaceChild(finalOpenButton, newOpenButton);
        }
        
        // Set up event handlers for input
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Don't automatically save on Enter - require explicit button click
                input.blur(); // Just remove focus from the input
            } else if (e.key === 'Escape') {
                revertEdit();
            }
        });
        
        // Change blur behavior to not automatically save
        input.addEventListener('blur', function() {
            // Don't automatically save on blur - user must click update button
            // Only prevent empty input to revert back
            const newName = input.value.trim();
            if (!newName) {
                revertEdit();
            }
        });
        
        // The Update button is now the only way to save changes
        newOpenButton.addEventListener('click', saveEditedName);
    }
    
    // Open a session
    function openSession(session) {
        // Extract the URLs from the session
        const urls = session.tabs.map(tab => tab.url);
        
        // Create a new window with the session tabs
        chrome.windows.create({
            url: urls,
            focused: true
        });
    }
    
    // Delete a session
    function deleteSession(sessionName) {
        sessions = sessions.filter(s => s.name !== sessionName);
        chrome.storage.local.set({sessions: sessions}, function() {
            renderSessionsList();
        });
    }
    
    // Load shortcuts and display them
    async function loadShortcuts() {
        const shortcuts = await getShortcuts();
        renderShortcuts(shortcuts);
        updateShortcutKeyOptions(shortcuts);
    }
    
    // Update shortcut key dropdown to reflect taken keys
    function updateShortcutKeyOptions(shortcuts) {
        // Reset all options to be enabled first
        Array.from(shortcutKey.options).forEach(option => {
            if (option.value !== "") {  // Skip the placeholder
                option.disabled = false;
                option.textContent = option.value;  // Reset any modified text
            }
        });
        
        // Mark taken keys as disabled
        shortcuts.forEach(shortcut => {
            const option = Array.from(shortcutKey.options).find(opt => opt.value === shortcut.key.toString());
            if (option) {
                option.disabled = true;
                option.textContent = `${option.value} - ${shortcut.name}`;
            }
        });
    }
    
    // Render shortcuts list
    function renderShortcuts(shortcuts) {
        shortcutsList.innerHTML = '';
        
        if (shortcuts.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-shortcuts';
            emptyMessage.textContent = 'No shortcuts yet. Add one below!';
            shortcutsList.appendChild(emptyMessage);
            return;
        }
        
        // Sort shortcuts by key
        shortcuts.sort((a, b) => a.key - b.key);
        
        shortcuts.forEach(shortcut => {
            const shortcutItem = document.createElement('div');
            shortcutItem.className = 'shortcut-item';
            
            const keyBadge = document.createElement('span');
            keyBadge.className = 'key-badge';
            keyBadge.textContent = shortcut.key;
            
            const shortcutDetails = document.createElement('div');
            shortcutDetails.className = 'shortcut-details';
            
            const shortcutNameEl = document.createElement('div');
            shortcutNameEl.className = 'shortcut-name';
            shortcutNameEl.textContent = shortcut.name;
            
            const shortcutUrlEl = document.createElement('div');
            shortcutUrlEl.className = 'shortcut-url';
            shortcutUrlEl.textContent = shortcut.url;
            
            shortcutDetails.appendChild(shortcutNameEl);
            shortcutDetails.appendChild(shortcutUrlEl);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-shortcut';
            deleteButton.innerHTML = '×';
            deleteButton.title = 'Delete shortcut';
            deleteButton.addEventListener('click', () => deleteShortcutHandler(shortcut.key));
            
            shortcutItem.appendChild(keyBadge);
            shortcutItem.appendChild(shortcutDetails);
            shortcutItem.appendChild(deleteButton);
            
            shortcutsList.appendChild(shortcutItem);
        });
    }
    
    // Handle save shortcut button click
    async function saveShortcutHandler() {
        const key = parseInt(shortcutKey.value, 10);
        const name = shortcutName.value.trim();
        const url = shortcutUrl.value.trim();
        
        if (isNaN(key) || name === '' || url === '') {
            alert('Please fill in all fields');
            return;
        }
        
        // Basic URL validation
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            alert('URL must start with http:// or https://');
            return;
        }
        
        try {
            // Check if key is already taken
            const shortcuts = await getShortcuts();
            const existingShortcut = shortcuts.find(s => s.key === key);
            
            if (existingShortcut) {
                if (!confirm(`Ctrl+${key} is already assigned to "${existingShortcut.name}". Do you want to overwrite it?`)) {
                    return;
                }
            }
            
            const shortcut = { key, name, url };
            const updatedShortcuts = await saveShortcut(shortcut);
            renderShortcuts(updatedShortcuts);
            updateShortcutKeyOptions(updatedShortcuts);
            
            // Clear form
            shortcutKey.value = '';
            shortcutName.value = '';
            shortcutUrl.value = '';
        } catch (error) {
            console.error('Error saving shortcut:', error);
            alert('Failed to save shortcut');
        }
    }
    
    // Handle delete shortcut button click
    async function deleteShortcutHandler(key) {
        if (confirm('Are you sure you want to delete this shortcut?')) {
            try {
                const updatedShortcuts = await deleteShortcut(key);
                renderShortcuts(updatedShortcuts);
                updateShortcutKeyOptions(updatedShortcuts);
            } catch (error) {
                console.error('Error deleting shortcut:', error);
                alert('Failed to delete shortcut');
            }
        }
    }
    
    // Add event listeners
    saveButton.addEventListener('click', saveSession);
    
    settingsButton.addEventListener('click', toggleSettings);
    
    // Radio button event listeners
    sortByNameOption.addEventListener('change', function() {
        if (this.checked) {
            renderSessionsList('name');
        }
    });
    
    sortByDateOption.addEventListener('change', function() {
        if (this.checked) {
            renderSessionsList('date');
        }
    });
    
    sortByTabsOption.addEventListener('change', function() {
        if (this.checked) {
            renderSessionsList('tabs');
        }
    });
    
    // Theme radio button event listeners
    darkThemeOption.addEventListener('change', function() {
        if (this.checked) {
            currentTheme = 'dark';
            applyTheme(currentTheme);
            saveThemePreference(currentTheme);
        }
    });
    
    lightThemeOption.addEventListener('change', function() {
        if (this.checked) {
            currentTheme = 'light';
            applyTheme(currentTheme);
            saveThemePreference(currentTheme);
        }
    });
    
    saveShortcutButton.addEventListener('click', saveShortcutHandler);
    
    // Initialize
    loadSessions();
});
