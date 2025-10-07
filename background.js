// Service worker for EduScan AI
// Handles API calls to Google Generative AI (Gemini)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'studentAnalyze') {
    handleStudentAnalysis(request.text, request.task, request.language)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'analyzeCode') {
    handleCodeAnalysis(request.text, request.image, request.task)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleStudentAnalysis(text, task, language) {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) throw new Error('API key not configured. Please set it in Settings.');

  const prompt = buildStudentPrompt(text, task, language);
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 800, temperature: 0.2 }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data, null, 2);
}

async function handleCodeAnalysis(text, imageData, task) {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) throw new Error('API key not configured. Please set it in Settings.');

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  let parts;
  if (imageData) {
    const instruction = `Extract code from this image and perform the requested task: ${task}`;
    parts = [
      { text: instruction },
      { inline_data: { mime_type: imageData.mimeType, data: imageData.base64 } }
    ];
  } else {
    const prompt = `You are EduScan Developer Assistant. Perform this task: ${task}. Analyze and improve this code:\n\n${text}`;
    parts = [{ text: prompt }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.2 }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data, null, 2);
}

function buildStudentPrompt(text, task, language) {
  let prompt = '';
  
  switch (task) {
    case 'summarize':
      prompt = `Summarize the following content concisely:\n\n${text}`;
      break;
    case 'explain':
      prompt = `Explain the following content in simple words that anyone can understand:\n\n${text}`;
      break;
    case 'keypoints':
      prompt = `List the key points from the following content:\n\n${text}`;
      break;
    case 'notes':
      prompt = `Create study notes from the following content:\n\n${text}`;
      break;
    default:
      prompt = `Summarize the following content:\n\n${text}`;
  }
  
  if (language && language !== 'English') {
    prompt += `\n\nProvide the response in ${language}.`;
  }
  
  return prompt;
}
