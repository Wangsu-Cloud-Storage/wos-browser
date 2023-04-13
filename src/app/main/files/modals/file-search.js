'use strict';

angular.module('web')
  .controller('fileSearchCtrl', ['$scope','$rootScope', '$translate','$state','$uibModalInstance','Fav','Toast','wos','currentInfo', 'showFn',
  function($scope,$rootScope, $translate, $state, $modalInstance,Fav,Toast,wos,currentInfo, showFn){
    var T = $translate.instant;
    angular.extend($scope, {
        currentInfo: currentInfo,
        searchObjectName: '',
        items:[],
        lastItems:[],
        pageCount: 1000,
        isTruncated: false,
        marker: '',
        isEnd: false,
        isSearching: false,
      cancel: cancel,
        doFileSearch: doFileSearch,
        nextPage:nextPage,
        showPreview: showPreview,
        showFn: showFn,
    });

    function doFileSearch() {
        initInfo();
        if($scope.searchObjectName=='') {
            return;
        }
        $scope.isSearching=true;
        var info = angular.copy($scope.currentInfo);
        //info.key='';
        doNextPage(info);
    }

    function initInfo() {
        $scope.items=[];
        $scope.lastItems=[];
        $scope.isTruncated=false;
        $scope.marker='';
        $scope.isEnd =false;
    }

    function nextPage() {
        if($scope.searchObjectName=='') {
            return;
        }

        if($scope.isEnd == true){
            return;
        }

        $scope.isSearching=true;

        var info = angular.copy($scope.currentInfo);
        //info.key='';
        doNextPage(info);
    }


    async function doNextPage(info) {
        var currentCount=0;
        do {
            await wos.listFilesRegex(info.region, info.bucket, info.key, $scope.marker || '').then(function (result) {
                var arr = result.data;
                $scope.marker = result.marker;
                $scope.isTruncated = result.isTruncated;
                if ($scope.isTruncated ==false) {
                    $scope.isEnd=true;
                }

                for (var j=0;j<$scope.lastItems.length;j++) {
                    currentCount++;
                    $scope.items.push($scope.lastItems[j]);
                }
                $scope.lastItems=[];

                for (var i=0;i<arr.length;i++) {
                    var len=arr[i].path.length;
                    if (arr[i].path.substring(info.key.length,len).includes($scope.searchObjectName)==true) {
                        currentCount++;
                        if (currentCount <=$scope.pageCount) {
                            $scope.items.push(arr[i]);
                        } else {
                            $scope.lastItems.push(arr[i]);
                        }
                    }
                }
            }, function (err) {
                console.log(err);
            });
        } while ($scope.isTruncated==true && currentCount <$scope.pageCount);
        $scope.isSearching=false;
    }

    function cancel(){
      $modalInstance.dismiss('close');
    }

    function showPreview(item, type) {
      showFn.showPreview(item, type);
    }


  }])
;
