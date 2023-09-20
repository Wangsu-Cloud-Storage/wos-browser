// isLog==1 open else close
var isLog = localStorage.getItem('logFile') || 0;
var isLogInfo = localStorage.getItem('logFileInfo')|| 0;
//本地日志收集模块
var log = require('electron-log');

angular.module('web')
  .controller('addFolderModalCtrl', ['$scope','$uibModalInstance','currentInfo', 'callback','wos',
    function ($scope, $modalInstance, currentInfo, callback,wos) {


      angular.extend($scope, {
        currentInfo: currentInfo,
        item: {},
        cancel: cancel,
        onSubmit: onSubmit,
        reg: {
          folderName: /^[^\/]+$/
        }
      });

      function cancel() {
        $modalInstance.dismiss('close');
      }

      function onSubmit(form) {
        if (!form.$valid)return;

        var folderName = $scope.item.name;

        wos.createFolder(currentInfo.region, currentInfo.bucket, currentInfo.key+folderName+'/').then(function(){
          callback();
          cancel();
          if(isLog == 1 && isLogInfo == 1) {
            log.transports.file.level = 'info';
            log.info(`create catalog [${currentInfo.key+folderName}] succeeded!`);
          }
        });

      }
    }])
;
