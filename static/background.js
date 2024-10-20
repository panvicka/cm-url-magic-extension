chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url) {
		// Send a message to the popup or other parts of your extension
		chrome.runtime.sendMessage({ newUrl: changeInfo.url });
	}
	console.log('hi');
});
