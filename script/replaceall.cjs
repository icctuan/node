// 文本匹配替换的脚本

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('请输入项目类型 (ra, tern, bclass, system): ', (input) => {
  // 项目类型枚举
  const projectType = {
    ra: 'RA',
    tern: 'TERN',
    bclass: 'BCLASS',
    system: 'SYSTEM'
  };

  // 各项目需移除的文件夹名称
  const removeFolder = {
    RA: ['Collection-BClass', 'Collection-tern'],
    TERN: ['Collection-BClass', 'Collection-ra'],
    BCLASS: ['Collection-ra', 'Collection-tern'],
    SYSTEM: ['Collection-ra']
  }

  // 确保输入有效，然后将其转换为对应的类型
  const curType = projectType[input.trim().toLowerCase()];
  if (curType) {
    console.log(`你选择了项目类型: ${curType}`);

    // 打包产物所在的目录
    const targetFolder = path.join(__dirname, 'Collection');

    // 全局替换的内容
    const globalReplace = [
      {
        oldString: 'someString',
        newString: 'this.pcSend=function(e){}',
        replace: true,
      },
      {
        oldString: 'anotherString',
        newString: '{key:"fetchRemoteConfigJson",value:function(e){}}',
        replace: true,
      },
      {
        oldString: '"accessApi":',
        newString: '',
        replace: curType !== projectType.tern,
      }
    ]

    // 替换的文件类型
    const fileExtensions = ['.js', '.css', '.html', '.json'];

    // 1. 移除对应平台的无用资源
    const shouldRemoveFolder = removeFolder[curType]
    shouldRemoveFolder.forEach(item => {
      const removePath = `Collection/${item}`;
      try {
        fs.rmSync(removePath, { recursive: true, force: true });
        colorLog(`已删除${removePath}目录 或 不存在`, 'yellow');
      } catch (err) {
        colorLog(`删除${removePath}目录失败: `, 'red')
        console.log(err);
      }
    })
    console.log()

    // 替换主体逻辑
    function replaceInFile(file, replaceArr, isIndex) {
      // 同步处理（用同步处理主要是为了知道什么时候执行完，按顺序打印处理步骤，最后删除脚本）
      try {
        let data = fs.readFileSync(file, 'utf8');
        let result = data;

        // 1. 仅对`Collection/index.html`文件：使用正则表达式移除<link>和</head>之间的内容
        if (isIndex) {
          const regex = /(<link[^>]*>)([\s\S]*?)(<\/head>)/;
          const matches = result.match(regex)
          if (matches && matches[2]) {
            colorLog('Replaced <script> in Collection/index.html, content is bellow: ', 'yellow')
            colorLog(matches[2], 'green')
            result = result.replace(regex, '$1$3');
          } else {
            colorLog('No match to the <script> in Collection/index.html', 'red')
          }
        }

        // 2. 针对全局html文件，移除monitor-sdk
        if (file.endsWith('.html')) {
          const sdkRegex = /<script>[^<>]*?monitor-sdk[^<>]*?<\/script>/g

          const sdkMatches = result.match(sdkRegex);
          if (sdkMatches) {
            result = result.replace(sdkRegex, '');
            colorLog(`Replaced monitor-sdk <script> in ${file}, content is bellow: `, 'yellow');
            console.log(sdkMatches)
          }

          // 移除masterapp-lever的特殊<script>
          if (file.includes('Collection\\masterapp-lever\\index.html')) {
            const regex = /(<script type="app-config">[^>]*<\/script>)([\s\S]*?)(<\/head>)/;
            const matches = result.match(regex);
            if (matches && matches[2]) {
              result = result.replace(regex, '$1$3');
              colorLog(`Replaced special script in ${file}, content is bellow: `, 'yellow');
              colorLog(matches[2], 'green')
            } else {
              colorLog(`No match to the <script> in ${file}:`, 'red');
            }
          }
        }

        // 3. 各文件需替换的内容
        const before_copy = result
        replaceArr.forEach((item) => {
          if (item.replace) {
            result = result.replaceAll(item.oldString, item.newString)
          }
        })
        if (result !== before_copy) {
          colorLog(`Replaced String-In-ReplaceArr in ${file}`, 'yellow');
        }

        if (result !== data) {
          fs.writeFileSync(file, result, 'utf8');
          console.log(`Write Replaced content in: ${file} success! \n`);
        }
      } catch (err) {
        console.error(`Error processing file ${file}: ${err}`);
      }
    }

    // 全局替换逻辑，遍历所有文件
    function walkDir(currentPath) {
      const files = fs.readdirSync(currentPath);
      for (let i in files) {
        const curFile = path.join(currentPath, files[i]);
        if (fs.statSync(curFile).isDirectory()) {
          walkDir(curFile);
        } else {
          const fileExt = path.extname(curFile).toLowerCase();
          if (fileExtensions.includes(fileExt)) {
            replaceInFile(curFile, globalReplace);
          }
        }
      }
    }

    // 3. 全局替换
    walkDir(targetFolder);
  } else {
    console.error('输入了无效的项目类型！');
  }

  // 关闭readline界面
  rl.close();

  // 删除当前脚本
  try {
    fs.unlinkSync(__filename);
    console.log('脚本已成功删除');
  } catch (err) {
    console.error(err);
  }
});

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
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  };
  const textColor = colors[color] || colors.white
  const reset = '\x1b[0m';

  console.log(textColor, message, reset);
}