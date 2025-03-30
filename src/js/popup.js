/**
 * Main popup controller for Night Owl extension
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM element references
    const elements = {
        sessionNameInput: document.getElementById('sessionName'),
        saveButton: document.getElementById('saveButton'),
        settingsButton: document.getElementById('settingsButton'),
        sessionsList: document.getElementById('sessionsList'),
        settingsPanel: document.getElementById('settingsPanel'),
        sortByNameOption: document.getElementById('sortByNameOption'),
        sortByDateOption: document.getElementById('sortByDateOption'),
        sortByTabsOption: document.getElementById('sortByTabsOption'),
        darkThemeOption: document.getElementById('darkThemeOption'),
        lightThemeOption: document.getElementById('lightThemeOption'),
        shortcutsList: document.getElementById('shortcutsList'),
        shortcutKey: document.getElementById('shortcutKey'),
        shortcutName: document.getElementById('shortcutName'),
        shortcutUrl: document.getElementById('shortcutUrl'),
        saveShortcutButton: document.getElementById('saveShortcutButton')
    };
    
    let isSettingsVisible = false;
    
    // Initialize the application
    async function initialize() {
        // Load theme and apply it
        const theme = await themeManager.loadThemePreference();
        themeManager.applyTheme(theme);
        elements.darkThemeOption.checked = theme === 'dark';
        elements.lightThemeOption.checked = theme === 'light';
        
        // Load sessions and render them
        await sessionManager.loadSessions();
        updateSortRadioButtons();
        renderSessionsList();
        
        // Load shortcuts
        await loadShortcuts();
    }
    
    // Update sort radio buttons to match current sort method
    function updateSortRadioButtons() {
        elements.sortByNameOption.checked = sessionManager.currentSortMethod === 'name';
        elements.sortByDateOption.checked = sessionManager.currentSortMethod === 'date';
        elements.sortByTabsOption.checked = sessionManager.currentSortMethod === 'tabs';
    }
    
    // Render the sessions list
    function renderSessionsList() {
        const sortedSessions = sessionManager.getSortedSessions();
        elements.sessionsList.innerHTML = '';
        
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
            openButton.addEventListener('click', () => sessionManager.openSession(session));
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.title = 'Delete this session';
            deleteButton.addEventListener('click', () => sessionManager.deleteSession(session.name));
            
            controls.appendChild(openButton);
            controls.appendChild(deleteButton);
            sessionItem.appendChild(controls);
            
            elements.sessionsList.appendChild(sessionItem);
        });
    }
    
    // Make session name editable
    function makeSessionNameEditable(element, originalName) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.className = 'edit-session-input';
        
        const parent = element.parentNode;
        parent.replaceChild(input, element);
        input.focus();
        
        const controlsDiv = parent.querySelector('.session-controls');
        const openButton = controlsDiv.querySelector('.open-button');
        
        const newOpenButton = openButton.cloneNode(true);
        newOpenButton.textContent = 'Update';
        newOpenButton.title = 'Update session name';
        controlsDiv.replaceChild(newOpenButton, openButton);
        
        function saveEditedName() {
            const newName = input.value.trim();
            
            if (!newName) {
                revertEdit();
                return;
            }
            
            const nameExists = sessionManager.sessionExists(newName, originalName);
            if (nameExists) {
                alert('A session with this name already exists.');
                input.focus();
                return;
            }
            
            sessionManager.updateSessionName(originalName, newName)
                .then(() => {
                    const updatedElement = document.createElement('div');
                    updatedElement.className = 'session-name';
                    updatedElement.textContent = newName;
                    updatedElement.setAttribute('data-original', newName);
                    updatedElement.addEventListener('click', function() {
                        makeSessionNameEditable(updatedElement, newName);
                    });
                    
                    parent.replaceChild(updatedElement, input);
                    
                    const finalOpenButton = newOpenButton.cloneNode(false);
                    finalOpenButton.textContent = 'Open';
                    finalOpenButton.title = 'Open all tabs in this session';
                    finalOpenButton.addEventListener('click', () => sessionManager.openSessionByName(newName));
                    controlsDiv.replaceChild(finalOpenButton, newOpenButton);
                });
        }
        
        function revertEdit() {
            const revertElement = document.createElement('div');
            revertElement.className = 'session-name';
            revertElement.textContent = originalName;
            revertElement.setAttribute('data-original', originalName);
            revertElement.addEventListener('click', function() {
                makeSessionNameEditable(revertElement, originalName);
            });
            
            parent.replaceChild(revertElement, input);
            
            const originalSession = sessionManager.getSessionByName(originalName);
            
            const finalOpenButton = newOpenButton.cloneNode(false);
            finalOpenButton.textContent = 'Open';
            finalOpenButton.title = 'Open all tabs in this session';
            finalOpenButton.addEventListener('click', () => sessionManager.openSession(originalSession));
            controlsDiv.replaceChild(finalOpenButton, newOpenButton);
        }
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                revertEdit();
            }
        });
        
        input.addEventListener('blur', function() {
            const newName = input.value.trim();
            if (!newName) {
                revertEdit();
            }
        });
        
        newOpenButton.addEventListener('click', saveEditedName);
    }
    
    async function loadShortcuts() {
        const shortcuts = await shortcutManager.getShortcuts();
        renderShortcuts(shortcuts);
        updateShortcutKeyOptions(shortcuts);
    }
    
    function updateShortcutKeyOptions(shortcuts) {
        Array.from(elements.shortcutKey.options).forEach(option => {
            if (option.value !== "") {
                option.disabled = false;
                option.textContent = option.value;
            }
        });
        
        shortcuts.forEach(shortcut => {
            const option = Array.from(elements.shortcutKey.options).find(opt => opt.value === shortcut.key.toString());
            if (option) {
                option.disabled = true;
                option.textContent = `${option.value} - ${shortcut.name}`;
            }
        });
    }
    
    function renderShortcuts(shortcuts) {
        elements.shortcutsList.innerHTML = '';
        
        if (shortcuts.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-shortcuts';
            emptyMessage.textContent = 'No shortcuts yet. Add one below!';
            elements.shortcutsList.appendChild(emptyMessage);
            return;
        }
        
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
            
            elements.shortcutsList.appendChild(shortcutItem);
        });
    }
    
    async function saveShortcutHandler() {
        const key = parseInt(elements.shortcutKey.value, 10);
        const name = elements.shortcutName.value.trim();
        const url = elements.shortcutUrl.value.trim();
        
        if (isNaN(key) || name === '' || url === '') {
            alert('Please fill in all fields');
            return;
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            alert('URL must start with http:// or https://');
            return;
        }
        
        try {
            const shortcuts = await shortcutManager.getShortcuts();
            const existingShortcut = shortcuts.find(s => s.key === key);
            
            if (existingShortcut) {
                if (!confirm(`Ctrl+${key} is already assigned to "${existingShortcut.name}". Do you want to overwrite it?`)) {
                    return;
                }
            }
            
            const shortcut = { key, name, url };
            const updatedShortcuts = await shortcutManager.saveShortcut(shortcut);
            renderShortcuts(updatedShortcuts);
            updateShortcutKeyOptions(updatedShortcuts);
            
            elements.shortcutKey.value = '';
            elements.shortcutName.value = '';
            elements.shortcutUrl.value = '';
        } catch (error) {
            console.error('Error saving shortcut:', error);
            alert('Failed to save shortcut');
        }
    }
    
    async function deleteShortcutHandler(key) {
        if (confirm('Are you sure you want to delete this shortcut?')) {
            try {
                const updatedShortcuts = await shortcutManager.deleteShortcut(key);
                renderShortcuts(updatedShortcuts);
                updateShortcutKeyOptions(updatedShortcuts);
            } catch (error) {
                console.error('Error deleting shortcut:', error);
                alert('Failed to delete shortcut');
            }
        }
    }
    
    function toggleSettings() {
        isSettingsVisible = !isSettingsVisible;
        
        if (isSettingsVisible) {
            elements.sessionsList.classList.add('hidden');
            elements.settingsPanel.classList.remove('hidden');
            elements.settingsButton.classList.add('active');
        } else {
            elements.sessionsList.classList.remove('hidden');
            elements.settingsPanel.classList.add('hidden');
            elements.settingsButton.classList.remove('active');
        }
    }
    
    elements.saveButton.addEventListener('click', () => {
        sessionManager.saveSession(elements.sessionNameInput.value.trim())
            .then(() => {
                elements.sessionNameInput.value = '';
                elements.saveButton.textContent = 'Save';
                renderSessionsList();
            });
    });
    
    elements.sessionNameInput.addEventListener('input', function() {
        const name = this.value.trim();
        const sessionExists = sessionManager.sessionExists(name);
        
        if (sessionExists) {
            elements.saveButton.textContent = 'Update';
            elements.saveButton.title = 'Update existing session';
        } else {
            elements.saveButton.textContent = 'Save';
            elements.saveButton.title = 'Save current tabs';
        }
    });
    
    elements.sessionNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.saveButton.click();
        }
    });
    
    elements.settingsButton.addEventListener('click', toggleSettings);
    
    elements.sortByNameOption.addEventListener('change', function() {
        if (this.checked) {
            sessionManager.saveSortPreference('name');
            renderSessionsList();
        }
    });
    
    elements.sortByDateOption.addEventListener('change', function() {
        if (this.checked) {
            sessionManager.saveSortPreference('date');
            renderSessionsList();
        }
    });
    
    elements.sortByTabsOption.addEventListener('change', function() {
        if (this.checked) {
            sessionManager.saveSortPreference('tabs');
            renderSessionsList();
        }
    });
    
    elements.darkThemeOption.addEventListener('change', function() {
        if (this.checked) {
            themeManager.saveThemePreference('dark');
            themeManager.applyTheme('dark');
        }
    });
    
    elements.lightThemeOption.addEventListener('change', function() {
        if (this.checked) {
            themeManager.saveThemePreference('light');
            themeManager.applyTheme('light');
        }
    });
    
    elements.saveShortcutButton.addEventListener('click', saveShortcutHandler);
    
    initialize();
});