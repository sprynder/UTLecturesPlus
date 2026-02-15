const EXPERIMENTAL_FEATURES_STORAGE_KEY = 'experimentalFeaturesEnabled';

const toggle = document.getElementById('experimentalToggle');
const statusText = document.getElementById('statusText');

function setStatus(message) {
  statusText.textContent = message;
}

chrome.storage.local.get({ [EXPERIMENTAL_FEATURES_STORAGE_KEY]: false }, function (result) {
  toggle.checked = !!result[EXPERIMENTAL_FEATURES_STORAGE_KEY];
  setStatus(toggle.checked ? 'Experimental features are ON.' : 'Experimental features are OFF.');
});

toggle.addEventListener('change', function () {
  const enabled = toggle.checked;
  chrome.storage.local.set({ [EXPERIMENTAL_FEATURES_STORAGE_KEY]: enabled }, function () {
    if (chrome.runtime.lastError) {
      setStatus('Failed to save setting.');
      return;
    }

    setStatus((enabled ? 'Enabled' : 'Disabled') + '. Refresh the lecture page to apply.');
  });
});
