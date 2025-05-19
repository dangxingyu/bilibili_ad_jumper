// options.js

// Initialize form with saved settings
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  try {
    const settings = await chrome.storage.sync.get([
      'SESSDATA',
      'prefetchEnabled',
      'daysToFetch'
    ]);
    
    // Set SESSDATA input
    if (settings.SESSDATA) {
      document.getElementById('sessdataInput').value = settings.SESSDATA;
    }
    
    // Set prefetch checkbox (default to false)
    document.getElementById('prefetchEnabled').checked = settings.prefetchEnabled || false;
    
    // Set days to fetch (default to 7)
    document.getElementById('daysToFetch').value = settings.daysToFetch || 7;
  } catch (error) {
    console.error("Error loading settings:", error);
    showStatus("加载设置时出错，请重试", false);
  }
  
  // Add save button event listener
  document.getElementById('saveButton').addEventListener('click', saveSettings);
});

// Save settings to Chrome storage
async function saveSettings() {
  const SESSDATA = document.getElementById('sessdataInput').value.trim();
  const prefetchEnabled = document.getElementById('prefetchEnabled').checked;
  const daysToFetch = parseInt(document.getElementById('daysToFetch').value) || 7;
  
  try {
    await chrome.storage.sync.set({
      SESSDATA: SESSDATA,
      prefetchEnabled: prefetchEnabled,
      daysToFetch: daysToFetch
    });
    
    showStatus("设置已保存！", true);
    console.log("Settings saved:", { 
      SESSDATA: SESSDATA ? "PROVIDED" : "EMPTY",
      prefetchEnabled,
      daysToFetch
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    showStatus("保存设置时出错，请重试", false);
  }
}

// Show status message
function showStatus(message, isSuccess) {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.className = "status " + (isSuccess ? "success" : "error");
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    statusElement.className = "status";
  }, 5000);
}