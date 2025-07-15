let lastMimeByTab = {};

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const header = details.responseHeaders.find(
      (h) => h.name.toLowerCase() === 'content-type',
    );
    if (!header) return;

    lastMimeByTab[details.tabId] = header.value;
  },
  { urls: ['<all_urls>'], types: ['main_frame'] },
  ['responseHeaders'],
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_MIME_TYPE') {
    const tabId = sender.tab?.id;
    sendResponse({ mime: lastMimeByTab[tabId] });
  }
});
