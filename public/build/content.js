(function () {
  'use strict';

  chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
      console.log(message, chrome.runtime.getPlatformInfo);
      return true;
  });

})();
