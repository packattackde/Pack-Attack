document.getElementById('save').addEventListener('click', async () => {
  const bridgeUrl = document.getElementById('bridgeUrl').value.trim();
  await chrome.storage.sync.set({ bridgeUrl });
  document.getElementById('status').textContent = 'Saved.';
});

chrome.storage.sync.get({ bridgeUrl: 'http://127.0.0.1:3847' }, (items) => {
  document.getElementById('bridgeUrl').value = items.bridgeUrl;
});
