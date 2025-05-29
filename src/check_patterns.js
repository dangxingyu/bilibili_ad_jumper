// Quick check for pattern index issues
const keywordPatterns = [
  // Pattern 1: Keyword followed by time (most common)
  /(?:空降|指路|跳转|直达|进度条|跳过片头|广告结束|正片开始)[^\d]*?(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?)/i,
  
  // Pattern 2: Time followed by keyword
  /(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?)[^\d]*?(?:空降|指路|直达|跳过|正片|广告结束|)/,
  
  // Pattern 7: Time embedded in thanks message (e.g., "谢谢八分十五郎")
  /(?:谢谢|感谢|谢|多谢).*?(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?)/i,
  
  // Pattern 8: Time with context words (e.g., "郎", "君", "大佬")
  /(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?)[^\d]*?(?:郎|君|大佬|老师|先生|女士|哥|姐|弟|妹|兄|侠|总|爷|奶|桑)/,
  
  // Pattern 9: Looser match for specific thanks context (感谢、thanks、谢谢等)
  /(?:感谢|感恩|thanks|thank|thx|tks|谢|谢谢|3q|3Q|蟹蟹|xiexie|XIEXIE|多谢|致谢).*?(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?)/i,
  
  // Pattern 10: Time with suffix like "-mark", "mark", "标记"
  /(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?)[^\d]*?(?:mark|标记|记号|坐标|位置|处|点)/i,
  
  // Pattern 11: Special expressions with time (e.g., "已跳转", "已空降")
  /(?:已跳转|已空降|已到达|已经到|)[^\d]*?(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?)/,
  
  // Pattern 18: Any reasonable looking time format with minimal context
  /(?:^|[^a-zA-Z\d])(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d{1,3}分(?:\d{1,2}秒)?)(?:[^a-zA-Z\d]|$)/,
  
  // Pattern 19: Time with nicknames using Chinese numbers that should have been converted (谢谢八分十五郎)
  /(?:谢谢|感谢|谢|多谢|感恩|鸣谢|致谢).*?(\d{1,2})分(\d{1,2})[^\d]*?(?:郎|君|酱|兄|哥|姐|妹|侠|总|爷|奶|老师|大佬|大神)/i,
  
  // Pattern 20: Simple pattern for "X分X郎" format (我是八分十五郎)
  /(\d{1,2})分(\d{1,2})郎/,
  
  // Pattern 21: Standalone time format (just time, nothing else - e.g., "七分15秒", "3分20秒")
  /^(\d{1,3}[:：分]\d{1,2}(?:[:：秒]\d{1,2})?|\d+[秒sS]|\d{1,3}分(?:\d{1,2}秒)?)$/
];

// Find patterns with two capture groups
console.log("Total patterns:", keywordPatterns.length);
keywordPatterns.forEach((pattern, index) => {
  const testResult = "8分15郎".match(pattern);
  if (testResult && testResult[2]) {
    console.log(`Pattern at index ${index} has two capture groups`);
  }
});