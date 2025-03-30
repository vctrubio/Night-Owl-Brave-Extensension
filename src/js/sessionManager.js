/**
 * Session Manager - Handles tab session operations
 */

// Session manager namespace
const sessionManager = {
    sessions: [],
    currentSortMethod: 'name',
    
    /**
     * Load sessions from storage
     * @returns {Promise<Array>} - Promise resolving to sessions array
     */
    loadSessions: async function() {
        const data = await storageHelper.get([STORAGE_KEYS.SESSIONS, STORAGE_KEYS.SORT_PREFERENCE]);
        
        if (data[STORAGE_KEYS.SESSIONS]) {
            this.sessions = data[STORAGE_KEYS.SESSIONS];
        }
        
        if (data[STORAGE_KEYS.SORT_PREFERENCE]) {
            this.currentSortMethod = data[STORAGE_KEYS.SORT_PREFERENCE];
        }
        
        return this.sessions;
    },
    
    /**
     * Save session sorting preference
     * @param {string} method - Sorting method to save
     */
    saveSortPreference: function(method) {
        this.currentSortMethod = method;
        storageHelper.set({ [STORAGE_KEYS.SORT_PREFERENCE]: method });
    },
    
    /**
     * Save a new session or update an existing one
     * @param {string} name - Session name
     * @returns {Promise<void>} - Promise resolving when session is saved
     */
    saveSession: async function(name) {
        if (!name.trim()) return;
        
        try {
            const tabs = await new Promise((resolve) => {
                chrome.tabs.query({currentWindow: true}, (tabs) => {
                    resolve(tabs.map(tab => ({
                        url: tab.url,
                        title: tab.title
                    })));
                });
            });
            
            const existingSessionIndex = this.sessions.findIndex(s => s.name === name);
            const timestamp = new Date().toISOString();
            
            if (existingSessionIndex >= 0) {
                // Update existing session
                this.sessions[existingSessionIndex] = {
                    name: name,
                    tabs: tabs,
                    lastModified: timestamp
                };
            } else {
                // Create new session
                this.sessions.push({
                    name: name,
                    tabs: tabs,
                    lastModified: timestamp
                });
            }
            
            await storageHelper.set({[STORAGE_KEYS.SESSIONS]: this.sessions});
            return this.sessions;
            
        } catch (error) {
            console.error('Error saving session:', error);
            throw error;
        }
    },
    
    /**
     * Delete a session by name
     * @param {string} sessionName - Name of the session to delete
     * @returns {Promise<Array>} - Promise resolving to updated sessions array
     */
    deleteSession: async function(sessionName) {
        if (!sessionName) return this.sessions;
        
        this.sessions = this.sessions.filter(s => s.name !== sessionName);
        await storageHelper.set({[STORAGE_KEYS.SESSIONS]: this.sessions});
        
        return this.sessions;
    },
    
    /**
     * Open a session in a new window
     * @param {Object} session - Session object to open
     */
    openSession: function(session) {
        const urls = session.tabs.map(tab => tab.url);
        
        chrome.windows.create({
            url: urls,
            focused: true
        });
    },
    
    /**
     * Open a session by name
     * @param {string} sessionName - Name of the session to open
     */
    openSessionByName: function(sessionName) {
        const session = this.sessions.find(s => s.name === sessionName);
        if (session) {
            this.openSession(session);
        }
    },
    
    /**
     * Update a session name
     * @param {string} originalName - Original session name
     * @param {string} newName - New session name
     * @returns {Promise<Object|null>} - Promise resolving to updated session or null if not found
     */
    updateSessionName: async function(originalName, newName) {
        if (!newName.trim()) return null;
        
        // Check if name exists (other than original)
        const nameExists = this.sessions.some(s => s.name === newName && s.name !== originalName);
        if (nameExists) {
            throw new Error('A session with this name already exists.');
        }
        
        const sessionIndex = this.sessions.findIndex(s => s.name === originalName);
        if (sessionIndex < 0) return null;
        
        // Update session name and lastModified timestamp
        this.sessions[sessionIndex].name = newName;
        this.sessions[sessionIndex].lastModified = new Date().toISOString(); // Update timestamp
        await storageHelper.set({[STORAGE_KEYS.SESSIONS]: this.sessions});
        
        return this.sessions[sessionIndex];
    },
    
    /**
     * Check if a session with the given name exists
     * @param {string} name - Session name to check
     * @returns {boolean} - Whether the session exists
     */
    sessionExists: function(name) {
        return this.sessions.some(session => session.name === name);
    },
    
    /**
     * Get a session by name
     * @param {string} sessionName - Name of the session to get
     * @returns {Object|null} - Session object or null if not found
     */
    getSessionByName: function(sessionName) {
        return this.sessions.find(s => s.name === sessionName) || null;
    },
    
    /**
     * Get a sorted list of sessions
     * @param {string} [sortMethod=currentSortMethod] - Method to sort by
     * @returns {Array} - Sorted array of sessions
     */
    getSortedSessions: function(sortMethod = this.currentSortMethod) {
        return sortSessions(this.sessions, sortMethod);
    }
};
