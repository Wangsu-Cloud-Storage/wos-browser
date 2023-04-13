// isLog==1 open else close
var isLog = localStorage.getItem('logFile') || 0;
var isLogInfo = localStorage.getItem('logFileInfo')|| 0;
//本地日志收集模块
var log = require('electron-log');

angular.module('web')
  .controller('moveModalCtrl', ['$scope','$uibModalInstance','$timeout','items','isCopy','renamePath','fromInfo','moveTo', 'callback','wos','Toast','AuthInfo','safeApply',
    function ($scope, $modalInstance, $timeout, items, isCopy, renamePath, fromInfo, moveTo, callback, wos, Toast,AuthInfo, safeApply) {

      var authInfo = AuthInfo.get();


      var l = "";
      for (var i = 0; i<items.length;i++) {
        l = l+items[i].path
        if(i!=items.length-1){
          l = l +","
        }
      }


      angular.extend($scope, {
        renamePath: renamePath,
        fromInfo: fromInfo,
        items: items,
        isCopy: isCopy,
        step : 2,

        cancel: cancel,
        start: start,
        stop: stop,


        // reg: {
        //   folderName: /^[^\/]+$/
        // },
        // wosFsConfig: {
        //   id: authInfo.id,
        //   secret: authInfo.secret,
        //   region: currentInfo.region,
        //   bucket: currentInfo.bucket,
        //   key: currentInfo.key
        // },
        moveTo: {
          region: moveTo.region,
          bucket: moveTo.bucket,
          key: moveTo.key,
        },
        canMove: false
      });

      //$scope.originPath = 'wos://'+currentInfo.bucket+'/'+currentInfo.key;
      start();

      function stop() {
        //$modalInstance.dismiss('cancel');
        $scope.isStop=true;
        if(isLog == 1 && isLogInfo == 1) {
          log.transports.file.level = 'info';
          log.info(`----stop move ` + l);
        }
        wos.stopCopyFiles();
      }

      function cancel(){
        $modalInstance.dismiss('cancel');
      }

      function start() {
        $scope.isStop=false;
        $scope.step = 2;
        var target = angular.copy($scope.moveTo);
        var items = angular.copy($scope.items);

        if(isLog == 1 && isLogInfo == 1) {
          log.transports.file.level = 'info';
          log.info(`[${fromInfo.bucket}] ----start move ` + l +",to target:" + target.key);
        }



        angular.forEach(items, function(n){
          //n.region = currentInfo.region;
          n.bucket = fromInfo.bucket;
        });

        //console.log(fromInfo.region, items, target, renamePath);

        //复制 or 移动
        wos.copyFiles(fromInfo.region, items, target, function progress(prog){
          //进度
          $scope.progress = angular.copy(prog);

          safeApply($scope);
        }, !isCopy, renamePath).then(function(terr){
          //结果
          $scope.step = 3;
          $scope.terr = terr;
          callback();
        });
        if(isLog == 1 && isLogInfo == 1) {
          log.transports.file.level = 'info';
          log.info(`[${fromInfo.bucket}] ----move ` + l +",to target:" + target.key +"succeeded");
        }
      }
    }])
;
