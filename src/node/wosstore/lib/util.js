var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

var CRC64 = require('../../crc64/index.js');

// isLog==1 open else close
var isLog = localStorage.getItem('logFile') || 0;
var isLogInfo = localStorage.getItem('logFileInfo')|| 0;
//本地日志收集模块
var log = require('electron-log');

module.exports = {
  parseLocalPath: parseLocalPath,
  parseWosPath: parseWosPath,
  getFileCrc64: getFileCrc64,
  getBigFileMd5: getBigFileMd5,
  checkFileHash: checkFileHash,
  printPartTimeLine: printPartTimeLine,
  getRetryTimes: getRetryTimes
};

function printPartTimeLine(opt){
  var min=opt[1].start,max=opt[1].end;
  for(var k in opt){
    min = Math.min(opt[k].start, min);
    max = Math.max(opt[k].end, max)
  }
  //console.log(min, max)

  var total = max-min;
  var width = 600;

  var t=[];
  for(var k in opt){
    t.push({
      left: (opt[k].start - min)*600/total,
      width: (opt[k].end - opt[k].start)*600/total,
    });
  }

  //console.log(JSON.stringify(t, ' ',2));

  //var t2=[];
  for(var n of t){
    console.log('%c',`background:green;margin-left:${n.left}px;padding-left:${n.width}px;`)
    //t2.push(`<div style="height:6px;background:green;width:${n.width}px;margin-left:${n.left}px;clear:both;margin-top:1px;"></div>`)
  }
  console.log(t.length+' parts')
}


function checkFileHash(filePath, hashCrc64ecma,fileMd5, fn) {
  //console.log(filePath, ',,,,,,,,,,,,,,,,,')
  if(hashCrc64ecma){
      var startTime = new Date();
      console.time(`check crc64 ${filePath}`);
    getFileCrc64(filePath, function(err, crc64Str){
      var endTime = new Date();
      console.timeEnd(`check crc64 ${filePath}`);

      if(isLog == 1 && isLogInfo == 1) {
        log.transports.file.level = 'info';
        log.info(`check crc64 ${filePath}: ${endTime-startTime}ms`);
      }

      if (err) {
        if (isLog == 1) {
          log.error(`Checking file[ ${filePath} ] crc64 hash failed: ${err.message}`)
        }
        fn(new Error('Checking file['+filePath+'] crc64 hash failed: ' + err.message));
      } else if (crc64Str!=null && crc64Str != hashCrc64ecma) {

        if (isLog == 1) {
          log.error(`HashCrc64ecma mismatch, file[ ${filePath} ] crc64 hash should be: ${hashCrc64ecma} + but we got: ${crc64Str}`)
        }

        fn(new Error('HashCrc64ecma mismatch, file['+filePath+'] crc64 hash should be:'+hashCrc64ecma+', but we got:'+crc64Str));
      } else{

        if(isLog == 1 && isLogInfo == 1) {
          log.transports.file.level = 'info';
          log.info(`check crc success: file[${filePath}], ${crc64Str}`);
        }

        console.info('check crc success: file['+filePath+'],'+crc64Str)
        fn(null);
      }
    });
  }
  else if(fileMd5){

    //检验MD5
    getBigFileMd5(filePath, function (err, md5str) {
      if (err) {
        fn(new Error('Checking md5 failed: ' + err.message));
      } else if (md5str != fileMd5) {
        fn(new Error('ContentMD5 mismatch, file md5 should be:'+fileMd5+', but we got:'+md5str));
      } else{
        console.info('check md5 success: file['+filePath+'],'+md5str)
        fn(null);
      }
    });
  }
  else{
    //没有MD5，不校验
    console.log(filePath,',not found content md5, just pass');
    fn(null);
    return;
  }
}

function getBigFileMd5(p, fn){
  console.time('get md5 hash for ['+p+']');
   var md5sum = crypto.createHash('md5');
   var stream = fs.createReadStream(p);
   stream.on('data', function(chunk) {
       md5sum.update(chunk);
   });
   stream.on('end', function() {
     str = md5sum.digest('base64');
     console.timeEnd('get md5 hash for ['+p+']');
     fn(null, str);
   });
   stream.on('error', function(err) {
     fn(err);
   });
}

function getFileCrc64(p, fn){
  console.time('get crc64 hash for ['+p+']');
  var startTime = new Date()
  CRC64.crc64FileProcess(p, function(err, data){
    var endTime = new Date();
    console.timeEnd('get crc64 hash for ['+p+']');
    console.log(data);

    if(isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = 'info';
      log.info(`get crc64 hash for [ ${p} ]: ${endTime-startTime} ms`);
      log.info(data);
    }
    fn(err, data);
  });
};


function parseLocalPath(p) {
  if (typeof(p) != 'string') {
    return p;
  }
  return {name: path.basename(p), path: p};
}


function parseWosPath(wospath) {
  if (typeof(wospath) != 'string') {
    return wospath;
  }

  if (!wospath.startsWith('wos://')) {
    throw Error('Invalid wos path');
  }

  var a = wospath.substring('wos://'.length);
  var bucket = a.split('/', 1)[0];
  var key = a.substring(bucket.length + 1);
  return {
    bucket: bucket,
    key: key
  };
}

function getRetryTimes() {
  return localStorage.getItem('uploadAndDownloadRetryTimes') || 10
}
