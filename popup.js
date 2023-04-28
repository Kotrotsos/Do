document.getElementById('save').addEventListener('click', () => {
    const apiKey = document.getElementById('api-key').value;
    chrome.storage.sync.set({ apiKey }, () => {
      console.log('API key saved');
      window.close(); 
    });
  });
  
  chrome.storage.sync.get('apiKey', (data) => {
    if (data.apiKey) {
      document.getElementById('api-key').value = data.apiKey;
    }
  });
  