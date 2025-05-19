// Test the improved pattern matching logic

function convertChineseNumbersToArabic(text) {
  const chineseNumbers = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, 
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '两': 2,
    '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5, 
    '陆': 6, '柒': 7, '捌': 8, '玖': 9, '拾': 10
  };
  
  let converted = text;
  
  converted = converted.replace(/([一二三四五六七八九壹贰叁肆伍陆柒捌玖])?十([一二三四五六七八九壹贰叁肆伍陆柒捌玖])?/g, (match, tens, ones) => {
    const tensValue = tens ? chineseNumbers[tens] : 1;
    const onesValue = ones ? chineseNumbers[ones] : 0;
    return tensValue * 10 + onesValue;
  });
  
  converted = converted.replace(/([二三四五六七八九贰叁肆伍陆柒捌玖])十/g, (match, tens) => {
    return chineseNumbers[tens] * 10;
  });
  
  Object.entries(chineseNumbers).forEach(([chinese, arabic]) => {
    converted = converted.replace(new RegExp(chinese, 'g'), arabic);
  });
  
  return converted;
}

// Test patterns (matching the background.js pattern style)
const patterns = [
  // Pattern 9: Time with nicknames using single capture group (谢谢八分十五郎)
  /(?:谢谢|感谢|谢|多谢|感恩|鸣谢|致谢).*?(\d{1,3}分(?:\d{1,2}秒)?)/i,
  
  // Pattern 10: Simple pattern for "X分X郎" format with single capture (我是八分十五郎)  
  /(\d{1,3}分\d{1,2})郎/
];

// Test texts
const testTexts = [
  "我是八分十五郎，猜猜我为啥在这",
  "谢谢八分十五郎",
  "感谢三分二十郎"
];

testTexts.forEach(text => {
  const converted = convertChineseNumbersToArabic(text);
  console.log(`\nTesting: "${text}"`);
  console.log(`Converted: "${converted}"`);
  
  patterns.forEach((pattern, index) => {
    const match = converted.match(pattern);
    if (match) {
      console.log(`Pattern ${index + 9} matched:`, match);
      
      // Apply the new pattern logic
      let timeStr = match[1];
      
      // If no capture group, try to extract time from the full match
      if (!timeStr && match[0]) {
        const timeMatch = match[0].match(/\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?/);
        if (timeMatch) {
          timeStr = timeMatch[0];
        }
      }
      
      if (timeStr) {
        console.log(`Extracted time string: ${timeStr}`);
        // Here you would normally call parseTimeToSeconds(timeStr)
      }
    }
  });
});