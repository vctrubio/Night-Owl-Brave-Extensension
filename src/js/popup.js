/**
 * Main popup controller for Night Owl extension
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM element references - centralized for easy access
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
        exportButton: document.getElementById('exportButton')
    };
    
    let isSettingsVisible = false;
    
    // Initialize the application
    async function initialize() {
        await initializeTheme();
        await initializeSessions();
        focusSessionInput();
    }
    
    /**
     * Focus on session name input
     */
    function focusSessionInput() {
        elements.sessionNameInput.focus();
    }
    
    /**
     * Initialize theme settings
     */
    async function initializeTheme() {
        const theme = await themeManager.loadThemePreference();
        themeManager.applyTheme(theme);
        elements.darkThemeOption.checked = theme === 'dark';
        elements.lightThemeOption.checked = theme === 'light';
    }
    
    /**
     * Initialize sessions display
     */
    async function initializeSessions() {
        await sessionManager.loadSessions();
        updateSortRadioButtons();
        renderSessionsList();
    }
    
    /**
     * Update sort radio buttons to match current sort method
     */
    function updateSortRadioButtons() {
        const method = sessionManager.currentSortMethod;
        elements.sortByNameOption.checked = method === 'name';
        elements.sortByDateOption.checked = method === 'date';
        elements.sortByTabsOption.checked = method === 'tabs';
    }
    
    /**
     * Render the sessions list
     */
    function renderSessionsList() {
        const sortedSessions = sessionManager.getSortedSessions();
        elements.sessionsList.innerHTML = '';
        
        if (sortedSessions.length === 0) {
            showEmptySessionsMessage();
            return;
        }
        
        sortedSessions.forEach(session => {
            const sessionItem = createSessionItem(session);
            elements.sessionsList.appendChild(sessionItem);
        });
    }
    
    /**
     * Show message when no sessions exist
     */
    function showEmptySessionsMessage() {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No sessions saved yet. Save your current tabs to create a session!';
        elements.sessionsList.appendChild(emptyMessage);
    }
    
    /**
     * Create a session item element
     * @param {Object} session - Session object
     * @returns {HTMLElement} - Session item element
     */
    function createSessionItem(session) {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        
        const sessionNameWrapper = createSessionNameWrapper(session);
        const controls = createSessionControls(session);
        
        sessionItem.appendChild(sessionNameWrapper);
        sessionItem.appendChild(controls);
        
        return sessionItem;
    }
    
    /**
     * Create session name wrapper with name and tab count
     * @param {Object} session - Session object
     * @returns {HTMLElement} - Session name wrapper element
     */
    function createSessionNameWrapper(session) {
        const wrapper = document.createElement('div');
        wrapper.className = 'session-name-wrapper';
        
        const sessionName = document.createElement('div');
        sessionName.className = 'session-name';
        sessionName.textContent = session.name;
        sessionName.setAttribute('data-original', session.name);
        sessionName.addEventListener('click', () => makeSessionNameEditable(sessionName, session.name));
        
        const tabCount = document.createElement('span');
        tabCount.className = 'tab-count';
        tabCount.textContent = formatTabCount(session.tabs.length);
        
        wrapper.appendChild(sessionName);
        wrapper.appendChild(tabCount);
        
        return wrapper;
    }
    
    /**
     * Create session controls (Open and Delete buttons)
     * @param {Object} session - Session object
     * @returns {HTMLElement} - Controls element
     */
    function createSessionControls(session) {
        const controls = document.createElement('div');
        controls.className = 'session-controls';
        
        const openButton = createButton('Open', 'open-button', 'Open all tabs in this session');
        openButton.addEventListener('click', () => sessionManager.openSession(session));
        
        const deleteButton = createButton('Delete', 'delete-button', 'Delete this session');
        deleteButton.addEventListener('click', () => handleDeleteSession(session.name));
        
        controls.appendChild(openButton);
        controls.appendChild(deleteButton);
        
        return controls;
    }
    
    /**
     * Create a button element with common properties
     * @param {string} text - Button text
     * @param {string} className - CSS class name
     * @param {string} title - Button title attribute
     * @returns {HTMLElement} - Button element
     */
    function createButton(text, className, title) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = className;
        button.title = title;
        return button;
    }
    
    /**
     * Handle session deletion with confirmation
     * @param {string} sessionName - Name of session to delete
     */
    async function handleDeleteSession(sessionName) {
        if (confirm(`Are you sure you want to delete the session "${sessionName}"?`)) {
            await sessionManager.deleteSession(sessionName);
            renderSessionsList();
        }
    }
    
    /**
     * Make session name editable
     * @param {HTMLElement} element - Name element to make editable
     * @param {string} originalName - Original session name
     */
    function makeSessionNameEditable(element, originalName) {
        const input = createEditInput(originalName);
        const parent = element.parentNode;
        const controlsDiv = parent.parentNode.querySelector('.session-controls');
        
        // Replace name element with input
        parent.replaceChild(input, element);
        
        // Replace Open button with Update button
        const openButton = controlsDiv.querySelector('.open-button');
        const updateButton = createButton('Update', 'open-button', 'Update session name');
        controlsDiv.replaceChild(updateButton, openButton);
        
        // Set up event handlers
        setupEditEventHandlers(input, parent, controlsDiv, originalName, updateButton);
        
        input.focus();
    }
    
    /**
     * Create edit input element
     * @param {string} value - Initial input value
     * @returns {HTMLElement} - Input element
     */
    function createEditInput(value) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.className = 'edit-session-input';
        return input;
    }
    
    /**
     * Set up event handlers for session name editing
     * @param {HTMLElement} input - Input element
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} controlsDiv - Controls container
     * @param {string} originalName - Original session name
     * @param {HTMLElement} updateButton - Update button element
     */
    function setupEditEventHandlers(input, parent, controlsDiv, originalName, updateButton) {
        const saveEdit = () => handleSaveEdit(input, parent, controlsDiv, originalName);
        const revertEdit = () => handleRevertEdit(input, parent, controlsDiv, originalName);
        
        // Keyboard events
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                revertEdit();
            }
        });
        
        // Blur event - revert if empty
        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                revertEdit();
            }
        });
        
        // Update button click
        updateButton.addEventListener('click', saveEdit);
    }
    
    /**
     * Handle saving edited session name
     * @param {HTMLElement} input - Input element
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} controlsDiv - Controls container
     * @param {string} originalName - Original session name
     */
    async function handleSaveEdit(input, parent, controlsDiv, originalName) {
        const newName = input.value.trim();
        
        if (!newName) {
            handleRevertEdit(input, parent, controlsDiv, originalName);
            return;
        }
        
        try {
            const updatedSession = await sessionManager.updateSessionName(originalName, newName);
            if (updatedSession) {
                replaceInputWithName(input, parent, newName);
                resetControlsToOpen(controlsDiv, newName);
            }
        } catch (error) {
            alert(error.message);
            input.focus();
        }
    }
    
    /**
     * Handle reverting edit (cancel editing)
     * @param {HTMLElement} input - Input element
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} controlsDiv - Controls container
     * @param {string} originalName - Original session name
     */
    function handleRevertEdit(input, parent, controlsDiv, originalName) {
        replaceInputWithName(input, parent, originalName);
        resetControlsToOpen(controlsDiv, originalName);
    }
    
    /**
     * Replace input element with session name element
     * @param {HTMLElement} input - Input element to replace
     * @param {HTMLElement} parent - Parent element
     * @param {string} name - Session name
     */
    function replaceInputWithName(input, parent, name) {
        const nameElement = document.createElement('div');
        nameElement.className = 'session-name';
        nameElement.textContent = name;
        nameElement.setAttribute('data-original', name);
        nameElement.addEventListener('click', () => makeSessionNameEditable(nameElement, name));
        
        parent.replaceChild(nameElement, input);
    }
    
    /**
     * Reset controls back to Open button
     * @param {HTMLElement} controlsDiv - Controls container
     * @param {string} sessionName - Session name for open functionality
     */
    function resetControlsToOpen(controlsDiv, sessionName) {
        const updateButton = controlsDiv.querySelector('button');
        const openButton = createButton('Open', 'open-button', 'Open all tabs in this session');
        
        openButton.addEventListener('click', () => {
            const session = sessionManager.getSessionByName(sessionName);
            if (session) sessionManager.openSession(session);
        });
        
        controlsDiv.replaceChild(openButton, updateButton);
    }
    
    /**
     * Toggle settings panel visibility
     */
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
    
    /**
     * Handle save button text updates based on input
     */
    function handleSessionNameInput() {
        const name = elements.sessionNameInput.value.trim();
        const sessionExists = sessionManager.sessionExists(name);
        
        if (sessionExists) {
            elements.saveButton.textContent = 'Update';
            elements.saveButton.title = 'Update existing session';
        } else {
            elements.saveButton.textContent = 'Save';
            elements.saveButton.title = 'Save current tabs';
        }
    }
    
    /**
     * Handle session save
     */
    async function handleSaveSession() {
        const name = elements.sessionNameInput.value.trim();
        if (!name) return;
        
        try {
            await sessionManager.saveSession(name);
            elements.sessionNameInput.value = '';
            elements.saveButton.textContent = 'Save';
            renderSessionsList();
            elements.sessionNameInput.focus();
        } catch (error) {
            console.error('Error saving session:', error);
            alert('Failed to save session');
        }
    }
    
    /**
     * Handle sort option change
     * @param {string} method - Sort method
     */
    function handleSortChange(method) {
        sessionManager.saveSortPreference(method);
        renderSessionsList();
    }
    
    /**
     * Handle theme change
     * @param {string} theme - Theme name
     */
    function handleThemeChange(theme) {
        themeManager.saveThemePreference(theme);
        themeManager.applyTheme(theme);
    }
    
    /**
     * Handle export button click
     */
    async function handleExportSessions() {
        const stats = exportManager.getExportStats();
        
        if (stats.sessions === 0) {
            alert('No sessions to export. Save some sessions first!');
            return;
        }
        
        // Show confirmation with stats
        const confirmMessage = `Export ${stats.sessions} session(s) containing ${stats.urls} URL(s)?`;
        if (confirm(confirmMessage)) {
            try {
                elements.exportButton.disabled = true;
                elements.exportButton.textContent = '📁 Exporting...';
                
                await exportManager.exportSessions();
                
                // Show success message
                alert(`Successfully exported ${stats.sessions} sessions!`);
                
            } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed: ' + error.message);
            } finally {
                // Reset button state
                elements.exportButton.disabled = false;
                elements.exportButton.textContent = '📁 Export Sessions';
            }
        }
    }
    
    // Event Listeners
    elements.saveButton.addEventListener('click', handleSaveSession);
    
    elements.sessionNameInput.addEventListener('input', handleSessionNameInput);
    elements.sessionNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.saveButton.click();
        }
    });
    
    elements.settingsButton.addEventListener('click', toggleSettings);
    
    // Sort option listeners
    elements.sortByNameOption.addEventListener('change', function() {
        if (this.checked) handleSortChange('name');
    });
    elements.sortByDateOption.addEventListener('change', function() {
        if (this.checked) handleSortChange('date');
    });
    elements.sortByTabsOption.addEventListener('change', function() {
        if (this.checked) handleSortChange('tabs');
    });
    
    // Theme option listeners
    elements.darkThemeOption.addEventListener('change', function() {
        if (this.checked) handleThemeChange('dark');
    });
    elements.lightThemeOption.addEventListener('change', function() {
        if (this.checked) handleThemeChange('light');
    });
    
    // Export button listener
    elements.exportButton.addEventListener('click', handleExportSessions);
    
    // Initialize the application
    initialize();
});