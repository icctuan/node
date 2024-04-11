const fs = require('fs');
const path = require('path');

const targetFolder = path.join(__dirname);
const files = fs.readdirSync(targetFolder);
console.log(files)
colorLog('测试', 'blue')

function colorLog(message, color = 'white') {
  if (!process.stdout.isTTY) {
    console.log(message);
    return;
  }

  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m', // 紫色
    cyan: '\x1b[36m', // 青色
    white: '\x1b[37m'
  };
  const textColor = colors[color] || colors.white
  const reset = '\x1b[0m';

  console.log(textColor, message, reset);
}