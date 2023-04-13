'use strict';
var AWS = require('aws-sdk');
require('events').EventEmitter.prototype._maxListeners = 1000;
// var TIMEOUT = 30000; //30秒
var TIMEOUT = parseInt(localStorage.getItem('connectTimeout') || 60000); //30秒
console.log("TIMEOUT: " + TIMEOUT)


var UploadJob = require('./upload-job');
var DownloadJob = require('./download-job');

function getClient(opt) {
  AWS.config.update({accessKeyId: opt.accessKeyId, secretAccessKey: opt.secretAccessKey, endpoint:opt.endpoint, region:opt.region});
  var client = new AWS.S3({apiVersion: '2006-03-01',customUserAgent:'wos-browser-win32-x64-v1.0.0'});
  return client;
}
/**
 * wos
 *
 * @constructor wos
 *
 * @param config
 *    config.aliyunCredential
 *    config.stsToken
 *    config.endpoint
 */

function wos(config) {
  if (!config) {
    console.log('需要 config');
    return;
  }
  this._config = {};
  Object.assign(this._config, config);

  if (!this._config.aliyunCredential && !this._config.stsToken) {
    console.log('需要 stsToken');
    return;
  }

  if (!this._config.endpoint) {
    console.log('需要 endpoint');
    return;
  }


  if (this._config.stsToken) {
    this.wos = new getClient({
      accessKeyId: this._config.stsToken.Credentials.AccessKeyId,
      secretAccessKey: this._config.stsToken.Credentials.AccessKeySecret,
      securityToken: this._config.stsToken.Credentials.SecurityToken,
      endpoint: this._config.endpoint,
      apiVersion: '2013-10-15',
      maxRetries: 0,
      httpOptions: {
        timeout: TIMEOUT
      },
      cname: this._config.cname,
      isRequestPayer: localStorage.getItem("show-request-pay") === 'YES' ? true : false,
      region:this._config.region
    })
  }
  else {
    this.wos = new getClient({
      accessKeyId: this._config.aliyunCredential.accessKeyId,
      secretAccessKey: this._config.aliyunCredential.secretAccessKey,
      endpoint: this._config.endpoint,
      apiVersion: '2013-10-15',
      maxRetries: 0,
      httpOptions: {
        timeout: TIMEOUT
      },
      cname: this._config.cname,
      isRequestPayer: localStorage.getItem("show-request-pay") === 'YES' ? true : false,
      region:this._config.region
    });
  }

  var arr = this._config.endpoint.split('://');
  if (arr.length < 2) {
    console.log('endpoint 格式错误');
    return;
  }
  this._config.endpoint = {
    protocol: arr[0],
    host: arr[1]
  };
}

wos.prototype.setStsToken = function (stsToken) {
  this._config.stsToken = stsToken;

  this.wos = new getClient({
    accessKeyId: this._config.stsToken.Credentials.AccessKeyId,
    secretAccessKey: this._config.stsToken.Credentials.AccessKeySecret,
    securityToken: this._config.stsToken.Credentials.SecurityToken,
    endpoint: this._config.endpoint,
    apiVersion: '2013-10-15',
    maxRetries: 0,
    httpOptions: {
      timeout: TIMEOUT
    },
    cname: this._config.cname,
    isRequestPayer: localStorage.getItem("show-request-pay") === 'YES' ? true : false,
    region:this._config.region
  });
};


/**
 *
 * Usage:
 *
 *  new wos(cfg)
 *     .createUploadJob({from:'/home/a.jpg', to:'wos://a/b.jpg'})
 *
 * UploadJob class:

 class UploadJob{
    status: ''
    from: { name, size, path }
    to: { bucket, key }
    prog: {loaded, total}

 }

 *
 * @param options
 *    options.from  {object|string} local path, as object: {name:'a.jpg', path:'/home/admin/a.jpg'},  as string: '/home/admin/a.jpg'
 *    options.to    {object|string} wos path, as object: {bucket:'bucket',key:'pic/b.jpg'} as string: 'wos://bucket/pic/b.jpg'
 *
 *    options.checkPoints {object} saveCpt
 *    options.enableCrc64 {boolean}
 */
wos.prototype.createUploadJob = function createUploadJob(options) {

  var self = this;

  var job = new UploadJob(self.wos, options);

  //默认是 waiting 状态
  return job;
};


/**
 *
 * Usage:
 *
 *  new wos(cfg)
 *     .createDownloadJob({from:'/home/a.jpg', to:'wos://a/b.jpg'})
 *
 * DownloadJob class:

 class DownloadJob{
    status: ''
    from: { name, size, path }
    to: { bucket, key }
    prog: {loaded, total}

 }

 *
 * @param options
 *    options.from    {string} path string, under wos prefix, example: '/pic/b.jpg', it will be append to presetting wospath
 *                       as: 'wos://bucket/users/test_user/pic/b.jpg'
 *    options.to  {string} local path string,  example: '/home/admin/a.jpg'
 *
 *    options.checkpoint {object} saveCpt
 *    options.enableCrc64 {boolean}
 */
wos.prototype.createDownloadJob = function createDownloadJob(options) {

  var self = this;

  var job = new DownloadJob(self.wos, options);

  //默认是 waiting 状态

  return job;
};


module.exports = wos;
