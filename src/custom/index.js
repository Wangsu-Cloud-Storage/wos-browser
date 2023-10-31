const path = require('path');

module.exports= {
  //窗体title
  title: 'WOS Browser',

  //app id，打包名称前缀
  appId: 'wos-browser',

  //app名称，需要提供各个语言版本
  appName: {
    'zh-CN':'WOS浏览器',
    'en-US': 'WOS Browser',
  },

  //logo png 格式, 主要用于mac和linux系统
  logo_png: path.join(__dirname, './icon.png'),

  //logo icns 格式，主要用于mac系统
  logo_ico: path.join(__dirname, './icon.icns'),

  //logo ico 格式，主要用于windows系统
  logo_ico: path.join(__dirname, './icon.ico'),

    version: '1.1.6',

  //“关于”弹窗的主要内容
  //about_html: '<div>开源地址:</div>',

};
