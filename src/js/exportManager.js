/**
 * Export Manager - Handles exporting sessions data
 */

const exportManager = {
    /**
     * Export all sessions to JSON format and download
     * @returns {Promise<void>} - Promise resolving when export is complete
     */
    exportSessions: async function() {
        try {
            // Get all sessions from sessionManager
            const sessions = sessionManager.sessions;
            
            if (!sessions || sessions.length === 0) {
                alert('No sessions to export. Save some sessions first!');
                return;
            }
            
            // Transform sessions into the desired format
            const exportData = this.transformSessionsForExport(sessions);
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `night-owl-sessions-${timestamp}.json`;
            
            // Create and download the file
            await this.downloadJson(exportData, filename);
            
            console.log(`Exported ${sessions.length} sessions to ${filename}`);
            
        } catch (error) {
            console.error('Error exporting sessions:', error);
            alert('Failed to export sessions: ' + error.message);
        }
    },
    
    /**
     * Transform sessions array into export format
     * @param {Array} sessions - Array of session objects
     * @returns {Object} - Transformed data with session names as keys and URLs as arrays
     */
    transformSessionsForExport: function(sessions) {
        const exportData = {};
        
        sessions.forEach(session => {
            // Use session name as key
            const sessionName = session.name;
            
            // Extract URLs from tabs
            const urls = session.tabs.map(tab => tab.url).filter(url => url && url.trim() !== '');
            
            // Add to export data
            exportData[sessionName] = urls;
        });
        
        return exportData;
    },
    
    /**
     * Download JSON data as a file
     * @param {Object} data - Data to export
     * @param {string} filename - Name of the file to download
     * @returns {Promise<void>} - Promise resolving when download starts
     */
    downloadJson: function(data, filename) {
        return new Promise((resolve, reject) => {
            try {
                // Convert data to JSON string with pretty formatting
                const jsonString = JSON.stringify(data, null, 2);
                
                // Create blob
                const blob = new Blob([jsonString], { type: 'application/json' });
                
                // Create download URL
                const url = URL.createObjectURL(blob);
                
                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = filename;
                downloadLink.style.display = 'none';
                
                // Add to DOM, click, and remove
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                // Clean up the URL
                URL.revokeObjectURL(url);
                
                resolve();
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Get export statistics
     * @returns {Object} - Statistics about exportable data
     */
    getExportStats: function() {
        const sessions = sessionManager.sessions || [];
        const totalSessions = sessions.length;
        const totalTabs = sessions.reduce((total, session) => total + session.tabs.length, 0);
        const totalUrls = sessions.reduce((total, session) => {
            return total + session.tabs.filter(tab => tab.url && tab.url.trim() !== '').length;
        }, 0);
        
        return {
            sessions: totalSessions,
            tabs: totalTabs,
            urls: totalUrls
        };
    }
};