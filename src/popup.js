// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Setup event listener for options button
  const optionsButton = document.getElementById('openOptions');
  if (optionsButton) {
    optionsButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("Opening options page");
      if (chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        // Fallback for older Chrome versions
        window.open(chrome.runtime.getURL('options.html'));
      }
    });
  }
  
  // Get current settings to display
  chrome.storage.sync.get(['danmakuMethod'], function(result) {
    const method = result.danmakuMethod || 'real';
    const methodDisplay = {
      'real': '真实弹幕',
      'mockData': '模拟数据',
      'current': '当前弹幕'
    };
    
    const statusElem = document.querySelector('.active-status');
    if (statusElem) {
      const methodInfo = document.createElement('p');
      methodInfo.textContent = `当前弹幕获取方式: ${methodDisplay[method] || method}`;
      statusElem.appendChild(methodInfo);
    }
  });
});