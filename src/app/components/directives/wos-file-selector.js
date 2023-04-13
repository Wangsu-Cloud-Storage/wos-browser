/**
angular.extend($scope, {
  wosFsConfig: {
    id: '',
    secret: '',
    region: '',
    bucket: '',
    key: ''
  },
  selectedItem: {
    wosPath:'',
    region: ''
  }
});

<div wos-file-selector config="wosFsConfig"
    selected-path="selectedItem" height="220"
    show-buckets="false" folder-only="true"></div>
*/

angular.module('web')
.directive('wosFileSelector', ['$timeout', 'wos',function($timeout, wos){

   return {
     restrict: 'EA',
     transclude: false,
     scope: {
       config: '=',        // {region, bucket, key, id, secret}
       selectedItem: '=',  // {region, wosPath}
       showBuckets: '=',   // true
       folderOnly: '=',    // true
       height: '='        // 200
     },
     templateUrl: 'components/directives/wos-file-selector.html',
     controller: ['$scope', ctrl]
   };

   function ctrl($scope){
     var client;

     if(!$scope.height) $scope.height=200;
     if($scope.showBuckets==null) $scope.showBuckets=true;
     if($scope.folderOnly==null) $scope.folderOnly=true;

     $scope.keepConfig = angular.copy($scope.config);

     refresh();

     function refresh(){

       var v = $scope.keepConfig;
       if(!v.bucket){
         //if(!$scope.ngModel)$scope.ngModel={};
         $scope.selectedItem.wosPath = 'wos://';
         $scope.selectedItem.region = '';
         $scope.isLoading=true;
         wos.listAllBuckets().then(function(arr){
            $scope.items = arr;
            $scope.isLoading=false;
         });
       }
       else{
         if(!v.key) $scope.selectedItem.wosPath = 'wos://'+ v.bucket+"/";
         else $scope.selectedItem.wosPath = 'wos://'+ v.bucket+"/"+ v.key;

         $scope.selectedItem.region = v.region;

         if(v.key.lastIndexOf('/')==v.key.length-1){
           //isFolder
           $scope.isLoading=true;
           wos.listAllFiles(v.region, v.bucket, v.key,  $scope.folderOnly).then(function(arr){
             $scope.items = arr;
             $scope.isLoading=false;
           });
         }
       }
     }

     $scope.$watch('keepConfig', function(v){
       refresh();
     });

     $scope.select = function (item){

       if(item.isBucket){
         $scope.selectedItem.wosPath = "wos://"+item.name;
       }
       else if(item.isFolder){
         $scope.selectedItem.wosPath = "wos://"+ $scope.keepConfig.bucket+"/"+item.path.replace(/\/$/,'')+'/';
       }else{
         $scope.selectedItem.wosPath = "wos://"+ $scope.keepConfig.bucket+"/"+item.path.replace(/\/$/,'');
       }
     };

     $scope.goIn = function(item){
        if(item.isBucket){
          $scope.keepConfig.region = item.region;
          $scope.keepConfig.key = '';
          $scope.keepConfig.bucket = item.name;
        }
        else{
          if(item.isFolder){
            $scope.keepConfig.key = item.path.replace(/\/$/,'')+'/';

          }else{
            $scope.keepConfig.key = item.path.replace(/\/$/,'');
          }
        }
        refresh();

     };

     $scope.goUp = function(){
        var v= $scope.selectedItem.wosPath;
        if(v=='wos://'){
          return;
        }
        var info = wos.parseWOSPath(v);

        if(info.key==''){
          if(!$scope.showBuckets){
            return;
          }
          $scope.keepConfig.bucket = '';
          $scope.keepConfig.key = '';
          refresh();
          return;
        }

        var key = info.key.replace(/\/$/,'');
        $scope.keepConfig.key = key.substring(0, key.lastIndexOf('/'));
        if($scope.keepConfig.key!=''){
          $scope.keepConfig.key+='/';
        }
        refresh();
     };
   }


}])
;
