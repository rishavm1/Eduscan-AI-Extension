// Content script - extracts text from webpage
// This script is injected when user clicks "Scan Page"

(function() {
  const MAX_CHARS = 200000;

  // Try to get selected text first
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    return truncateText(selectedText);
  }

  // Otherwise, extract from common content containers
  let text = '';
  
  // Try article tag first (common in news sites, blogs)
  const article = document.querySelector('article');
  if (article) {
    text = article.innerText;
  }
  
  // Try main tag
  if (!text) {
    const main = document.querySelector('main');
    if (main) {
      text = main.innerText;
    }
  }
  
  // Fallback: get all paragraph text
  if (!text) {
    const paragraphs = document.querySelectorAll('p');
    text = Array.from(paragraphs)
      .map(p => p.innerText)
      .join('\n\n');
  }

  return truncateText(text.trim());

  function truncateText(text) {
    if (text.length > MAX_CHARS) {
      return text.substring(0, MAX_CHARS) + '\n\n[Content truncated due to length]';
    }
    return text;
  }
})();
