angular.module('web')
  .factory('Auth', ['$q','$rootScope', '$location','$translate', 'wos', 'AuthInfo', 'Const', 'Cipher',
    function($q, $rootScope, $location, $translate, wos, AuthInfo, Const, Cipher) {
      var T = $translate.instant;
      return {
        login: login,
        logout: logout
      };

      function login(data) {
        // if(!data.wospath)delete data.region;
      console.log("123213213213")
        var df = $q.defer();
        data.httpOptions={timeout:15000};

        if(data.id.indexOf('STS.')!=0){
          delete data.stoken;
        }


        // $rootScope.internalSupported = data.eptpl ? data.eptpl.indexOf('-internal')!=-1 : false;

        if (data.wospath) {

          var info = wos.parseWOSPath(data.wospath);
          data.bucket = info.bucket;
          wos.getClient(data).listObjects({Bucket: info.bucket, Prefix: info.key, Marker:'',MaxKeys:1, Delimiter:'/'}, function(err, result){

            if(err){
              df.reject(err);
            }
            // else if(result.RequestId && result.CommonPrefixes){
            else if(result.CommonPrefixes){
              //登录成功
              AuthInfo.save(data);
              df.resolve();
            }
            else{
              df.reject({code:'Error',message:T('login.endpoint.error')}); //'请确定Endpoint是否正确'
            }
          });

        } else {
          data.bucket = undefined;
          wos.getClient(data).listBuckets( function(err, result) {

            if(err){
              if (err.code == 'AccessDeniedError') {
                //登录成功
                AuthInfo.save(data);
                df.resolve();
              } else {
                //失败
                df.reject(err);
              }
            }
            // else if(result.RequestId && result.Buckets){
            else if(result.Buckets){
              //登录成功
              AuthInfo.save(data);
              df.resolve();
            }else{
              df.reject({code:'Error',message:T('login.endpoint.error')});
            }
          });
        }
        return df.promise;
      }

      function logout() {
        var df = $q.defer();
        AuthInfo.remove();
        df.resolve();
        return df.promise;
      }

    }
  ]);