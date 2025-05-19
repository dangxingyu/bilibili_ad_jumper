// Test script to check CID consistency on Bilibili pages

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
  
  console.warn("All CID extraction methods failed.");
  return null;
}

// Test CID extraction multiple times
console.log("\n=== Testing CID extraction consistency ===");

// Test immediately
console.log("\nTest 1 - Immediate:");
const cid1 = getCidFromPage();

// Test after short delay
setTimeout(() => {
  console.log("\nTest 2 - After 100ms:");
  const cid2 = getCidFromPage();
  console.log("CID consistent?", cid1 === cid2);
}, 100);

// Test after longer delay
setTimeout(() => {
  console.log("\nTest 3 - After 1 second:");
  const cid3 = getCidFromPage();
  console.log("CID consistent with first?", cid1 === cid3);
}, 1000);

// Test after even longer delay
setTimeout(() => {
  console.log("\nTest 4 - After 3 seconds:");
  const cid4 = getCidFromPage();
  console.log("CID consistent with first?", cid1 === cid4);
}, 3000);