'use strict';

const script = document.createElement('script');
script.src = chrome.extension.getURL('injected.js');
document.body.append(script);
