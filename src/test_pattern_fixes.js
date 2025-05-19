// Test the fixed pattern matching logic from background.js

// Copy the necessary functions from background.js for testing
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

// Copy the pattern definitions from background.js
const TIME_PATTERN = {
  STANDARD: `\\d{1,3}[:：分]\\d{1,2}(?:[:：秒]\\d{1,2})?`,
  SECONDS: `\\d+[秒sS]`,
  MINUTES: `\\d{1,3}分\\d{1,2}(?:秒)?|\\d{1,3}分(?!钟)`
};

const TIME_PATTERN_ALL = `(?:${TIME_PATTERN.STANDARD}|${TIME_PATTERN.SECONDS}|${TIME_PATTERN.MINUTES})`;

const KEYWORDS = {
  JUMP: `(?:空降|指路|跳转|直达|进度条|跳过片头|广告结束|正片开始)`,
  THANKS: `(?:谢谢|感谢|谢|多谢|感恩|鸣谢|致谢|thanks|thank|thx|tks|3q|3Q|蟹蟹|xiexie|XIEXIE)`,
  MARK: `(?:mark|标记|记号|坐标|位置|处|点)`,
  TITLE: `(?:郎|君|酱|兄|哥|姐|妹|侠|总|爷|奶|老师|大佬|大神)`,
  ACTION: `(?:跳到|飞到|直达|到达|转到|去|到|跳转|跳过)`,
  NAVIGATION: `(?:指导|导航|引导|带路|领路|路标|指路)`,
  AD: `(?:广告|片头|op|OP|开头|前奏|intro|INTRO)`
};

// Create a subset of key patterns for testing
const testPatterns = [
  // Pattern 3: 感谢消息中的时间
  new RegExp(`${KEYWORDS.THANKS}.*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 4: 带称呼的时间
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.TITLE}`, 'i'),
];

// Test cases
const testCases = [
  {
    text: "谢谢八分十五郎",
    expectedMatch: true,
    expectedTime: "8分15秒",
    expectedSeconds: 495
  },
  {
    text: "感谢三分二十秒大佬",
    expectedMatch: true,
    expectedTime: "3分20秒",
    expectedSeconds: 200
  },
  {
    text: "2:30空降",
    expectedMatch: false,  // This wouldn't match our test patterns
    expectedTime: null,
    expectedSeconds: null
  },
  {
    text: "1分30秒君",
    expectedMatch: true,
    expectedTime: "1分30秒",
    expectedSeconds: 90
  }
];

console.log("Testing pattern matching fixes...\n");

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: "${testCase.text}"`);
  
  const originalText = testCase.text;
  const convertedText = convertChineseNumbersToArabic(originalText);
  console.log(`Converted: "${convertedText}"`);
  
  let foundMatch = false;
  
  testPatterns.forEach((pattern, patternIndex) => {
    let match = convertedText.match(pattern);
    
    if (!match) {
      match = originalText.match(pattern);
    }
    
    if (match) {
      console.log(`Pattern ${patternIndex + 1} matched:`, match);
      
      // Extract time string using the new logic
      let timeStr = match[1];
      
      if (!timeStr && match[0]) {
        const timeMatch = match[0].match(/\\d{1,3}[:：分]\\d{1,2}(?:[:：秒]\\d{1,2})?|\\d+[秒sS]|\\d{1,3}分(?:\\d{1,2}秒)?/);
        if (timeMatch) {
          timeStr = timeMatch[0];
        }
      }
      
      if (timeStr) {
        const seconds = parseTimeToSeconds(timeStr);
        console.log(`Extracted time: ${timeStr} = ${seconds}秒 = ${formatTime(seconds)}`);
        
        foundMatch = true;
        
        // Verify against expected results
        if (testCase.expectedMatch) {
          if (seconds === testCase.expectedSeconds) {
            console.log(`✓ Correct: Expected ${testCase.expectedSeconds} seconds`);
          } else {
            console.log(`✗ Incorrect: Expected ${testCase.expectedSeconds} seconds, got ${seconds}`);
          }
        }
      }
    }
  });
  
  if (!foundMatch && testCase.expectedMatch) {
    console.log(`✗ Failed: Expected to match but didn't`);
  } else if (foundMatch && !testCase.expectedMatch) {
    console.log(`✗ Failed: Matched but shouldn't have`);
  } else if (!foundMatch && !testCase.expectedMatch) {
    console.log(`✓ Correct: Didn't match as expected`);
  }
});

console.log("\n\nPattern matching test complete.");