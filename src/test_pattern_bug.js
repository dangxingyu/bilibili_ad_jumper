// Test the pattern matching with sample data to debug the issue

// Copy the necessary functions from background.js
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

// Copy pattern definitions
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

const keywordPatterns = [
  new RegExp(`${KEYWORDS.JUMP}[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.JUMP}`, 'i'),
  new RegExp(`${KEYWORDS.THANKS}.*?(${TIME_PATTERN_ALL})`, 'i'),
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.TITLE}`, 'i'),
  new RegExp(`(${TIME_PATTERN_ALL})[^\\d]*?${KEYWORDS.MARK}`, 'i'),
  new RegExp(`${KEYWORDS.ACTION}[\\s]*(${TIME_PATTERN_ALL})`, 'i'),
  new RegExp(`${KEYWORDS.NAVIGATION}[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  new RegExp(`${KEYWORDS.AD}[^\\d]*?(?:完|完了|结束|到|至)[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  new RegExp(`P\\d+[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  new RegExp(`(?:上|下|下一)集[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  new RegExp(`(?:进度条君|进度条)[^\\d]*?(${TIME_PATTERN_ALL})`, 'i'),
  new RegExp(`指挥部[^\\d]*?(${TIME_PATTERN_ALL})`, 'i')
];

// Test with sample danmaku data
const sampleDanmaku = [
  { time: 100, text: "谢谢八分十五郎" },
  { time: 200, text: "空降1:30" },
  { time: 300, text: "感谢5分10秒大佬" },
  { time: 400, text: "2:15进度条君" }
];

console.log("Testing pattern matching with sample danmaku:");

sampleDanmaku.forEach((danmaku, index) => {
  console.log(`\n--- Testing danmaku ${index + 1}: "${danmaku.text}" ---`);
  
  const originalText = danmaku.text;
  const convertedText = convertChineseNumbersToArabic(danmaku.text);
  
  console.log(`Original: ${originalText}`);
  console.log(`Converted: ${convertedText}`);
  
  let foundMatch = false;
  
  keywordPatterns.forEach((pattern, patternIndex) => {
    let match = convertedText.match(pattern);
    
    if (!match) {
      match = originalText.match(pattern);
    }
    
    if (match) {
      console.log(`Pattern ${patternIndex + 1} matched:`, match);
      
      // Extract time string
      let timeStr = match[1];
      
      if (!timeStr && match[0]) {
        const timeMatch = match[0].match(/\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?/);
        if (timeMatch) {
          timeStr = timeMatch[0];
        }
      }
      
      if (timeStr) {
        console.log(`Extracted time string: ${timeStr}`);
        foundMatch = true;
      }
    }
  });
  
  if (!foundMatch) {
    console.log("No pattern matched for this danmaku");
  }
});

// Test with the problematic danmaku specifically
console.log("\n\n=== Testing the problematic danmaku ===");
const problematicDanmaku = { time: 100, text: "谢谢八分十五郎" };

const originalText = problematicDanmaku.text;
const convertedText = convertChineseNumbersToArabic(problematicDanmaku.text);

console.log(`Original: ${originalText}`);
console.log(`Converted: ${convertedText}`);

// Test each pattern individually
keywordPatterns.forEach((pattern, index) => {
  console.log(`\nTesting pattern ${index + 1}:`);
  console.log(`Pattern: ${pattern}`);
  
  const match = convertedText.match(pattern);
  if (match) {
    console.log(`✓ Match found:`, match);
  } else {
    console.log(`✗ No match`);
  }
});