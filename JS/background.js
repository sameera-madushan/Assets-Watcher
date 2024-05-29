chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'save_url') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length === 0) {
                console.log('No active tab found');
                return;
            }

            var currentTab = tabs[0];
            var fullUrl = currentTab.url;

            var urlParams = new URLSearchParams(fullUrl.split('?')[1]);
            var symbolParam = urlParams.get('symbol');
            if (symbolParam) {
                var decodedSymbolParam = decodeURIComponent(symbolParam);
                    var extractedPart = decodedSymbolParam;
                    // console.log('Extracted Part:', extractedPart);
                    sendResponse({success: true, fullUrl: fullUrl, extractedPart: extractedPart});
            } else {
                sendResponse({success: false, message: 'Visit a chart to add here'});
            }
        });
        return true;
    }
});
