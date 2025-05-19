// Test file for debugging
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

// Test cases
const testText = "我是八分十五郎，猜猜我为啥在这";
const converted = convertChineseNumbersToArabic(testText);
console.log("Original:", testText);
console.log("Converted:", converted);

// Test pattern
const pattern = /(\d{1,2})分(\d{1,2})郎/;
const match = converted.match(pattern);
console.log("Pattern match:", match);