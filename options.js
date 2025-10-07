// Options page logic for EduScan AI

const apiKeyInput = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// Load saved API key on page load
chrome.storage.local.get('apiKey', ({ apiKey }) => {
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }
});

// Save API key
saveBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus('Please enter an API key', false);
    return;
  }

  chrome.storage.local.set({ apiKey }, () => {
    showStatus('Settings saved successfully!', true);
  });
});

function showStatus(message, success) {
  status.textContent = message;
  status.style.color = success ? '#4caf50' : '#ff6b6b';
  status.classList.add('show');

  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}
