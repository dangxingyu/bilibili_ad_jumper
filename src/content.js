// content.js

console.log("B站空降广告跳转助手 content script loaded.");

// Verify Chrome API is available
if (typeof window.chrome === 'undefined') {
  console.error("Chrome API is not available!");
} else {
  console.log("Chrome API available:", !!window.chrome);
  console.log("Chrome runtime available:", !!window.chrome.runtime);
  console.log("Chrome storage available:", !!window.chrome.storage);
}

let jumpButton = null;
let videoElement = null;
let feedbackElement = null;

// Function to create and inject the jump button
function injectJumpButton() {
  if (document.getElementById("bilibili-danmaku-jumper-button")) {
    return; // Button already injected
  }

  const playerControls = document.querySelector(".bpx-player-control-wrap") || document.querySelector(".bilibili-player-video-control-wrap");

  if (playerControls) {
    jumpButton = document.createElement("button");
    jumpButton.id = "bilibili-danmaku-jumper-button";
    jumpButton.innerText = "🚀 空降";
    jumpButton.className = "bpx-player-ctrl-btn"; // Use B站's button class for proper styling
    
    // Basic styles that work in all modes
    jumpButton.style.marginLeft = "8px";
    jumpButton.style.marginRight = "8px";
    jumpButton.style.cursor = "pointer";
    jumpButton.style.backgroundColor = "#00a1d6";
    jumpButton.style.color = "white";
    jumpButton.style.borderRadius = "4px";
    jumpButton.style.border = "1px solid #00a1d6";
    jumpButton.style.fontSize = "12px";
    jumpButton.style.padding = "4px 8px";
    jumpButton.style.whiteSpace = "nowrap";
    jumpButton.style.height = "22px";
    jumpButton.style.lineHeight = "22px";
    jumpButton.style.minWidth = "auto";
    jumpButton.style.width = "auto";
    jumpButton.style.display = "inline-flex";
    jumpButton.style.alignItems = "center";
    jumpButton.style.justifyContent = "center";
    jumpButton.style.verticalAlign = "middle";
    jumpButton.style.boxSizing = "border-box";
    jumpButton.style.flex = "0 0 auto"; // Prevent flex stretching

    jumpButton.addEventListener("click", handleJumpButtonClick);

    // Find the time display element specifically (to avoid interfering with danmaku input)
    let timeDisplay = playerControls.querySelector(".bpx-player-ctrl-time") || 
                     playerControls.querySelector(".bilibili-player-video-time") ||
                     playerControls.querySelector(".bpx-player-ctrl-time-duration") ||
                     playerControls.querySelector(".bilibili-player-video-time-total");
    
    if (timeDisplay) {
      // Insert directly after the time display
      const timeContainer = timeDisplay.parentNode;
      if (timeContainer) {
        // Create a wrapper div to group time and button together
        const buttonWrapper = document.createElement("div");
        buttonWrapper.style.display = "inline-flex";
        buttonWrapper.style.alignItems = "center";
        buttonWrapper.style.marginLeft = "0";
        
        // Insert the wrapper after the time display
        if (timeDisplay.nextSibling) {
          timeContainer.insertBefore(buttonWrapper, timeDisplay.nextSibling);
        } else {
          timeContainer.appendChild(buttonWrapper);
        }
        
        buttonWrapper.appendChild(jumpButton);
      } else {
        // Fallback - add next to time display
        timeDisplay.parentNode.insertBefore(jumpButton, timeDisplay.nextSibling);
      }
    } else {
      // Alternative approach - find the left control area specifically
      const leftControls = playerControls.querySelector(".bpx-player-control-bottom-left") || 
                          playerControls.querySelector(".bilibili-player-video-control-bottom-left");
      
      if (leftControls) {
        // Find the time element within left controls
        const timeInLeft = leftControls.querySelector(".bpx-player-ctrl-time") || 
                          leftControls.querySelector(".bilibili-player-video-time");
        
        if (timeInLeft) {
          // Insert after time display in left controls
          if (timeInLeft.nextSibling) {
            leftControls.insertBefore(jumpButton, timeInLeft.nextSibling);
          } else {
            leftControls.appendChild(jumpButton);
          }
        } else {
          // Add to end of left controls
          leftControls.appendChild(jumpButton);
        }
      } else {
        // Last resort - add to the control wrap but not in center
        const bottomControls = playerControls.querySelector(".bpx-player-control-bottom") || 
                              playerControls.querySelector(".bilibili-player-video-control-bottom");
        
        if (bottomControls) {
          // Try to find a safe spot that won't interfere with danmaku input
          const leftArea = bottomControls.querySelector(".bpx-player-control-bottom-left");
          if (leftArea) {
            leftArea.appendChild(jumpButton);
          } else {
            // Insert at the beginning of bottom controls to avoid center area
            bottomControls.insertBefore(jumpButton, bottomControls.firstChild);
          }
        } else {
          // Final fallback
          playerControls.appendChild(jumpButton);
        }
      }
    }
    
    // Add a resize observer to handle fullscreen transitions
    setupFullscreenHandler();
    
    console.log("Jump button injected.");
  } else {
    console.warn("Player controls not found, button not injected.");
  }
}

// Function to handle fullscreen changes
function setupFullscreenHandler() {
  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', adjustButtonForFullscreen);
  document.addEventListener('webkitfullscreenchange', adjustButtonForFullscreen);
  
  // Also monitor class changes on the player
  const player = document.querySelector('.bpx-player-container') || 
                document.querySelector('.bilibili-player-container');
  
  if (player) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          adjustButtonForFullscreen();
        }
      });
    });
    
    observer.observe(player, { attributes: true });
  }
}

// Function to adjust button styling based on fullscreen state
function adjustButtonForFullscreen() {
  if (!jumpButton) return;
  
  const player = document.querySelector('.bpx-player-container') || 
                document.querySelector('.bilibili-player-container');
  
  const isFullscreen = document.fullscreenElement || 
                      document.webkitFullscreenElement ||
                      (player && (player.classList.contains('bpx-state-web-fullscreen') || 
                                player.classList.contains('bpx-state-fullscreen') ||
                                player.classList.contains('bilibili-player-fullscreen') ||
                                player.classList.contains('bilibili-player-web-fullscreen')));
  
  if (isFullscreen) {
    // In fullscreen, use more compact styling
    jumpButton.style.padding = "3px 6px";
    jumpButton.style.fontSize = "11px";
    jumpButton.style.height = "20px";
    jumpButton.style.lineHeight = "20px";
    jumpButton.style.marginLeft = "5px";
    jumpButton.style.marginRight = "5px";
  } else {
    // In normal mode, use regular styling
    jumpButton.style.padding = "4px 8px";
    jumpButton.style.fontSize = "12px";
    jumpButton.style.height = "22px";
    jumpButton.style.lineHeight = "22px";
    jumpButton.style.marginLeft = "8px";
    jumpButton.style.marginRight = "8px";
  }
}


// Function to handle the jump button click
async function handleJumpButtonClick() {
  if (!jumpButton) return;

  // Debug Chrome API availability
  console.log("Chrome API check at click time:");
  console.log("typeof window.chrome:", typeof window.chrome);
  console.log("window.chrome:", window.chrome);
  console.log("window.chrome.storage:", window.chrome && window.chrome.storage);
  console.log("window.chrome.runtime:", window.chrome && window.chrome.runtime);

  jumpButton.innerText = "分析中...";
  jumpButton.disabled = true;

  videoElement = document.querySelector("video");
  if (!videoElement) {
    showFeedback("未找到视频播放器");
    resetButton();
    return;
  }

  const videoDuration = videoElement.duration;
  
  // Try to get CID from page
  const cid = getCidFromPage();
  console.log("Content: Button click - CID from page:", cid);
  
  // Extract video information
  let bvid = null;
  let aid = null;
  let currentPage = 1;
  
  // Get BV ID from URL as fallback
  const bvidMatch = window.location.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
  if (bvidMatch && bvidMatch[1]) {
    bvid = bvidMatch[1];
    console.log("Content: Extracted BV ID from URL:", bvid);
  }
  
  // Get AV ID from URL if available
  const avidMatch = window.location.pathname.match(/\/video\/av(\d+)/);
  if (avidMatch && avidMatch[1]) {
    aid = avidMatch[1];
    console.log("Content: Extracted AV ID from URL:", aid);
  }
  
  // Check for page number in URL query params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('p')) {
    currentPage = parseInt(urlParams.get('p'), 10);
    console.log("Content: Current video page:", currentPage);
  }
  
  // Check if we can access the global window.__INITIAL_STATE__ object for more info
  let initialStateData = null;
  if (window.__INITIAL_STATE__) {
    initialStateData = {
      cid: window.__INITIAL_STATE__.cid,
      bvid: window.__INITIAL_STATE__.bvid,
      aid: window.__INITIAL_STATE__.aid
    };
    console.log("Content: Found data in __INITIAL_STATE__:", initialStateData);
  }
  
  // If no CID and no BV/AV ID, we can't proceed
  if (!cid && !bvid && !aid) {
    showFeedback("无法获取视频信息");
    resetButton();
    return;
  }

  console.log(`Content: Requesting danmaku for ${cid ? 'CID: ' + cid : (bvid ? 'BV ID: ' + bvid : 'AV ID: ' + aid)}, Duration: ${videoDuration}, Page: ${currentPage}`);

  try {
    // Check if chrome.runtime is available
    if (!window.chrome || !window.chrome.runtime || !window.chrome.runtime.sendMessage) {
      console.error("Content: chrome.runtime.sendMessage not available!");
      showFeedback("Chrome API错误，请刷新页面重试");
      return;
      }
      
      // Request danmaku from background script with all available info
      console.log("Content: Sending message to background script...");
      
      try {
        // Add timeout for message sending
        const messagePromise = window.chrome.runtime.sendMessage({
          action: "fetchDanmaku",
          cid: cid,
          bvid: bvid,
          aid: aid,
          currentPage: currentPage,
          initialStateData: initialStateData,
          videoDuration: videoDuration,
          url: window.location.href
        });
        
        // Set a timeout for the message
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("请求超时")), 10000);
        });
        
        const response = await Promise.race([messagePromise, timeoutPromise]);
        
        if (response && response.success) {
          danmakuData = response.danmaku;
          console.log("Content: Received danmaku data from background:", danmakuData);
          
          // Use pre-computed pattern result if available
          if (response.patternResult) {
            console.log("Content: Using pre-computed pattern result:", response.patternResult);
            const jumpTime = response.patternResult.bestTime;
            
            // Log cluster information if available
            if (response.patternResult.clusters) {
              console.log("Content: Time clustering results:");
              console.log("Total clusters:", response.patternResult.clusters.length);
              console.log("Clusters:", response.patternResult.clusters);
              console.log("Best cluster votes:", response.patternResult.voteCount);
            }
            
            if (jumpTime !== null) {
              videoElement.currentTime = jumpTime;
              // showFeedback(`已空降到 ${formatTime(jumpTime)} (${response.patternResult.voteCount} 次推荐)`);
              showFeedback(`已空降到 ${formatTime(jumpTime)}`);
            } else {
              showFeedback("未找到空降点");
            }
            return; // Exit early since we have the result
          }
        } else {
          throw new Error(response && response.error ? response.error : "获取弹幕失败");
        }
      } catch (sendError) {
        console.error("Content: Error sending message to background:", sendError);
        throw sendError;
      }
    
    // This case should not happen since we're always using background script
    showFeedback("未收到分析结果");
  } catch (error) {
    console.error("Content: Error processing danmaku:", error);
    console.log("Full error details:", error.stack);
    showFeedback(`发生错误: ${error.message}`);
  } finally {
    resetButton();
  }
}

// Function to extract CID from the page (improved with multiple methods)
function getCidFromPage() {
  console.log("Attempting to extract CID from page...");
  console.log("DEBUG: window.__INITIAL_STATE__ exists?", !!window.__INITIAL_STATE__);
  
  // Method 1: Try to get from `window.__INITIAL_STATE__` (most common)
  if (window.__INITIAL_STATE__) {
    console.log("DEBUG: __INITIAL_STATE__ keys:", Object.keys(window.__INITIAL_STATE__));
    // Direct CID in state
    if (window.__INITIAL_STATE__.cid) {
      console.log("Found CID directly in __INITIAL_STATE__:", window.__INITIAL_STATE__.cid);
      return window.__INITIAL_STATE__.cid;
    }
    
    // CID in videoData
    if (window.__INITIAL_STATE__.videoData && window.__INITIAL_STATE__.videoData.cid) {
      console.log("Found CID in __INITIAL_STATE__.videoData:", window.__INITIAL_STATE__.videoData.cid);
      return window.__INITIAL_STATE__.videoData.cid;
    }
    
    // CID in player
    if (window.__INITIAL_STATE__.epInfo && window.__INITIAL_STATE__.epInfo.cid) {
      console.log("Found CID in __INITIAL_STATE__.epInfo:", window.__INITIAL_STATE__.epInfo.cid);
      return window.__INITIAL_STATE__.epInfo.cid;
    }
    
    // Check for multi-part videos and get current part's CID
    if (window.__INITIAL_STATE__.videoData && window.__INITIAL_STATE__.videoData.pages) {
      const urlParams = new URLSearchParams(window.location.search);
      const pageNumber = parseInt(urlParams.get('p') || '1', 10);
      const currentPage = window.__INITIAL_STATE__.videoData.pages.find(p => p.page === pageNumber);
      if (currentPage && currentPage.cid) {
        console.log(`Found CID for page ${pageNumber} in videoData.pages:`, currentPage.cid);
        return currentPage.cid;
      }
    }
    
    console.log("Checked __INITIAL_STATE__ but couldn't find CID");
  } else {
    console.log("__INITIAL_STATE__ not found");
  }
  
  // Method 2: Try window.player if available (some Bilibili pages)
  if (window.player && window.player.cid) {
    console.log("Found CID in window.player:", window.player.cid);
    return window.player.cid;
  }
  
  // Method 3: Look for cid in script tags or page source
  console.log("Searching for CID in page source...");
  const pageSource = document.documentElement.outerHTML;
  
  // Try multiple regex patterns for different formats
  const cidPatterns = [
    /\bcid(?:["\']:|=)(\d+)/,                 // Basic cid pattern
    /"cid":\s*(\d+)/,                         // JSON format
    /cid=(\d+)/,                              // URL parameter format
    /cid:\s*['"](\d+)['"]/,                   // JavaScript object format
    /EmbedPlayer\("[^"]*",\s*"[^"]*",\s*(\d+)/ // EmbedPlayer format
  ];
  
  for (const pattern of cidPatterns) {
    const match = pageSource.match(pattern);
    if (match && match[1]) {
      console.log(`Found CID using pattern ${pattern}:`, match[1]);
      return match[1];
    }
  }
  
  // Method 4: Look for AV/BV ID and get CID from the URL
  // Extract BV ID from URL
  console.log("Trying to extract BV/AV ID from URL...");
  const bvidMatch = window.location.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
  const avidMatch = window.location.pathname.match(/\/video\/av(\d+)/);
  
  if (bvidMatch || avidMatch) {
    const videoId = bvidMatch ? bvidMatch[1] : `av${avidMatch[1]}`;
    console.log(`Found video ID: ${videoId}, but need background API call to get CID`);
    
    // We could make an API call here, but that would be asynchronous
    // Instead, check if metadata is available in the page
    const metaTags = document.querySelectorAll('meta[itemprop="url"]');
    for (const meta of metaTags) {
      const content = meta.getAttribute('content');
      if (content && content.includes('cid=')) {
        const cidMatch = content.match(/cid=(\d+)/);
        if (cidMatch && cidMatch[1]) {
          console.log("Found CID in meta tag:", cidMatch[1]);
          return cidMatch[1];
        }
      }
    }
  }
  
  console.warn("All CID extraction methods failed. Unable to get CID.");
  return null;
}




// Function to format time in MM:SS format
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Function to show feedback to the user
function showFeedback(message) {
  // Remove any existing feedback element
  if (feedbackElement) {
    document.body.removeChild(feedbackElement);
  }
  
  // Create a new feedback element
  feedbackElement = document.createElement("div");
  feedbackElement.className = "danmaku-jumper-feedback";
  feedbackElement.textContent = message;
  document.body.appendChild(feedbackElement);
  
  // Show the feedback
  setTimeout(() => {
    feedbackElement.classList.add("show");
  }, 10);
  
  // Hide the feedback after 3 seconds
  setTimeout(() => {
    if (feedbackElement) {
      feedbackElement.classList.remove("show");
      setTimeout(() => {
        if (feedbackElement && feedbackElement.parentNode) {
          document.body.removeChild(feedbackElement);
          feedbackElement = null;
        }
      }, 500); // Wait for fade-out animation
    }
  }, 3000);
  
  // Also log to console
  console.log("Feedback:", message);
}

// Function to reset the jump button
function resetButton() {
  if (jumpButton) {
    jumpButton.innerText = "🚀 空降";
    jumpButton.disabled = false;
  }
}

// Function to pre-fetch danmaku data when page loads
async function prefetchDanmaku() {
  // Prevent multiple concurrent prefetch attempts
  if (prefetchInProgress) {
    console.log("Pre-fetch already in progress, skipping...");
    return;
  }
  
  try {
    prefetchInProgress = true;
    console.log("Starting danmaku pre-fetch at:", new Date().toISOString());
    
    // Get video element
    const videoElement = document.querySelector("video");
    if (!videoElement) {
      console.log("Video element not found, will retry pre-fetch later");
      prefetchInProgress = false;
      // Set up a timer to retry
      setTimeout(prefetchDanmaku, 2000);
      return;
    }
    
    const videoDuration = videoElement.duration || 0;
    
    // Don't wait for duration - start pre-fetching immediately
    console.log("Pre-fetch: Video duration:", videoDuration);
    
    // Try to get CID from page
    const cid = getCidFromPage();
    console.log("Pre-fetch: CID from page:", cid);
    
    // Extract video information (same logic as handleJumpButtonClick)
    let bvid = null;
    let aid = null;
    let currentPage = 1;
    
    // Get BV ID from URL as fallback
    const bvidMatch = window.location.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
    if (bvidMatch && bvidMatch[1]) {
      bvid = bvidMatch[1];
      console.log("Pre-fetch: Extracted BV ID from URL:", bvid);
    }
    
    // Get AV ID from URL if available
    const avidMatch = window.location.pathname.match(/\/video\/av(\d+)/);
    if (avidMatch && avidMatch[1]) {
      aid = avidMatch[1];
      console.log("Pre-fetch: Extracted AV ID from URL:", aid);
    }
    
    // Check for page number in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('p')) {
      currentPage = parseInt(urlParams.get('p'), 10);
      console.log("Pre-fetch: Current video page:", currentPage);
    }
    
    // Check if we can access the global window.__INITIAL_STATE__ object for more info
    let initialStateData = null;
    if (window.__INITIAL_STATE__) {
      initialStateData = {
        cid: window.__INITIAL_STATE__.cid,
        bvid: window.__INITIAL_STATE__.bvid,
        aid: window.__INITIAL_STATE__.aid
      };
      console.log("Pre-fetch: Found data in __INITIAL_STATE__:", initialStateData);
    }
    
    // If no CID and no BV/AV ID, we can't proceed
    if (!cid && !bvid && !aid) {
      console.log("Pre-fetch: No video identifiers found, will retry later");
      setTimeout(prefetchDanmaku, 2000);
      return;
    }
    
    console.log(`Pre-fetch: Requesting danmaku for ${cid ? 'CID: ' + cid : (bvid ? 'BV ID: ' + bvid : 'AV ID: ' + aid)}`);
    
    // Send message to background script to fetch danmaku (which will cache it)
    console.log("Pre-fetch: Sending message to background script");
    
    // Check if chrome.runtime is available
    if (!window.chrome || !window.chrome.runtime || !window.chrome.runtime.sendMessage) {
      console.error("Pre-fetch: chrome.runtime.sendMessage not available, will retry");
      setTimeout(prefetchDanmaku, 2000);
      return;
    }
    
    chrome.runtime.sendMessage({
      action: "fetchDanmaku",
      cid: cid,
      bvid: bvid,
      aid: aid,
      currentPage: currentPage,
      initialStateData: initialStateData,
      videoDuration: videoDuration,
      url: window.location.href
    }, (response) => {
      console.log("Pre-fetch: Received response from background:", response);
      if (response && response.success) {
        console.log("Danmaku pre-fetched and cached successfully");
        console.log("Pre-fetch: Cached CID:", cid);
        console.log("Pre-fetch: Danmaku count:", response.danmaku ? response.danmaku.length : 0);
        console.log("Pre-fetch: Pattern result cached:", !!response.patternResult);
      } else {
        console.log("Failed to pre-fetch danmaku:", response && response.error);
      }
    });
  } catch (error) {
    console.error("Error during danmaku pre-fetch:", error);
  } finally {
    prefetchInProgress = false;
  }
}

// Initialize: Set up MutationObserver to detect when the video player is loaded
function initializeExtension() {
  // First try to inject the button immediately if the player is already loaded
  injectJumpButton();
  
  // Check if pre-fetch is enabled and attempt to pre-fetch danmaku
  chrome.storage.sync.get(['prefetchEnabled'], (result) => {
    console.log("Pre-fetch setting:", result.prefetchEnabled);
    if (result.prefetchEnabled) {
      console.log("Pre-fetch enabled, attempting to cache danmaku...");
      prefetchDanmaku();
    } else {
      console.log("Pre-fetch is disabled");
    }
  });
  
  // Set up an observer to detect when the player controls are added to the DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if player controls have been loaded
        const playerControls = document.querySelector(".bpx-player-control-wrap") || 
                             document.querySelector(".bilibili-player-video-control-wrap");
        if (playerControls && !document.getElementById("bilibili-danmaku-jumper-button")) {
          injectJumpButton();
        }
        
        // Also check for button removal and re-add if necessary
        if (playerControls && !document.getElementById("bilibili-danmaku-jumper-button")) {
          // Button might have been removed due to DOM refresh
          setTimeout(() => {
            if (!document.getElementById("bilibili-danmaku-jumper-button")) {
              injectJumpButton();
            }
          }, 100);
        }
      }
    }
  });
  
  // Start observing the document body for DOM changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Also observe for attribute changes on the player container
  const playerContainer = document.querySelector('.bpx-player-container') || 
                         document.querySelector('.bilibili-player-container');
  if (playerContainer) {
    const attrObserver = new MutationObserver(() => {
      // Check button is still properly positioned
      const button = document.getElementById("bilibili-danmaku-jumper-button");
      if (button) {
        adjustButtonForFullscreen();
      }
    });
    
    attrObserver.observe(playerContainer, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
  }
  
  console.log("B站空降广告跳转助手 initialized.");
}

// Start the extension when the page is loaded
if (document.readyState === "complete" || document.readyState === "interactive") {
  initializeExtension();
} else {
  document.addEventListener("DOMContentLoaded", initializeExtension);
}

// Also listen for URL changes (single-page app navigation)
let lastUrl = location.href;
let prefetchInProgress = false;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    prefetchInProgress = false; // Reset prefetch flag for new page
    console.log("URL changed, re-initializing extension");
    // Re-initialize the extension for the new page
    initializeExtension();
  }
}).observe(document, { subtree: true, childList: true });