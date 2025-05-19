// Test all pattern matching fixes with comprehensive test cases

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

// Copy all patterns from background.js
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

// All patterns from background.js
const keywordPatterns = [
  // Pattern 1: 关键词后跟时间
  new RegExp(`${KEYWORDS.JUMP}[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 2: 时间后跟关键词
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.JUMP}`, 'i'),
  
  // Pattern 3: 感谢消息中的时间
  new RegExp(`${KEYWORDS.THANKS}.*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 4: 带称呼的时间
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.TITLE}`, 'i'),
  
  // Pattern 5: 标记时间
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.MARK}`, 'i'),
  
  // Pattern 6: 动作相关时间
  new RegExp(`${KEYWORDS.ACTION}[\\s]*(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 7: 导航相关时间
  new RegExp(`${KEYWORDS.NAVIGATION}[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 8: 广告结束时间
  new RegExp(`${KEYWORDS.AD}[^\\d]*?(?:完|完了|结束|到|至)[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 9: 分P标记
  new RegExp(`P\\d+[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 10: 跨视频跳转
  new RegExp(`(?:上|下|下一)集[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 11: 进度条相关
  new RegExp(`(?:进度条君|进度条)[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  
  // Pattern 12: 指挥部相关
  new RegExp(`指挥部[^\\d]*?(${TIME_PATTERN_ALL})`, 'i')
];

// Comprehensive test cases
const testCases = [
  { text: "空降1:30", pattern: 1 },
  { text: "1:30空降", pattern: 2 },
  { text: "谢谢八分十五郎", pattern: 3 },
  { text: "感谢2分30秒", pattern: 3 },
  { text: "3分20秒大佬", pattern: 4 },
  { text: "2:15mark", pattern: 5 },
  { text: "跳到5分", pattern: 6 },
  { text: "指路3:45", pattern: 7 },
  { text: "广告结束1:20", pattern: 8 },
  { text: "P2 4:30", pattern: 9 },
  { text: "下集2分15秒", pattern: 10 },
  { text: "进度条君5:00", pattern: 11 },
  { text: "指挥部3分10秒", pattern: 12 }
];

console.log("Testing all patterns with comprehensive cases...\n");

let passedTests = 0;
let totalTests = 0;

testCases.forEach((testCase, index) => {
  totalTests++;
  console.log(`\nTest ${index + 1}: "${testCase.text}"`);
  
  const convertedText = convertChineseNumbersToArabic(testCase.text);
  console.log(`Converted: "${convertedText}"`);
  
  let matched = false;
  
  for (let patternIndex = 0; patternIndex < keywordPatterns.length; patternIndex++) {
    const pattern = keywordPatterns[patternIndex];
    let match = convertedText.match(pattern);
    
    if (!match) {
      match = testCase.text.match(pattern);
    }
    
    if (match) {
      console.log(`Pattern ${patternIndex + 1} matched:`, match);
      
      // Extract time string
      let timeStr = match[1];
      
      if (!timeStr && match[0]) {
        const timeMatch = match[0].match(/\\d{1,3}[:：分]\\d{1,2}(?:[:：秒]\\d{1,2})?|\\d+[秒sS]|\\d{1,3}分(?:\\d{1,2}秒)?/);
        if (timeMatch) {
          timeStr = timeMatch[0];
        }
      }
      
      if (timeStr) {
        const seconds = parseTimeToSeconds(timeStr);
        console.log(`Extracted time: ${timeStr} = ${seconds}秒`);
        
        if (patternIndex + 1 === testCase.pattern) {
          console.log(`✓ Correct: Matched expected pattern ${testCase.pattern}`);
          passedTests++;
          matched = true;
          break;
        }
      }
    }
  }
  
  if (!matched) {
    console.log(`✗ Failed: Did not match expected pattern ${testCase.pattern}`);
  }
});

console.log(`\n\nTest Summary: ${passedTests}/${totalTests} tests passed`);
console.log("All pattern matching fixes have been tested.");