// isLog==1 open else close
var isLog = localStorage.getItem('logFile') || 0;
var isLogInfo = localStorage.getItem('logFileInfo')|| 0;
//本地日志收集模块
var log = require('electron-log');

angular.module('web')
  .controller('deleteFilesModalCtrl', ['$scope','$q','$uibModalInstance','$timeout','items','currentInfo','callback','wos','safeApply',
    function ($scope, $q, $modalInstance, $timeout, items, currentInfo, callback, wos,safeApply) {

      var l = "";
      for (var i = 0; i<items.length;i++) {
        l = l+items[i].path
        if(i!=items.length-1){
          l = l +","
        }
      }


      angular.extend($scope, {
        items: items,

        currentInfo:currentInfo,
        step : 1,
        start: start,
        stop: stop,
        close: close
      });

      function stop() {
        //$modalInstance.dismiss('cancel');
        $scope.isStop=true;
        if(isLog == 1 && isLogInfo == 1) {
          log.transports.file.level = 'info';
          log.info(`----stop remove ` + l);
        }
        wos.stopDeleteFiles();
      }
      function close(){
        $modalInstance.dismiss('cancel');
      }

      function start(){
        $scope.isStop=false;
        $scope.step = 2;
        if(isLog == 1 && isLogInfo == 1) {
          log.transports.file.level = 'info';
          log.info(`[${currentInfo.bucket}] ----start remove  ${l} ` );
        }
        wos.deleteFiles(currentInfo.region, currentInfo.bucket, items, function(prog){
          //进度
          $scope.progress = angular.copy(prog);
          safeApply($scope);
        }).then(function(terr){
          //结果
          $scope.step = 3;
          $scope.terr = terr;
          callback();
          if(isLog == 1 && isLogInfo == 1) {
            log.transports.file.level = 'info';
            log.info(`[${currentInfo.bucket}] ----remove ${l} succeeded!` );
          }
        });
      }


    }])
;
