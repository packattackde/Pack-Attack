const DEFAULT_BRIDGE = 'http://127.0.0.1:3847';

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'FULFILL_ORDER' || !message.orderId) {
    sendResponse({ success: false, error: 'Invalid message' });
    return;
  }
  runFill(message.orderId).then(sendResponse);
  return true;
});

async function runFill(orderId) {
  const { bridgeUrl } = await chrome.storage.sync.get({ bridgeUrl: DEFAULT_BRIDGE });
  const base = (bridgeUrl || DEFAULT_BRIDGE).replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/fill/${encodeURIComponent(orderId)}`, { method: 'POST' });
    return await res.json();
  } catch (e) {
    return {
      success: false,
      error:
        'Local agent not running. In C:\\PA\\Pack-Attack run: npm run cardmarket:agent',
    };
  }
}
