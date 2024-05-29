document.addEventListener('DOMContentLoaded', function() {
    var saveButton = document.getElementById('save-url');
    var exportButton = document.getElementById('export');
    var importButton = document.getElementById('import');
    var fileInput = document.getElementById('file-input');
    var storedData = JSON.parse(localStorage.getItem('storedData')) || [];

    updatePopupContent(storedData);

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
            console.log('No active tab found');
            saveButton.disabled = true;
            return;
        }

        var currentTabUrl = tabs[0].url;
        if (!currentTabUrl.startsWith('https://www.tradingview.com/')) {
            saveButton.disabled = true;
        }
    });

    saveButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({message: 'save_url'}, function(response) {
            if (response.success) {
                if (!storedData.some(item => item.extractedPart === response.extractedPart)) {
                    storedData.push({ fullUrl: response.fullUrl, extractedPart: response.extractedPart });
                    localStorage.setItem('storedData', JSON.stringify(storedData));
                    updatePopupContent(storedData);
                } else {
                    displayMessage("This is already added to watchlist.");
                }
            } else {
                displayMessage("Error: " + response.message);
            }
        });
    });

    exportButton.addEventListener('click', function() {

        if (storedData.length === 0) {
            displayMessage("Watchlist is empty. Nothing to export.");
            return;
        }
        
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storedData));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "watchlist.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    importButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var importedData = JSON.parse(e.target.result);
                    if (Array.isArray(importedData)) {
                        storedData = importedData;
                        localStorage.setItem('storedData', JSON.stringify(storedData));
                        updatePopupContent(storedData);
                        displayMessage("Watchlist imported successfully.");
                    } else {
                        displayMessage("Invalid file format.");
                    }
                } catch (error) {
                    displayMessage("Error reading file.");
                }
            };
            reader.readAsText(file);
        }
    });
});

function displayMessage(message) {
    var messageContainer = document.getElementById('message-container');
    messageContainer.textContent = message;
    setTimeout(function() {
        messageContainer.textContent = '';
    }, 3000);
}

function updatePopupContent(storedData) {
    var resultList = document.getElementById('result-list');
    resultList.innerHTML = '';
    storedData.forEach(function(item) {
        var listItem = document.createElement('li');

        var link = document.createElement('a');
        link.textContent = item.extractedPart;
        link.href = item.fullUrl;
        link.addEventListener('click', function(event) {
            event.preventDefault();
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.update(tabs[0].id, {url: link.href});
            });
        });
        listItem.appendChild(link);

        var trashIcon = document.createElement('span');
        trashIcon.innerHTML = '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z" clip-rule="evenodd"/></svg>';
        trashIcon.style.cursor = 'pointer';
        trashIcon.addEventListener('click', function() {
            removeItemFromStorage(item.fullUrl);
            storedData = storedData.filter(function(data) {
                return data.fullUrl !== item.fullUrl;
            });
            updatePopupContent(storedData);
        });
        listItem.appendChild(trashIcon);

        resultList.appendChild(listItem);
    });
}

function removeItemFromStorage(url) {
    var storedData = JSON.parse(localStorage.getItem('storedData')) || [];
    var newData = storedData.filter(function(item) {
        return item.fullUrl !== url;
    });
    localStorage.setItem('storedData', JSON.stringify(newData));
}
