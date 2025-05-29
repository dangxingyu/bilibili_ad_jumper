// background.js

// Protocol Buffer parsing support for danmaku data
// This is a simplified parser for the specific fields we need
function parseDanmakuProtobuf(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const danmakuList = [];
  let offset = 0;
  
  // Simple protobuf parser - this parses the DmSegMobileReply message
  while (offset < view.byteLength) {
    if (offset >= view.byteLength) break;
    
    const tag = view.getUint8(offset++);
    const wireType = tag & 0x07;
    const fieldNumber = tag >> 3;
    
    if (fieldNumber === 1 && wireType === 2) { // elems field (repeated DanmakuElem)
      const length = readVarint(view, offset);
      offset += length.bytesRead;
      
      const elemEndOffset = offset + length.value;
      const elemData = new DataView(arrayBuffer, offset, length.value);
      const elem = parseDanmakuElem(elemData);
      if (elem && elem.content) {
        danmakuList.push(elem);
      }
      offset = elemEndOffset;
    } else {
      // Skip other fields
      const skipResult = skipField(view, offset, wireType);
      if (skipResult === null || skipResult <= offset) {
        break; // Prevent infinite loop
      }
      offset = skipResult;
    }
  }
  
  return danmakuList;
}

function parseDanmakuElem(view) {
  let offset = 0;
  const elem = {};
  
  while (offset < view.byteLength) {
    if (offset >= view.byteLength) break;
    
    const tag = view.getUint8(offset++);
    const wireType = tag & 0x07;
    const fieldNumber = tag >> 3;
    
    try {
      switch (fieldNumber) {
        case 1: // id
          if (wireType === 0) {
            const id = readVarint(view, offset);
            elem.id = id.value;
            offset += id.bytesRead;
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        case 2: // progress
          if (wireType === 0) {
            const progress = readVarint(view, offset);
            elem.progress = progress.value;
            offset += progress.bytesRead;
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        case 3: // mode
          if (wireType === 0) {
            const mode = readVarint(view, offset);
            elem.mode = mode.value;
            offset += mode.bytesRead;
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        case 4: // fontsize
          if (wireType === 0) {
            const fontsize = readVarint(view, offset);
            elem.fontsize = fontsize.value;
            offset += fontsize.bytesRead;
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        case 5: // color
          if (wireType === 0) {
            const color = readVarint(view, offset);
            elem.color = color.value;
            offset += color.bytesRead;
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        case 6: // midHash
          if (wireType === 2) {
            const midHashLength = readVarint(view, offset);
            offset += midHashLength.bytesRead;
            if (midHashLength.value > 0 && offset + midHashLength.value <= view.byteLength) {
              elem.midHash = readString(view, offset, midHashLength.value);
              offset += midHashLength.value;
            } else {
              offset += midHashLength.value;
            }
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        case 7: // content
          if (wireType === 2) {
            const contentLength = readVarint(view, offset);
            offset += contentLength.bytesRead;
            if (contentLength.value > 0 && offset + contentLength.value <= view.byteLength) {
              elem.content = readString(view, offset, contentLength.value);
              offset += contentLength.value;
            } else {
              offset += contentLength.value;
            }
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        case 8: // ctime
          if (wireType === 0) {
            const ctime = readVarint(view, offset);
            elem.ctime = ctime.value;
            offset += ctime.bytesRead;
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        case 11: // pool
          if (wireType === 0) {
            const pool = readVarint(view, offset);
            elem.pool = pool.value;
            offset += pool.bytesRead;
          } else {
            offset = skipField(view, offset, wireType);
          }
          break;
        default:
          const skipResult = skipField(view, offset, wireType);
          if (skipResult === null || skipResult <= offset) {
            return elem; // Prevent infinite loop
          }
          offset = skipResult;
          break;
      }
    } catch (e) {
      console.error("Error parsing danmaku element field:", e);
      return elem;
    }
  }
  
  return elem;
}

// Helper functions for protobuf parsing
function readVarint(view, offset) {
  let value = 0;
  let bytesRead = 0;
  let byte;
  
  do {
    byte = view.getUint8(offset + bytesRead);
    value |= (byte & 0x7F) << (7 * bytesRead);
    bytesRead++;
  } while (byte & 0x80);
  
  return { value, bytesRead };
}

function readString(view, offset, length) {
  const decoder = new TextDecoder();
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  return decoder.decode(bytes);
}

function skipField(view, offset, wireType) {
  try {
    switch (wireType) {
      case 0: // Varint
        while (offset < view.byteLength && (view.getUint8(offset++) & 0x80)) {}
        return offset;
      case 1: // 64-bit
        return offset + 8 <= view.byteLength ? offset + 8 : view.byteLength;
      case 2: // Length-delimited
        if (offset >= view.byteLength) return view.byteLength;
        const length = readVarint(view, offset);
        const newOffset = offset + length.bytesRead + length.value;
        return newOffset <= view.byteLength ? newOffset : view.byteLength;
      case 5: // 32-bit
        return offset + 4 <= view.byteLength ? offset + 4 : view.byteLength;
      default:
        console.warn(`Unknown wire type: ${wireType}`);
        return offset + 1; // Skip at least one byte
    }
  } catch (e) {
    console.error("Error skipping field:", e);
    return view.byteLength; // Skip to end on error
  }
}

// Pattern matching functions
function convertChineseNumbersToArabic(text) {
  const chineseNumbers = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, 
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '两': 2, // Alternative for 二
    '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5, 
    '陆': 6, '柒': 7, '捌': 8, '玖': 9, '拾': 10
  };
  
  let converted = text;
  
  // Handle patterns like "十五" (15), "二十三" (23)
  converted = converted.replace(/([一二三四五六七八九壹贰叁肆伍陆柒捌玖])?十([一二三四五六七八九壹贰叁肆伍陆柒捌玖])?/g, (match, tens, ones) => {
    const tensValue = tens ? chineseNumbers[tens] : 1;
    const onesValue = ones ? chineseNumbers[ones] : 0;
    return tensValue * 10 + onesValue;
  });
  
  // Handle patterns like "二十" (20), "三十" (30)
  converted = converted.replace(/([二三四五六七八九贰叁肆伍陆柒捌玖])十/g, (match, tens) => {
    return chineseNumbers[tens] * 10;
  });
  
  // Handle single digit replacements
  Object.entries(chineseNumbers).forEach(([chinese, arabic]) => {
    converted = converted.replace(new RegExp(chinese, 'g'), arabic);
  });
  
  return converted;
}

function parseTimeToSeconds(timeStr) {
  // Remove spaces
  timeStr = timeStr.trim();
  
  // Pattern 1: X:XX or X:XX:XX format
  let match = timeStr.match(/(\d{1,3}):(\d{1,2})(?::(\d{1,2}))?/);
  if (match) {
    const hours = match[3] ? parseInt(match[1], 10) : 0;
    const minutes = match[3] ? parseInt(match[2], 10) : parseInt(match[1], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  // Pattern 2: X分X秒 or X分X format
  match = timeStr.match(/(\d{1,3})分(\d{1,2})(?:秒)?/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    return minutes * 60 + seconds;
  }
  
  // Pattern 2.5: X分 format (without seconds)
  match = timeStr.match(/(\d{1,3})分$/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    return minutes * 60;
  }
  
  // Pattern 3: X秒 format
  match = timeStr.match(/(\d+)[秒sS]/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Pattern 4: XX：XX Chinese colon
  match = timeStr.match(/(\d{1,3})：(\d{1,2})/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    return minutes * 60 + seconds;
  }
  
  return null;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 时间格式的公共模式
const TIME_PATTERN = {
  // 标准时间格式：1:30、1:30:45、2分30秒
  STANDARD: `\\d{1,3}[:：分]\\d{1,2}(?:[:：秒]\\d{1,2})?`,
  // 秒数格式：30秒、45s、60S
  SECONDS: `\\d+[秒sS]`,
  // 分秒格式：2分、3分30秒、8分15
  MINUTES: `\\d{1,3}分\\d{1,2}(?:秒)?|\\d{1,3}分(?!钟)`
};

// 组合所有时间格式 - 必须在TIME_PATTERN定义之后
const TIME_PATTERN_ALL = `(?:${TIME_PATTERN.STANDARD}|${TIME_PATTERN.SECONDS}|${TIME_PATTERN.MINUTES})`;

// 关键词模式
const KEYWORDS = {
  // 跳转相关
  JUMP: `(?:空降|指路|跳转|直达|进度条|跳过片头|广告结束|正片开始)`,
  // 感谢相关
  THANKS: `(?:谢谢|感谢|谢|多谢|感恩|鸣谢|致谢|thanks|thank|thx|tks|3q|3Q|蟹蟹|xiexie|XIEXIE)`,
  // 标记相关
  MARK: `(?:mark|标记|记号|坐标|位置|处|点)`,
  // 称呼相关
  TITLE: `(?:郎|君|酱|兄|哥|姐|妹|侠|总|爷|奶|老师|大佬|大神)`,
  // 动作相关
  ACTION: `(?:跳到|飞到|直达|到达|转到|去|到|跳转|跳过)`,
  // 导航相关
  NAVIGATION: `(?:指导|导航|引导|带路|领路|路标|指路)`,
  // 广告相关
  AD: `(?:广告|片头|op|OP|开头|前奏|intro|INTRO)`
};

// 增强的关键词模式，用于识别跳转时间戳
const keywordPatterns = [
  // Pattern 1: 关键词后跟时间（最常见）
  // 例子：空降1:30、指路2分30秒、跳过片头30秒
  new RegExp(`${KEYWORDS.JUMP}[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 2: 时间后跟关键词
  // 例子：1:30空降、2分30秒指路、30秒直达
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.JUMP}`, 'i'),
  
  // Pattern 3: 感谢消息中的时间
  // 例子：谢谢八分十五郎、感谢1:30、谢2分30秒
  new RegExp(`${KEYWORDS.THANKS}.*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 4: 带称呼的时间
  // 例子：1:30郎、2分30秒君、30秒大佬
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.TITLE}`, 'i'),
  
  // Pattern 5: 标记时间
  // 例子：1:30mark、2分30秒标记、30秒处
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.MARK}`, 'i'),
  
  // Pattern 6: 动作相关时间
  // 例子：跳到1:30、飞到2分30秒、直达30秒
  new RegExp(`${KEYWORDS.ACTION}[\\s]*(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 7: 导航相关时间
  // 例子：指导1:30、导航2分30秒、指路30秒
  new RegExp(`${KEYWORDS.NAVIGATION}[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 8: 广告结束时间
  // 例子：广告结束1:30、片头完2分30秒、op结束30秒
  new RegExp(`${KEYWORDS.AD}[^\\d]*?(?:完|完了|结束|到|至)[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 9: 分P标记
  // 例子：P1 1:30、P2 2分30秒、P3 30秒
  new RegExp(`P\\d+[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 10: 跨视频跳转
  // 例子：上集1:30、下集2分30秒、下一集30秒
  new RegExp(`(?:上|下|下一)集[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 11: 进度条相关
  // 例子：进度条君1:30、进度条2分30秒
  new RegExp(`(?:进度条君|进度条)[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 12: 指挥部相关
  // 例子：指挥部1:30、指挥部2分30秒
  new RegExp(`指挥部[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 13: 独立时间格式（仅时间，无其他内容）
  // 例子：七分15秒、3分20秒、1:30
  new RegExp(`^(${TIME_PATTERN_ALL})$`)
];

// Main pattern matching function with time clustering
function analyzeDanmakuForTimestamps(danmakuList, videoDuration = null) {
  console.log("analyzeDanmakuForTimestamps called with", danmakuList.length, "danmaku items");
  
  // Add debugging to check the danmaku data structure
  if (danmakuList && danmakuList.length > 0) {
    console.log("Sample danmaku structure:", JSON.stringify(danmakuList[0]));
    console.log("First 5 danmaku with 八分十五郎:", 
      danmakuList.filter(d => d.text && d.text.includes("八分十五郎")).slice(0, 5)
    );
  }
  
  const timeCounts = {};
  const timeStamps = []; // Store all extracted timestamps for clustering
  const matchedDanmaku = [];
  const patternMatchCounts = keywordPatterns.map(() => 0);
  
  // Process each danmaku to find timestamps
  let processedCount = 0;
  let textlessCount = 0;
  
  for (const danmaku of danmakuList) {
    if (!danmaku.text) {
      textlessCount++;
      continue;
    }
    
    processedCount++;
    
    const originalText = danmaku.text;
    const convertedText = convertChineseNumbersToArabic(danmaku.text);
    
    // Debug log for specific danmaku
    if (originalText.includes("八分十五郎")) {
      console.log("DEBUG: Found target danmaku:", originalText);
      console.log("DEBUG: Converted to:", convertedText);
    }
    
    // Track if we've already found a timestamp in this danmaku
    let foundTimestamp = null;
    let bestMatch = null;
    
    for (let patternIndex = 0; patternIndex < keywordPatterns.length; patternIndex++) {
      const pattern = keywordPatterns[patternIndex];
      let match = convertedText.match(pattern);
      
      if (!match) {
        match = originalText.match(pattern);
      }
      
      if (match) {
        patternMatchCounts[patternIndex]++;
        
        // Debug log for pattern matches
        if (originalText.includes("八分十五郎")) {
          console.log(`DEBUG: Pattern ${patternIndex} matched:`, match);
        }
        
        let seconds = null;
        let extractedStr = '';
        
        // Since all patterns now capture the time string in group 1,
        // we need to extract the time string from the captured group
        let timeStr = match[1];
        
        // If no capture group, try to extract time from the full match
        if (!timeStr && match[0]) {
          // Extract time from the full match string
          const timeMatch = match[0].match(/\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?/);
          if (timeMatch) {
            timeStr = timeMatch[0];
          }
        }
        
        if (timeStr) {
          seconds = parseTimeToSeconds(timeStr);
          extractedStr = timeStr;
        }
        
        if (seconds && seconds >= 5 && (!videoDuration || seconds <= videoDuration)) {
          // If this is the first valid timestamp or a better match, update
          if (!foundTimestamp || patternIndex < bestMatch.patternIndex) {
            foundTimestamp = seconds;
            bestMatch = {
              original: danmaku.text,
              pattern: patternIndex + 1,
              extracted: extractedStr,
              seconds: seconds,
              patternIndex: patternIndex
            };
          }
        }
      }
    }
    
    // Add only the best match from this danmaku to avoid duplicate counting
    if (foundTimestamp && bestMatch) {
      timeStamps.push(foundTimestamp);
      matchedDanmaku.push({
        original: bestMatch.original,
        pattern: bestMatch.pattern,
        extracted: bestMatch.extracted,
        seconds: bestMatch.seconds
      });
    }
  }
  
  // Time clustering with 2-second window tolerance
  // This algorithm groups timestamps that are within 2 seconds of each other into clusters
  // For example: 1:05, 1:06, and 1:07 would be in the same cluster
  // Then selects the cluster with the most votes and returns the earliest time from that cluster
  const clusters = [];
  
  if (timeStamps.length > 0) {
    // Sort all timestamps
    timeStamps.sort((a, b) => a - b);
    
    // Create clusters with 2-second tolerance
    for (const timestamp of timeStamps) {
      let addedToCluster = false;
      
      // Check existing clusters
      for (const cluster of clusters) {
        // Check if timestamp fits in any existing cluster (within 2 seconds of any member)
        if (cluster.timestamps.some(t => Math.abs(t - timestamp) <= 2)) {
          cluster.timestamps.push(timestamp);
          cluster.count++;
          addedToCluster = true;
          break;
        }
      }
      
      // Create new cluster if not added to existing one
      if (!addedToCluster) {
        clusters.push({
          timestamps: [timestamp],
          count: 1,
          minTime: timestamp,
          maxTime: timestamp
        });
      }
    }
    
    // Update cluster min/max times
    for (const cluster of clusters) {
      cluster.minTime = Math.min(...cluster.timestamps);
      cluster.maxTime = Math.max(...cluster.timestamps);
    }
  }
  
  // Find the cluster with the most votes
  let bestCluster = null;
  let maxCount = 0;
  
  for (const cluster of clusters) {
    if (cluster.count > maxCount) {
      maxCount = cluster.count;
      bestCluster = cluster;
    }
  }
  
  // Get the earliest time from the best cluster
  let bestTime = null;
  if (bestCluster) {
    bestTime = bestCluster.minTime;
  }
  
  // Build timeCounts for backward compatibility (using cluster min times)
  for (const cluster of clusters) {
    timeCounts[cluster.minTime] = cluster.count;
  }
  
  console.log("Pattern matching complete:");
  console.log("Total danmaku processed:", processedCount, "Textless danmaku:", textlessCount);
  console.log("Pattern match counts:", patternMatchCounts);
  console.log("Clusters:", clusters);
  console.log("Best cluster:", bestCluster);
  console.log("Best time:", bestTime, `(${maxCount} votes)`);
  console.log("Matched danmaku count:", matchedDanmaku.length);
  console.log("Sample matched danmaku:", matchedDanmaku.slice(0, 5));
  
  return {
    bestTime: bestTime,
    voteCount: maxCount,
    timeCounts: timeCounts,
    matchedDanmaku: matchedDanmaku,
    patternMatchCounts: patternMatchCounts,
    clusters: clusters
  };
}

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background: Received message:", request);
  
  if (request.action === "fetchDanmaku") {
    console.log("Background: Processing fetchDanmaku request");
    console.log("Background: Request details:", JSON.stringify(request));
    
    // Try to get CID through various means
    if (request.cid) {
      console.log("Background: Using provided CID:", request.cid);
      // Determine days to fetch
      chrome.storage.sync.get(["daysToFetch"], async (result) => {
        const daysToFetch = result.daysToFetch || 7;
        console.log("Background: Days to fetch:", daysToFetch);
        
        // Check cache first
        {
          const cacheKey = `danmaku_cache_${request.cid}`;
          console.log("Background: Checking cache for key:", cacheKey);
          const cached = await chrome.storage.local.get([cacheKey]);
          
          if (cached[cacheKey]) {
            const cacheData = cached[cacheKey];
            const now = Date.now();
            const cacheAge = (now - cacheData.timestamp) / 1000;
            console.log("Background: Found cache, age:", cacheAge, "seconds");
            console.log("Background: Cache daysToFetch:", cacheData.daysToFetch, "Current daysToFetch:", daysToFetch);
            console.log("Background: Cache contains", cacheData.danmaku ? cacheData.danmaku.length : 0, "danmaku items");
            console.log("Background: Cache has patternResult:", !!cacheData.patternResult);
            
            // Use cache if it's less than 12 hours old and has the same daysToFetch setting
            const maxCacheAge = 12 * 3600000; // 12 hours in milliseconds
            const isCacheFresh = cacheData.timestamp > now - maxCacheAge;
            const isDaysToFetchSame = cacheData.daysToFetch === daysToFetch;
            
            console.log("Background: Cache fresh?", isCacheFresh, "Days match?", isDaysToFetchSame);
            
            if (isCacheFresh && isDaysToFetchSame) {
              console.log("Background: Cache is valid, using cached danmaku for CID:", request.cid);
              sendResponse({ 
                success: true, 
                danmaku: cacheData.danmaku,
                patternResult: cacheData.patternResult || null
              });
              return;
            } else {
              console.log("Background: Cache is stale or settings changed, will fetch new data");
              console.log("Background: Reason - Fresh:", isCacheFresh, "Days match:", isDaysToFetchSame);
            }
          } else {
            console.log("Background: No cache found for CID:", request.cid);
          }
        }
        
        try {
          // Fetch real danmaku
          const danmakuList = await fetchRealDanmaku(request.cid, request.videoDuration, daysToFetch);
          
          // Run pattern matching
          const patternResult = analyzeDanmakuForTimestamps(danmakuList, request.videoDuration);
          console.log("Background: Pattern matching result:", patternResult);
          
          // Cache the result with pattern matching
          const cacheKey = `danmaku_cache_${request.cid}`;
          const cacheData = {
            danmaku: danmakuList,
            patternResult: patternResult,
            timestamp: Date.now(),
            daysToFetch: daysToFetch
          };
          console.log("Background: Caching danmaku for CID:", request.cid, "with", danmakuList.length, "items and pattern result");
          console.log("Background: Cache key:", cacheKey);
          console.log("Background: Pattern result being cached:", patternResult);
          
          try {
            await chrome.storage.local.set({
              [cacheKey]: cacheData
            });
            console.log("Background: Cache saved successfully");
            
            // Verify cache was saved
            const verifyCache = await chrome.storage.local.get([cacheKey]);
            console.log("Background: Cache verification:", !!verifyCache[cacheKey]);
          } catch (cacheError) {
            console.error("Background: Error saving cache:", cacheError);
          }
          
          sendResponse({ 
            success: true, 
            danmaku: danmakuList,
            patternResult: patternResult 
          });
        } catch (error) {
          console.error("Background: Critical error fetching danmaku:", error);
          sendResponse({ success: false, error: error.message });
        }
      });
      
    } else {
      // No direct CID available, try to get it from other data
      console.log("Background: No CID provided, trying to extract from available data...");
      
      chrome.storage.sync.get(["danmakuMethod", "daysToFetch"], async (result) => {
        const method = result.danmakuMethod || "real";
        const daysToFetch = result.daysToFetch || 7;
        
        // Try extracting from initialStateData first
        if (request.initialStateData && request.initialStateData.cid) {
          console.log("Background: Found CID in initialStateData:", request.initialStateData.cid);
          try {
            let danmakuList;
            if (method === "mockData") {
              danmakuList = await fetchMockDanmaku(request.initialStateData.cid, request.videoDuration);
            } else {
              danmakuList = await fetchRealDanmaku(request.initialStateData.cid, request.videoDuration, daysToFetch);
            }
            
            // Run pattern matching
            const patternResult = analyzeDanmakuForTimestamps(danmakuList, request.videoDuration);
            console.log("Background: Pattern matching result:", patternResult);
            
            sendResponse({ 
              success: true, 
              danmaku: danmakuList,
              patternResult: patternResult
            });
          } catch (error) {
            console.error("Background: Error fetching danmaku with initialStateData CID:", error);
            // Continue with BV ID instead of failing immediately
            extractCidAndFetchDanmaku(request, sendResponse, method);
          }
        } else if (request.bvid || request.aid) {
          // We have a BV ID or AV ID, use it to get CID
          extractCidAndFetchDanmaku(request, sendResponse, method);
        } else {
          // No identifying information, return mock data as fallback
          console.warn("Background: No video identifiers available, using mock data");
          fetchMockDanmaku(null, request.videoDuration)
            .then(danmakuList => {
              sendResponse({ success: true, danmaku: danmakuList });
            })
            .catch(error => {
              console.error("Background: Error generating mock danmaku:", error);
              sendResponse({ success: false, error: "无法生成弹幕数据" });
            });
        }
      });
    }
    
    return true; // Indicates that the response will be sent asynchronously
  }
});

// Helper function to extract CID from various sources and fetch danmaku
async function extractCidAndFetchDanmaku(request, sendResponse, method = "real") {
  // Get daysToFetch setting
  const settings = await chrome.storage.sync.get(['daysToFetch']);
  const daysToFetch = settings.daysToFetch || 7;
  let extractionPromise;
  
  // Try BV ID first
  if (request.bvid) {
    console.log("Background: Attempting to get CID from BV ID:", request.bvid);
    extractionPromise = fetchCidFromBvid(request.bvid, request.currentPage)
      .catch(error => {
        console.error("Background: Error in fetchCidFromBvid:", error);
        throw error;
      });
  }
  // Then try AV ID
  else if (request.aid) {
    console.log("Background: Attempting to get CID from AV ID:", request.aid);
    extractionPromise = fetchCidFromAid(request.aid, request.currentPage);
  }
  // Finally try URL parsing as last resort
  else if (request.url) {
    console.log("Background: Attempting to extract video info from URL:", request.url);
    extractionPromise = extractInfoFromUrl(request.url);
  }
  // No viable info
  else {
    console.error("Background: No viable video identifiers found");
    extractionPromise = Promise.resolve(null);
  }
  
  // Process the extraction result
  extractionPromise
    .then(async cid => {
      if (cid) {
        console.log("Background: Successfully got CID:", cid);
        // First check if we have cached data for this CID
        const cacheKey = `danmaku_cache_${cid}`;
        const cached = await chrome.storage.local.get([cacheKey]);
        
        if (cached[cacheKey]) {
          const cacheData = cached[cacheKey];
          const now = Date.now();
          const cacheAge = (now - cacheData.timestamp) / 1000;
          console.log("Background: Found cache for extracted CID, age:", cacheAge, "seconds");
          
          const maxCacheAge = 12 * 3600000; // 12 hours
          const isCacheFresh = cacheData.timestamp > now - maxCacheAge;
          const isDaysToFetchSame = cacheData.daysToFetch === daysToFetch;
          
          if (isCacheFresh && isDaysToFetchSame) {
            console.log("Background: Using cached data for extracted CID:", cid);
            return { cid, danmakuList: cacheData.danmaku, patternResult: cacheData.patternResult };
          }
        }
        
        // No cache or stale, fetch new data
        const danmakuList = await fetchRealDanmaku(cid, request.videoDuration, daysToFetch);
        return { cid, danmakuList };
      } else {
        console.error("Background: Failed to get CID");
        throw new Error("无法获取视频CID");
      }
    })
    .then(async ({ cid, danmakuList, patternResult }) => {
      // If we have cached pattern result, use it
      if (patternResult) {
        sendResponse({ 
          success: true, 
          danmaku: danmakuList,
          patternResult: patternResult
        });
        return;
      }
      
      // Run pattern matching
      patternResult = analyzeDanmakuForTimestamps(danmakuList, request.videoDuration);
      console.log("Background: Pattern matching result:", patternResult);
      
      // Cache the result
      const cacheKey = `danmaku_cache_${cid}`;
      const cacheData = {
        danmaku: danmakuList,
        patternResult: patternResult,
        timestamp: Date.now(),
        daysToFetch: daysToFetch
      };
      
      console.log("Background: Caching with extracted CID:", cid);
      try {
        await chrome.storage.local.set({
          [cacheKey]: cacheData
        });
        console.log("Background: Cache saved successfully for extracted CID");
      } catch (error) {
        console.error("Background: Error saving cache:", error);
      }
      
      sendResponse({ 
        success: true, 
        danmaku: danmakuList,
        patternResult: patternResult
      });
    })
    .catch(error => {
      console.error("Background: Error in extraction process:", error);
      sendResponse({ success: false, error: error.message || "无法获取弹幕数据" });
    });
}

// Function to get CID from BV ID using Bilibili API
async function fetchCidFromBvid(bvid, page = 1) {
  try {
    console.log(`Background: Fetching CID for BV ID: ${bvid}, page: ${page}`);
    console.log("Background: Starting API requests...");
    
    // Try multiple API endpoints to get the CID
    // Method 1: x/web-interface/view API (most reliable)
    let apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    console.log(`Background: Trying API endpoint: ${apiUrl}`);
    
    let response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
      }
    });
    
    console.log(`Background: API response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Background: web-interface/view API response:", JSON.stringify(data));
      
      if (data && data.code === 0 && data.data) {
        // If it's a multi-page video and page is specified
        if (data.data.pages && data.data.pages.length > 0 && page > 1) {
          const pageData = data.data.pages.find(p => p.page === page);
          if (pageData && pageData.cid) {
            console.log(`Background: Found CID: ${pageData.cid} for BV ID: ${bvid}, page: ${page}`);
            return pageData.cid;
          }
        }
        
        // Otherwise return the main CID
        if (data.data.cid) {
          console.log(`Background: Found CID: ${data.data.cid} for BV ID: ${bvid} using web-interface/view API`);
          return data.data.cid;
        }
      }
    } else {
      console.warn(`API request failed with status ${response.status} for web-interface/view`);
    }
    
    // Method 2: x/player/pagelist API (fallback)
    apiUrl = `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`;
    console.log(`Background: Trying fallback API endpoint: ${apiUrl}`);
    
    response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
        'Origin': 'https://www.bilibili.com'
      }
    });
    
    console.log(`Background: Method 2 API response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Background: player/pagelist API response:", JSON.stringify(data));
      
      if (data && data.code === 0 && data.data && data.data.length > 0) {
        // Try to find the page if specified
        if (page > 1 && data.data.length >= page) {
          const cid = data.data[page - 1].cid;
          console.log(`Background: Found CID: ${cid} for BV ID: ${bvid}, page: ${page}`);
          return cid;
        }
        
        // Otherwise, get CID of the first page
        const cid = data.data[0].cid;
        console.log(`Background: Found CID: ${cid} for BV ID: ${bvid} using player/pagelist API`);
        return cid;
      }
    } else {
      console.warn(`API request failed with status ${response.status} for player/pagelist`);
    }
    
    // Method 3: Try a more direct API (final fallback)
    apiUrl = `https://api.bilibili.com/x/player/wbi/v2?bvid=${bvid}`;
    console.log(`Background: Trying final fallback API endpoint: ${apiUrl}`);
    
    response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Background: player/wbi/v2 API response:", data);
      
      if (data && data.code === 0 && data.data && data.data.cid) {
        const cid = data.data.cid;
        console.log(`Background: Found CID: ${cid} for BV ID: ${bvid} using player/wbi/v2 API`);
        return cid;
      }
    }
    
    // If all methods fail, log a detailed error
    console.error(`Background: All API methods failed to get CID for BV ID: ${bvid}`);
    return null;
  } catch (error) {
    console.error("Background: Error fetching CID from API:", error);
    console.error("Error details:", error.message, error.stack);
    return null;
  }
}

// Function to get CID from AV ID using Bilibili API
async function fetchCidFromAid(aid, page = 1) {
  try {
    console.log(`Background: Fetching CID for AV ID: ${aid}, page: ${page}`);
    
    // Use the view API with aid parameter
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?aid=${aid}`;
    console.log(`Background: Trying API endpoint: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Background: AV ID API response:", data);
      
      if (data && data.code === 0 && data.data) {
        // If it's a multi-page video and page is specified
        if (data.data.pages && data.data.pages.length > 0 && page > 1) {
          const pageData = data.data.pages.find(p => p.page === page);
          if (pageData && pageData.cid) {
            console.log(`Background: Found CID: ${pageData.cid} for AV ID: ${aid}, page: ${page}`);
            return pageData.cid;
          }
        }
        
        // Otherwise return the main CID
        if (data.data.cid) {
          console.log(`Background: Found CID: ${data.data.cid} for AV ID: ${aid}`);
          return data.data.cid;
        }
      }
    } else {
      console.warn(`API request failed with status ${response.status} for AV ID API`);
    }
    
    // If failed, log error
    console.error(`Background: Failed to get CID for AV ID: ${aid}`);
    return null;
  } catch (error) {
    console.error("Background: Error fetching CID from AV ID API:", error);
    return null;
  }
}

// Function to extract video info from URL
async function extractInfoFromUrl(url) {
  try {
    console.log(`Background: Attempting to extract info from URL: ${url}`);
    
    // First try to extract BV ID from URL
    const bvidMatch = url.match(/\/video\/(BV[a-zA-Z0-9]+)/);
    if (bvidMatch && bvidMatch[1]) {
      const bvid = bvidMatch[1];
      console.log(`Background: Extracted BV ID: ${bvid} from URL`);
      
      // Extract page number if present
      let page = 1;
      const pageMatch = url.match(/[?&]p=(\d+)/);
      if (pageMatch && pageMatch[1]) {
        page = parseInt(pageMatch[1], 10);
        console.log(`Background: Extracted page number: ${page} from URL`);
      }
      
      // Get CID from BV ID
      return await fetchCidFromBvid(bvid, page);
    }
    
    // Try to extract AV ID from URL
    const avidMatch = url.match(/\/video\/av(\d+)/);
    if (avidMatch && avidMatch[1]) {
      const aid = avidMatch[1];
      console.log(`Background: Extracted AV ID: ${aid} from URL`);
      
      // Extract page number if present
      let page = 1;
      const pageMatch = url.match(/[?&]p=(\d+)/);
      if (pageMatch && pageMatch[1]) {
        page = parseInt(pageMatch[1], 10);
        console.log(`Background: Extracted page number: ${page} from URL`);
      }
      
      // Get CID from AV ID
      return await fetchCidFromAid(aid, page);
    }
    
    // No identifiers found in URL
    console.warn("Background: No video identifiers found in URL");
    return null;
  } catch (error) {
    console.error("Background: Error extracting info from URL:", error);
    return null;
  }
}

// Function to fetch real danmaku data
async function fetchRealDanmaku(cid, videoDuration, daysToFetch = 7) {
  console.log(`Background: Fetching real danmaku for CID: ${cid} (${daysToFetch} days)`);
  
  // Step 1: Get SESSDATA cookie (but don't validate every time for performance)
  let cookies = null;
  try {
    // Check if we have cached SESSDATA validation
    const cachedValidation = await chrome.storage.local.get(['sessdataValidation']);
    const now = Date.now();
    
    if (cachedValidation.sessdataValidation && 
        cachedValidation.sessdataValidation.timestamp > now - 3600000) { // 1 hour cache
      // Use cached validation result
      cookies = { SESSDATA: cachedValidation.sessdataValidation.sessdata };
    } else {
      // Get and validate SESSDATA
      cookies = await getBilibiliCookies();
      if (!cookies || !cookies.SESSDATA) {
        console.warn("SESSDATA not available, will try limited endpoints");
        cookies = { SESSDATA: "" };
      } else {
        // Cache the validation result
        await chrome.storage.local.set({
          sessdataValidation: {
            sessdata: cookies.SESSDATA,
            timestamp: now
          }
        });
      }
    }
  } catch (error) {
    console.error("Failed to get cookies:", error);
    cookies = { SESSDATA: "" };
  }
  
  const allDanmaku = [];
  const uniqueDanmaku = new Set();
  
  try {
    // Set proper headers matching the BiLiBiLi_DanMu_Crawling project
    const headers = {
      'Cookie': `SESSDATA=${cookies.SESSDATA}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com',
      'Origin': 'https://www.bilibili.com',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site'
    };

    // Method 1: Try to fetch multiple days of historical danmaku (parallel)
    const today = new Date();
    
    console.log(`Background: Starting to fetch ${daysToFetch} days of historical danmaku in parallel...`);
    
    // Create array of promises for parallel fetching
    const historyPromises = [];
    
    for (let i = 0; i < daysToFetch; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const historyUrl = `https://api.bilibili.com/x/v2/dm/web/history/seg.so?type=1&oid=${cid}&date=${dateStr}`;
      
      // Add small delay between launching requests to avoid overwhelming the server
      const delayedPromise = new Promise(async (resolve) => {
        await new Promise(r => setTimeout(r, i * 100)); // 100ms stagger to avoid rate limiting
        
        console.log(`Background: Fetching historical danmaku for date ${dateStr}`);
        
        try {
          const historyResponse = await fetch(historyUrl, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
          
          if (historyResponse.ok) {
            const buffer = await historyResponse.arrayBuffer();
            if (buffer.byteLength > 0) {
              const danmakuData = parseDanmakuProtobuf(buffer);
              console.log(`Background: Got ${danmakuData.length} danmaku for date ${dateStr}`);
              resolve(danmakuData);
            } else {
              resolve([]);
            }
          } else {
            console.warn(`History API returned status ${historyResponse.status} for date ${dateStr}`);
            resolve([]);
          }
        } catch (dateError) {
          console.warn(`Failed to fetch danmaku for date ${dateStr}:`, dateError);
          resolve([]);
        }
      });
      
      historyPromises.push(delayedPromise);
    }
    
    // Wait for all historical danmaku to be fetched
    const historyResults = await Promise.all(historyPromises);
    
    // Merge results
    historyResults.forEach(danmakuData => {
      danmakuData.forEach(item => {
        const key = `${item.progress}_${item.content}`;
        if (!uniqueDanmaku.has(key)) {
          uniqueDanmaku.add(key);
          allDanmaku.push({
            time: item.progress / 1000,
            text: item.content || ''
          });
        }
      });
    });
    
    console.log(`Background: Total unique danmaku from history: ${allDanmaku.length}`);
    
    // Method 2: If historical API fails or gives insufficient data, try segments
    if (allDanmaku.length < 500) { // Keep original threshold
      console.log("Background: Fetching additional danmaku via segments in parallel...");
      
      // Calculate number of segments based on video duration (6 minutes per segment)
      const segmentCount = videoDuration ? Math.ceil(videoDuration / 360) : 10;
      const maxSegments = Math.min(segmentCount, 15); // Keep original 15 segments limit
      
      console.log(`Background: Video duration: ${videoDuration}s, segments to fetch: ${maxSegments}`);
      
      // Create array of promises for parallel segment fetching
      const segmentPromises = [];
      
      // Split segments into batches to avoid too many concurrent requests
      const batchSize = 5;
      const batches = Math.ceil(maxSegments / batchSize);
      
      for (let batch = 0; batch < batches; batch++) {
        const startSegment = batch * batchSize + 1;
        const endSegment = Math.min((batch + 1) * batchSize, maxSegments);
        
        for (let segmentIndex = startSegment; segmentIndex <= endSegment; segmentIndex++) {
          // Try both web and mobile endpoints for better coverage
          const endpoints = [
            `https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${cid}&segment_index=${segmentIndex}`,
            `https://api.bilibili.com/x/v2/dm/list/seg.so?type=1&oid=${cid}&segment_index=${segmentIndex}`
          ];
          
          const delayedPromise = new Promise(async (resolve) => {
            // Add delay based on batch and position
            await new Promise(r => setTimeout(r, batch * 500 + (segmentIndex - startSegment) * 100));
            
            console.log(`Background: Fetching segment ${segmentIndex}...`);
            
            let allSegmentData = [];
            
            for (const segmentUrl of endpoints) {
              try {
                const segmentResponse = await fetch(segmentUrl, {
                  method: 'GET',
                  headers: headers,
                  credentials: 'include'
                });
                
                if (segmentResponse.ok) {
                  const buffer = await segmentResponse.arrayBuffer();
                  if (buffer.byteLength > 0) {
                    const danmakuData = parseDanmakuProtobuf(buffer);
                    console.log(`Background: Got ${danmakuData.length} danmaku for segment ${segmentIndex} from ${segmentUrl.includes('web') ? 'web' : 'mobile'}`);
                    allSegmentData = allSegmentData.concat(danmakuData);
                  }
                }
              } catch (segmentError) {
                console.warn(`Failed to fetch segment ${segmentIndex} from ${segmentUrl}:`, segmentError);
              }
            }
            
            resolve(allSegmentData);
          });
          
          segmentPromises.push(delayedPromise);
        }
      }
      
      // Wait for all segments to be fetched
      const segmentResults = await Promise.all(segmentPromises);
      
      // Merge results
      segmentResults.forEach(danmakuData => {
        danmakuData.forEach(item => {
          const key = `${item.progress}_${item.content}`;
          if (!uniqueDanmaku.has(key)) {
            uniqueDanmaku.add(key);
            allDanmaku.push({
              time: item.progress / 1000,
              text: item.content || ''
            });
          }
        });
      });
      
      console.log(`Background: Total unique danmaku after segments: ${allDanmaku.length}`);
    }
    
    // Method 3: Fetch BAS danmaku (special danmaku)
    if (allDanmaku.length < 100) { // Keep original threshold of 100
      console.log("Background: Fetching BAS danmaku...");
      try {
        const basUrl = `https://api.bilibili.com/x/v2/dm/web/view?type=1&oid=${cid}`;
        const basResponse = await fetch(basUrl, {
          method: 'GET',
          headers: headers,
          credentials: 'include'
        });
        
        if (basResponse.ok) {
          const buffer = await basResponse.arrayBuffer();
          if (buffer.byteLength > 0) {
            const basData = parseDanmakuProtobuf(buffer);
            console.log(`Background: Got ${basData.length} BAS danmaku`);
            
            basData.forEach(item => {
              // Skip BAS danmaku (pool type 2) for parachute detection
              if (item.pool !== 2) {
                const key = `${item.progress}_${item.content}`;
                if (!uniqueDanmaku.has(key)) {
                  uniqueDanmaku.add(key);
                  allDanmaku.push({
                    time: item.progress / 1000,
                    text: item.content || ''
                  });
                }
              }
            });
          }
        }
      } catch (basError) {
        console.warn("Failed to fetch BAS danmaku:", basError);
      }
    }
    
    console.log(`Background: Total unique danmaku collected: ${allDanmaku.length}`);
    
    // Sort by time
    allDanmaku.sort((a, b) => a.time - b.time);
    
    return allDanmaku;
    
  } catch (error) {
    console.error("Failed to fetch or parse real danmaku:", error);
    throw error;
  }
}


// Helper function to get cookies
async function getBilibiliCookies() {
  // First try to get from storage (user-configured)
  const stored = await chrome.storage.sync.get(["SESSDATA"]);
  if (stored.SESSDATA && stored.SESSDATA.trim() !== '') {
    console.log("Using SESSDATA from storage");
    // Validate that the SESSDATA hasn't expired
    const isValid = await validateSESSDATA(stored.SESSDATA);
    if (isValid) {
      return { "SESSDATA": stored.SESSDATA };
    } else {
      console.warn("Stored SESSDATA is invalid or expired");
    }
  }
  
  // Try to get cookie using chrome.cookies API
  try {
    // This requires cookies permission in manifest.json
    // We first check if cookies permission is available
    if (chrome.cookies) {
      // Try different cookie domains and variations
      const cookieDomains = [
        { url: 'https://www.bilibili.com', domain: '.bilibili.com' },
        { url: 'https://bilibili.com', domain: 'bilibili.com' },
        { url: 'https://api.bilibili.com', domain: '.bilibili.com' },
        { url: 'https://www.bilibili.com', domain: 'www.bilibili.com' }
      ];
      
      // First try with the direct get method
      for (const config of cookieDomains) {
        try {
          const cookie = await chrome.cookies.get({
            url: config.url,
            name: 'SESSDATA'
          });
          
          if (cookie && cookie.value) {
            console.log(`Successfully retrieved SESSDATA from chrome.cookies API for domain: ${config.url}`);
            const isValid = await validateSESSDATA(cookie.value);
            if (isValid) {
              return { "SESSDATA": cookie.value };
            }
          }
        } catch (domainError) {
          // Try with getAll method as fallback
          try {
            const cookies = await chrome.cookies.getAll({
              domain: config.domain,
              name: 'SESSDATA'
            });
            
            if (cookies && cookies.length > 0) {
              for (const cookie of cookies) {
                const isValid = await validateSESSDATA(cookie.value);
                if (isValid) {
                  console.log(`Successfully retrieved SESSDATA using getAll for domain: ${config.domain}`);
                  return { "SESSDATA": cookie.value };
                }
              }
            }
          } catch (getAllError) {
            console.warn(`Could not get cookies for domain ${config.domain}:`, getAllError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error accessing cookies:", error);
  }
  
  console.warn("SESSDATA cookie not found or invalid. Danmaku fetching will fail.");
  return null;
}

// Function to validate SESSDATA by making a test API call
async function validateSESSDATA(sessdata) {
  try {
    // Make a lightweight API call to check if SESSDATA is valid
    const testUrl = 'https://api.bilibili.com/x/web-interface/nav';
    const response = await fetch(testUrl, {
      headers: {
        'Cookie': `SESSDATA=${sessdata}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Check if the response indicates a logged-in state
      if (data && data.code === 0 && data.data && data.data.isLogin) {
        console.log("SESSDATA is valid and user is logged in");
        return true;
      }
    }
  } catch (error) {
    console.error("Error validating SESSDATA:", error);
  }
  
  return false;
}

console.log("B站空降广告跳转助手 background script loaded.");