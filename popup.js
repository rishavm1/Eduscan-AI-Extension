// Popup logic for EduScan AI

const scanBtn = document.getElementById('scanBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const contentBox = document.getElementById('contentBox');
const output = document.getElementById('output');
const status = document.getElementById('status');
const loader = document.getElementById('loader');
const modeSelect = document.getElementById('mode');
const optionsLink = document.getElementById('optionsLink');

// Student mode elements
const studentControls = document.getElementById('studentControls');
const taskSelect = document.getElementById('task');
const languageInput = document.getElementById('language');

// Developer mode elements
const developerControls = document.getElementById('developerControls');
const devActions = document.getElementById('devActions');
const devTaskInput = document.getElementById('devTask');
const imageUpload = document.getElementById('imageUpload');
const fileName = document.getElementById('fileName');

let uploadedImage = null;

// Check API key
chrome.storage.local.get('apiKey', ({ apiKey }) => {
  if (!apiKey) {
    status.textContent = '⚠️ Please set your API key in Settings';
    status.className = 'status error';
  }
});

// Mode switching
modeSelect.addEventListener('change', () => {
  const mode = modeSelect.value;
  
  if (mode === 'student') {
    studentControls.classList.remove('hidden');
    developerControls.classList.add('hidden');
    scanBtn.classList.remove('hidden');
    devActions.classList.add('hidden');
    contentBox.placeholder = 'Paste text here or click Scan Page';
  } else {
    studentControls.classList.add('hidden');
    developerControls.classList.remove('hidden');
    scanBtn.classList.add('hidden');
    devActions.classList.remove('hidden');
    contentBox.placeholder = 'Paste code here or upload image';
  }
  
  uploadedImage = null;
  fileName.textContent = '';
});

// Open options
optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Scan page (Student mode only)
scanBtn.addEventListener('click', async () => {
  status.textContent = 'Scanning page...';
  status.className = 'status';
  output.textContent = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scripts/content.js']
    });

    if (results?.[0]?.result) {
      contentBox.value = results[0].result;
      status.textContent = 'Content captured. Click Analyze.';
      status.className = 'status success';
    } else {
      status.textContent = 'No content found';
      status.className = 'status error';
    }
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
    status.className = 'status error';
  }
});

// Image upload (Developer mode)
imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  fileName.textContent = `📎 ${file.name}`;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const base64 = event.target.result.split(',')[1];
    uploadedImage = {
      base64: base64,
      mimeType: file.type
    };
  };
  reader.readAsDataURL(file);
});

// Analyze
analyzeBtn.addEventListener('click', async () => {
  const mode = modeSelect.value;
  
  if (mode === 'student') {
    await analyzeStudent();
  } else {
    await analyzeDeveloper();
  }
});

async function analyzeStudent() {
  const text = contentBox.value.trim();
  if (!text) {
    status.textContent = 'Please provide content to analyze';
    status.className = 'status error';
    return;
  }

  status.textContent = '';
  status.className = 'status';
  loader.classList.remove('hidden');
  output.textContent = '';
  analyzeBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'studentAnalyze',
      text: text,
      task: taskSelect.value,
      language: languageInput.value.trim() || 'English'
    });

    if (response.success) {
      output.textContent = response.result;
      loader.classList.add('hidden');
      status.textContent = 'Done ✓';
      status.className = 'status success';
    } else {
      output.textContent = `Error: ${response.error}`;
      loader.classList.add('hidden');
      status.textContent = 'Failed';
      status.className = 'status error';
    }
  } catch (error) {
    output.textContent = `Error: ${error.message}`;
    loader.classList.add('hidden');
    status.textContent = 'Failed';
    status.className = 'status error';
  } finally {
    analyzeBtn.disabled = false;
  }
}

async function analyzeDeveloper() {
  const text = contentBox.value.trim();
  const task = devTaskInput.value.trim() || 'Analyze and explain this code';
  
  if (!text && !uploadedImage) {
    status.textContent = 'Please provide code or upload an image';
    status.className = 'status error';
    return;
  }

  status.textContent = '';
  status.className = 'status';
  loader.classList.remove('hidden');
  output.textContent = '';
  analyzeBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeCode',
      text: text,
      image: uploadedImage,
      task: task
    });

    if (response.success) {
      output.textContent = response.result;
      loader.classList.add('hidden');
      status.textContent = 'Done ✓';
      status.className = 'status success';
    } else {
      output.textContent = `Error: ${response.error}`;
      loader.classList.add('hidden');
      status.textContent = 'Failed';
      status.className = 'status error';
    }
  } catch (error) {
    output.textContent = `Error: ${error.message}`;
    loader.classList.add('hidden');
    status.textContent = 'Failed';
    status.className = 'status error';
  } finally {
    analyzeBtn.disabled = false;
  }
}
