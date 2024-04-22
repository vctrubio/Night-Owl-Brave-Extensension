document.addEventListener('DOMContentLoaded', function () {
    var btnClick = document.getElementById('btnClick');
    var sessionsList = document.getElementById('sessionsList');
    var savedSessions = {};

    chrome.storage.local.get('savedSessions', function (result) {
        if (result.savedSessions) {
            savedSessions = result.savedSessions;
            renderSessions();
        }
    });

    document.getElementById('sessionName').addEventListener('keyup', function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById('btnClick').click();
        }
    });
    
    btnClick.addEventListener('click', function () {
        var sessionName = document.getElementById('sessionName').value.trim();

        if (sessionName !== '') {
            chrome.tabs.query({ currentWindow: true }, function (tabs) {
                var urls = tabs.map(function (tab) {
                    return tab.url;
                });

                savedSessions[sessionName] = urls;
                chrome.storage.local.set({ 'savedSessions': savedSessions }, function () {
                    renderSessions();
                });
            });
        }
        document.getElementById('sessionName').value = '';
    });

    function renderSessions() {
        sessionsList.innerHTML = '';

        for (var sessionName in savedSessions) {
            var sessionItemDiv = document.createElement('div');
            sessionItemDiv.classList.add('session-item');


            var sessionNameDiv = document.createElement('div');
            sessionNameDiv.textContent = sessionName;
            sessionNameDiv.classList.add('session-name');

            var deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';

            (function (sessionName) {
                deleteButton.addEventListener('click', function (event) {
                    event.stopPropagation();

                    delete savedSessions[sessionName];
                    chrome.storage.local.set({ 'savedSessions': savedSessions }, function () {
                        renderSessions();
                    });
                });
            })(sessionName);

            sessionItemDiv.appendChild(sessionNameDiv);
            sessionItemDiv.appendChild(deleteButton);

            (function (sessionName) {
                sessionNameDiv.addEventListener('click', function () {
                    var sessionUrls = savedSessions[sessionName];
                    openSession(sessionUrls);
                });
            })(sessionName);

            sessionsList.appendChild(sessionItemDiv);
        }
    }

    function openSession(urls) {
        var tabs = [];
        urls.forEach(function (url) {
            tabs.push({ url: url });
        });

        chrome.windows.create({ "url": urls }, function (window) {
        });
    }
});
