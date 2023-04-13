angular.module('web')
  .controller('batchRestoreModalCtrl', ['$scope','$uibModalInstance','$translate','wos','item','currentInfo','callback','Toast','safeApply',
    function($scope, $modalInstance, $translate, wos, items, currentInfo, callback, Toast, safeApply) {
      var T = $translate.instant;
      angular.extend($scope, {
        currentInfo: currentInfo,
        items: items,
        info: {
            days: 1,
            msg: null
        },
        cancel: cancel,
        onSubmit: onSubmit
      });

      init();
      function init() {
        $scope.isLoading = true;
        for(let i in items){
          wos.getFileInfo(currentInfo.region, currentInfo.bucket, items[i].path).then(function(data){
            if(data.Restore){
              var info = parseRestoreInfo(data.Restore);
              if(info['ongoing-request'] == 'true') {
                $scope.info.type = 2;
              } else {
                $scope.info.type = 3;
                $scope.inf.expiry_date = info['expiry-date'];
              }
            } else {
              $scope.info.type = 1;
            }
            $scope.isLoading = false;
            safeApply($scope);
          });
        }
      };

      function parseRestoreInfo(s) {
          var arr = s.match(/([\w\-]+)=\"([^\"]+)\"/g);
          var m = {};
          angular.forEach(arr, function(n) {
            var kv = n.match(/([\w\-]+)=\"([^\"]+)\"/);
            m[kv[1]] = kv[2];
          });
          return m;
      };

      function cancel() {
        $modalInstance.dismiss('close');
      };

      function onSubmit(form1) {
        if(!form1.$valid)return;
        var days = $scope.info.days;
        Toast.info(T('restore.on'));//'提交中...'
        for(let i in items){
          wos.restoreFile(currentInfo.region, currentInfo.bucket, items[i].path, days).then(function() {
            callback();
            cancel();
          });
        }
        Toast.success(T('restore.success'));//'恢复请求已经提交'
      };
  }]);