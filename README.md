# wos-browser

#### 概览
1、wos-browser提供界面化的云存储文件管理功能。支持文件和文件夹的上传、删除等操作。

#### 准备工作
1、开通云存储帐号、创建空间（工具暂不支持创建空间）。

#### 使用说明
### 安装&登录
1、下载工具
* [windows-x64](https://s3-cn-east-5.wcsapi.com/doc-pics/tool/wos-browser-1.1.5-win32-x64.zip)
* [mac-x64](https://s3-cn-east-5.wcsapi.com/doc-pics/tool/wos-browser-1.1.2-darwin-x64.zip)
* [linux-x64](https://s3-cn-east-5.wcsapi.com/doc-pics/tool/wos-browser-1.1.2-linux-x64.zip)

2、解压zip后，进入目录，执行wos-browser.exe即可使用
![](https://s3-cn-east-5.wcsapi.com/doc-pics/guide-wos-browser-pics/1.png)  

3、填写登录信息

*注：endpoint、regionName信息可到网宿对象存储控制台空间概览中获取*

![](https://s3-cn-east-5.wcsapi.com/doc-pics/guide-wos-browser-pics/22.png)  

4、登录成功后，从展示的空间列表中选择需要管理的空间
![](https://s3-cn-east-5.wcsapi.com/doc-pics/guide-wos-browser-pics/3.png)  


### 文件管理
1、支持文件或文件夹的上传（支持直接拖拽上传）。

2、支持文件移动、重命名、复制、删除、获取地址和下载（支持多选批量操作）。

3、支持文件夹的移动、重命名、删除、复制操作。
注：Mac版本没有上传目录按钮，选择目录即可上传整个目录的文件
![](https://s3-cn-east-5.wcsapi.com/doc-pics/guide-wos-browser-pics/4.png)  

4、文件搜索，支持模糊搜索空间内文件名匹配指定内容的文件

### 日志
1、可在设置中设置开启日志文件存储到本地系统，以及开启info级别日志。

2、开启后日志默认存储在`C:\Users\xxx\AppData\Roaming\wos-browser\log.log`下。

### 版本变更记录
|  版本   | 变更内容  |
|  ----  | ----  |
| 1.1.5 | 1、支持自定义DNS-style <br>2、支持“最后修改时间”排序|
| 1.1.3 | 完善info操作日志|
| 1.1.2 | 资源搜索结果支持预览|
| 1.1.1 | 资源搜索功能调整为只在当前目录下搜索，根目录搜索等同于全局搜索|
| 1.1.0 | 新增资源全局搜索功能|
| 1.0.0 | 初始版本|

### 关于源码
如果您要基源码开发，请按照以下步骤进行。

(1) 安装 node.js 最新版本
```
官网: https://nodejs.org/
```

(2) 安装 cnpm
```
官网: https://cnpmjs.org/
cnpm 是 npm（node 包管理工具）的中国镜像，可以提高下载依赖包的效率。
```

(3) 如果使用 windows 系统，需要安装下列软件：
* 需要安装 windows-build-tools:
```
cnpm i -g windows-build-tools
```
* 还需要下载 make.exe，放到 C:\windows\ 目录下

[make.exe（64位）](https://s3-cn-east-5.wcsapi.com/doc-pics/tool/make-x64.zip)

[make.exe（32位）](https://s3-cn-east-5.wcsapi.com/doc-pics/tool/make-x32.zip)

(4) 下载代码并且安装依赖:
```
make i
```
(5) 运行
```
make run  # 开发模式运行, command+option+i 可用打开调试界面, win或linux按 F12.
开发模式下，会自动监听源码,如有修改,会自动 build 前端代码到 dist 目录。
```

(6) 打包
```
make build  # build前端代码到dist目录
make win64  # 打包win64程序， 可选: mac, linux64,linux32,win32,win64,all.
```
