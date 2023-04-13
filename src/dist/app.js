'use strict';

angular.module('web', ['ui.router', 'ui.bootstrap', 'ui.codemirror', 'pascalprecht.translate', 'ngSanitize', 'templates', 'ui.bootstrap.contextMenu']).config(['$stateProvider', '$urlRouterProvider', '$translateProvider', function ($stateProvider, $urlRouterProvider, $translateProvider) {

  moment.locale('zh-CN');

  $stateProvider.state('files', {
    url: '/',
    templateUrl: 'main/files/files.html',
    controller: 'filesCtrl'
  }).state('login', {
    url: '/login',
    templateUrl: 'main/auth/login.html',
    controller: 'loginCtrl'
  });

  $urlRouterProvider.otherwise('/');

  //i18n
  for (var k in Global.i18n) {
    $translateProvider.translations(k, Global.i18n[k].content);
  }
  $translateProvider.preferredLanguage('zh-CN');

  $translateProvider.useSanitizeValueStrategy('escapeParameters');
}]).run(['$rootScope', '$translate', 'Toast', function ($rootScope, $translate, Toast) {
  $rootScope.openURL = function (url) {
    openExternal(url);
  };

  // //i18n
  var langMap = {};
  var langList = [];
  angular.forEach(Global.i18n, function (v, k) {
    if (k != 'ja-JP') {
      // 日语先注释
      langMap[k] = v;
      langList.push({
        lang: k,
        label: v.label
      });
    }
  });
  var lang = localStorage.getItem('lang') || langList[0].lang;

  $rootScope.langSettings = {
    langList: langList,
    lang: lang,
    changeLanguage: function (key) {
      console.log('changeLanguage:', key);
      key = langMap[key] ? key : langList[0].lang;
      $translate.use(key);
      localStorage.setItem('lang', key);
      $rootScope.langSettings.lang = key;
      Toast.success($translate.instant('setup.success')); //'已经设置成功'
    }
  };
  $translate.use(lang);

  console.log('ready');
}]);
'use strict';

angular.module('web').factory('Const', [function () {

  function getStorageClasses(f) {
    var storageClasses = [{
      value: 'Standard',
      name: '标准类型'
    }, //标准类型
    {
      value: 'IA',
      name: '低频访问类型' //低频访问类型
    }];
    switch (f) {
      case 3:
        return storageClasses.concat([{
          value: 'Archive',
          name: '归档类型'
        }]); //归档类型
      case 2:
        return storageClasses;
      default:
        return [{
          value: 'Standard',
          name: '标准类型'
        }]; //标准类型
    }
  }

  return {
    AUTH_INFO_KEY: 'auth-info',
    AUTH_HIS: 'auth-his',
    AUTH_KEEP: 'auth-keep',
    KEY_REMEMBER: 'auth-remember',
    SHOW_HIS: 'show-his',
    SHOW_REQUEST_PAY: 'show-request-pay',

    IMM_DOC_PREVIEW_LINK: 'https://help.aliyun.com',
    IMM_DOC_TYPES: [
    //演示文件：
    // 'pptx','ppt','pot','potx','pps','ppsx','dps','dpt','pptm','potm','ppsm',
    // //表格文件：
    // 'xls','xlt','et','ett','xlsx','xltx','csv','xlsb','xlsm','xltm',
    // //文字文件：
    // 'doc','dot','wps','wpt','docx','dotx','docm','dotm',
    //其他格式文件： 
    'pdf'],

    REG: {
      EMAIL: /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
    },

    bucketACL: [{
      acl: 'private',
      label: '私有'
    }, //私有
    {
      acl: 'public-read',
      label: '公共读'
    }, //公共读
    {
      acl: 'public-read-write',
      label: '公共读写'
    }],

    //https://help.aliyun.com/document_detail/31837.html
    regions: [],

    countryNum: [{
      "label": "中国大陆(+86)",
      "value": "86"
    }, {
      "label": "香港(+852)",
      "value": "852"
    }, {
      "label": "澳门(+853)",
      "value": "853"
    }, {
      "label": "台湾(+886)",
      "value": "886"
    }, {
      "label": "韩国(+82)",
      "value": "82"
    }, {
      "label": "日本(+81)",
      "value": "81"
    }, {
      "label": "美国(+1)",
      "value": "1"
    }, {
      "label": "加拿大(+1)",
      "value": "1"
    }, {
      "label": "英国(+44)",
      "value": "44"
    }, {
      "label": "澳大利亚(+61)",
      "value": "61"
    }, {
      "label": "新加坡(+65)",
      "value": "65"
    }, {
      "label": "马来西亚(+60)",
      "value": "60"
    }, {
      "label": "泰国(+66)",
      "value": "66"
    }, {
      "label": "越南(+84)",
      "value": "84"
    }, {
      "label": "菲律宾(+63)",
      "value": "63"
    }, {
      "label": "印度尼西亚(+62)",
      "value": "62"
    }, {
      "label": "德国(+49)",
      "value": "49"
    }, {
      "label": "意大利(+39)",
      "value": "39"
    }, {
      "label": "法国(+33)",
      "value": "33"
    }, {
      "label": "俄罗斯(+7)",
      "value": "7"
    }, {
      "label": "新西兰(+64)",
      "value": "64"
    }, {
      "label": "荷兰(+31)",
      "value": "31"
    }, {
      "label": "瑞典(+46)",
      "value": "46"
    }, {
      "label": "乌克兰(+380)",
      "value": "380"
    }]
  };
}]);
'use strict';

angular.module('web').controller('mainCtrl', ['$scope', '$rootScope', '$timeout', '$state', '$q', 'Const', 'AuthInfo', 'autoUpgradeSvs', function ($scope, $rootScope, $timeout, $state, $q, Const, AuthInfo, autoUpgradeSvs) {

      angular.extend($scope, {
            upgradeInfo: {
                  files: false,
                  currentVersion: Global.app.version,
                  isLastVersion: true
            }
      });

      //注释掉自动更新
      /*$timeout(function(){
        autoUpgradeSvs.load(function(info){
           angular.extend($scope.upgradeInfo, info)
        })
      },2000)*/

      // $rootScope.internalSupported = false;

      $scope.$on('$stateChangeSuccess', function () {
            var name = $state.current.name;
            if (name != 'login') {
                  // $rootScope.internalSupported = (AuthInfo.get().eptpl||'').indexOf('-internal')!=-1;
            }
      });

      //
      // function init(){
      //   var df = $q.defer();
      //   $.ajax({url:'http://'+(region||'wos-cn-beijing')+'-internal.aliyuncs.com',timeout:2000,error:function(xhr){
      //     isInit=true;
      //     if(xhr.status==403){
      //       $rootScope.internalSupported  = true;
      //     }
      //     df.resolve();
      //   }});
      //   return df.promise;
      // }
}]);
'use strict';

angular.module('web').directive('autoHeight', ['$timeout', function ($timeout) {

  return {
    link: linkFn,
    restrict: 'EA',
    transclude: false,
    scope: {
      autoHeight: '='
      //bottomLoader: '&'
    }
  };

  function linkFn(scope, ele, attr) {

    var h = parseInt(scope.autoHeight);

    ele.css({
      //'border-bottom': '1px solid #ccc',
      'overflow': 'auto',
      'position': 'relative'
    });

    var tid;

    function resize() {
      $timeout.cancel(tid);
      tid = $timeout(function () {
        var v = $(window).height() + h;
        $(ele).height(v);
      }, 300);
    }

    $(window).resize(resize);
    resize();

    // //////////////////////////////
    // if (scope.bottomLoader) {
    //
    //   var tid2;
    //   function onScroll() {
    //      $timeout.cancel(tid2);
    //      tid2 = $timeout(function () {
    //
    //         if($(ele)[0].scrollHeight>0
    //         && ($(ele).parent().height() +  $(ele).scrollTop() +10 >= $(ele)[0].scrollHeight) ){
    //           scope.bottomLoader();
    //         }
    //      },500);
    //   }
    //
    //   $(window).resize(onScroll);
    //   $(ele).scroll(onScroll);
    // }
  }
}]);
'use strict';

angular.module('web').directive('bottomLoader', ['$timeout', function ($timeout) {

  return {
    link: linkFn,
    restrict: 'EA',
    transclude: false,
    scope: {
      bottomLoader: '&'
    }
  };

  function linkFn(scope, ele, attr) {
    ele.css({
      //'border-bottom': '1px solid red',
      'overflow': 'auto',
      'position': 'relative'
    });
    var tid2;
    function onScroll() {
      $timeout.cancel(tid2);
      tid2 = $timeout(function () {

        if ($(ele)[0].scrollHeight > 0 && $(ele).parent().height() + $(ele).scrollTop() + 10 >= $(ele)[0].scrollHeight) {
          scope.bottomLoader();
        }
      }, 500);
    }
    onScroll();
    $(window).resize(onScroll);
    $(ele).scroll(onScroll);
  }
}]);
'use strict';

/*
 <input type="text" ng-model="abc" cleanable-input x="-3" y="-5"/>
 */

angular.module('web').directive('cleanableInput', ['$timeout', function ($timeout) {

  return {
    restrict: 'EA',
    require: 'ngModel',

    scope: {
      model: '=ngModel',
      ngChange: '&',
      x: '=',
      y: '='
    },
    link: function link(scope, element) {

      var id = 'cleanable_inp-' + (Math.random() + '').substring(2);

      element.wrap('<div id="' + id + '" style="position:relative;width:100%;"></div>');
      var btn = $('<a href="" style="font-size:14px;color:#999">' + '<i class="glyphicon glyphicon-remove-circle"></i></a>').appendTo($('#' + id));

      btn.css({
        display: 'none',
        position: 'absolute',
        'z-index': 10
      }).click(function (e) {

        scope.model = '';
        if (!scope.$root.$$phase) {
          scope.$apply();
        }

        if (scope.ngChange) {
          scope.$eval(scope.ngChange);
        }

        return false;
      });

      var y = isNaN(scope.y) ? 0 : parseInt(scope.y);
      var x = isNaN(scope.x) ? 0 : parseInt(scope.x);

      function onchange(v) {
        if (v && v !== '') {

          btn.css({
            'top': 6 + y,
            'right': 6 - x
          }).show();
        } else {
          btn.hide();
        }
      }

      // Listen for any changes to the original model.
      var tid;
      scope.$watch('model', function alteredValues(newValue, oldValue) {
        $timeout.cancel(tid);
        tid = $timeout(function () {
          onchange(newValue);
        }, 300);
      }, true);
    }

  };
}]);
'use strict';

/*
 <input type="text" ng-model="abc" cleanable-input x="-3" y="-5"/>
 */

angular.module('web').directive('clipboardButton', ['$translate', 'Toast', function ($translate, Toast) {
  var T = $translate.instant;
  return {
    restrict: 'EA',
    scope: {
      action: '=',
      target: '=',
      success: '&'
    },
    link: function link(scope, ele) {

      var d = new Clipboard(ele[0], {
        text: function () {
          return $(scope.target).val();
        },
        action: scope.action || 'copy'
      });

      d.on('success', function () {
        Toast.success(T('copy.successfully')); //'复制成功'
      });
    }

  };
}]);
'use strict';

angular.module('web').directive('dropZone', function () {

  return {
    link: linkFn,
    restrict: 'EA',
    transclude: false,
    scope: {
      dropZone: '='
    }
  };

  function linkFn(scope, ele, attr) {

    $(document).on('dragenter', stopPrev);
    $(document).on('dragover', stopPrev);
    $(document).on('dragleave', stopPrev);
    $(document).on('drop', stopPrev);
    function stopPrev(e) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }

    var shadow;
    $(ele).on('dragenter', function () {
      shadow = $('<div></div>').css({
        position: 'absolute',
        height: $(ele).height(),
        width: $(ele).width(),
        opacity: 0.5,
        top: $(ele).offset().top,
        left: $(ele).offset().left,
        background: 'yellow',
        zIndex: 20,
        boxShadow: 'inset yellow 0 0 10px'
      }).appendTo('body');

      shadow.on('dragleave', function () {
        shadow.remove();
      }).on('drop', function (e) {
        shadow.remove();
        scope.dropZone(e);
      });
    });
  }
});
'use strict';

angular.module('web').directive('fileDialogButton', function () {

  return {
    link: linkFn,
    restrict: 'EA',
    transclude: false,
    scope: {
      fileChange: '='
    }
  };

  function linkFn(scope, ele, attr) {
    $(ele).on('change', function (e) {
      scope.fileChange.call({}, e.target.files);
    });
  }
});
'use strict';

angular.module('web').directive('flvPlayer', ['$timeout', function ($timeout) {

  return {
    link: linkFn,
    restrict: 'EA',
    transclude: false,
    scope: {
      src: '=',
      autoplay: '=' //autoplay
    }
  };

  function linkFn(scope, ele, attr) {
    scope.$watch('src', init);

    function init() {
      if (!scope.src) return;
      var src = 'http://localhost:' + Global.staticServerPort + '/flv-player.html?src=' + encodeURIComponent(scope.src) + '&autoplay=' + (scope.autoplay || '');
      ele.html('<iframe scrolling="no" style="border:0;width:100%;height:460px" src="' + src + '"><iframe>');
    }
  }
}]);
'use strict';

angular.module('web').directive('isLoading', function () {

  return {
    templateUrl: 'components/directives/is-loading.html'
  };
});
'use strict';

angular.module('web').directive('longScrollList', ['$timeout', function ($timeout) {

  return {
    restrict: 'EA',
    transclude: true,
    scope: {
      loadMoreFn: '=loadMore',
      triggerSize: '='
    },
    template: '<div ng-transclude></div>',

    link: function (scope, ele, attr) {
      var t = ele.offset().top;
      var h = $(ele).height();

      var SIZE = scope.triggerSize || 20;

      $(ele).scroll(onScroll);
      //effect();

      var tid;
      function onScroll() {
        $timeout.cancel(tid);
        tid = $timeout(function () {
          effect();
        }, 200);
      }

      function effect() {
        var scrollTop = $(ele).scrollTop();
        var scrollHeight = $(ele)[0].scrollHeight;

        if (scrollTop + h > scrollHeight - SIZE) {
          if (typeof scope.loadMoreFn == 'function') scope.loadMoreFn();
        }

        // var arr = $($(ele).find('li.list-group-item'));
        // if(arr.length<SIZE){
        //   $($(ele).find('li.list-group-item')).removeClass('invisible');
        // }
        // else{
        //   arr.each(function(){
        //     var iTop = $(this).offset().top - t;
        //     //console.log(iTop, h, t)
        //     if(iTop < -350 || iTop > h + 350){
        //       $(this).addClass('invisible');
        //     }else{
        //       $(this).removeClass('invisible');
        //     }
        //   });
        // }
      }
    }
  };
}]);
'use strict';

angular.module('web').directive('myTimer', ['$timeout', 'utilSvs', function ($timeout, utilSvs) {

  return {
    link: linkFn,
    restrict: 'EA',
    transclude: false,
    scope: {
      expiration: '='
    }
  };

  function linkFn(scope, ele, attr) {

    _dig();

    function _dig() {
      go();
      $timeout(_dig, 1000);
    }

    function go() {
      var s = Date.parse(scope.expiration) - Date.now();
      ele.html(utilSvs.leftTime(s));
    }
  }
}]);
'use strict';

angular.module('web').directive('noData', function () {

  return {
    templateUrl: 'components/directives/no-data.html'
  };
});
'use strict';

angular.module('web').directive('qrcode', ['$timeout', function ($timeout) {

  return {
    link: linkFn,
    restrict: 'EA',
    transclude: true,
    template: '<div class="qrcode"><div></div></div><ng-transclude></ng-transclude>',
    scope: {
      text: '=',
      width: '=',
      height: '=',
      label: '='
    }
  };

  function linkFn(scope, ele, attr) {

    scope.$watch('text', function (v) {
      reset(v);
    });

    function reset(v) {
      var w = scope.width || scope.height || 100;
      var h = scope.height || scope.width || 100;
      $(ele).find('.qrcode').html('<div></div>');
      if (v) $($(ele).find('.qrcode>div')).qrcode({
        text: v || '',
        width: w,
        height: h
      });
    }
  }
}]);
'use strict';

/*
usage:

step 1. add element to body:
  <toast-list></toast-list>

step 2: use Toast factory
  Toast.info('test');
*/

angular.module('web').directive('toastList', function () {

  return {
    //link: linkFn,
    restrict: 'EA',
    template: '<div class="toast-list" style="position: fixed; bottom: 0px;left: 10px;right: 70%;z-index:10000;">' + '<div ng-repeat="alert in alerts" style="padding:4px;margin-bottom:10px;" class="break alert alert-{{alert.type}}">{{alert.msg}}</div>' + '</div>',
    controller: ['$scope', '$timeout', '$location', function ($scope, $timeout, $location) {

      $scope.alerts = [];

      // $scope.closeAlert = function(index){
      //   $scope.alerts.splice(index, 1);
      // };

      $scope.$on('message', function (evt, data) {
        showMessage(data.message, data.type || 'danger', data.ttl || 3000);
      });

      function showMessage(msg, type, ttl) {
        var obj = { type: type || 'danger', msg: msg || '', id: Math.random() };

        //next tick
        $timeout(function () {
          $scope.alerts.push(obj);
          $timeout(function () {
            for (var i = 0; i < $scope.alerts.length; i++) {
              if ($scope.alerts[i] == obj) {
                $scope.alerts.splice(i, 1);
                break;
              }
            }
          }, ttl || 3000);
        }, 0);
      }
    }]
  };

  function linkFn(scope, ele, attr) {}
}).factory('Toast', ['$rootScope', function ($rootScope) {
  return {
    success: function (msg, ttl) {
      sendMessage(msg, 'success', ttl);
    },
    info: function (msg, ttl) {
      sendMessage(msg, 'info', ttl);
    },
    warn: function (msg, ttl) {
      sendMessage(msg, 'warning', ttl);
    },
    warning: function (msg, ttl) {
      sendMessage(msg, 'warning', ttl);
    },
    error: function (msg, ttl) {
      sendMessage(msg, 'danger', ttl);
    }
  };

  function sendMessage(msg, type, ttl) {
    $rootScope.$broadcast('message', {
      message: msg,
      type: type,
      ttl: ttl
    });
  }
}]);
'use strict';

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

angular.module('web').directive('wosFileSelector', ['$timeout', 'wos', function ($timeout, wos) {

  return {
    restrict: 'EA',
    transclude: false,
    scope: {
      config: '=', // {region, bucket, key, id, secret}
      selectedItem: '=', // {region, wosPath}
      showBuckets: '=', // true
      folderOnly: '=', // true
      height: '=' // 200
    },
    templateUrl: 'components/directives/wos-file-selector.html',
    controller: ['$scope', ctrl]
  };

  function ctrl($scope) {
    var client;

    if (!$scope.height) $scope.height = 200;
    if ($scope.showBuckets == null) $scope.showBuckets = true;
    if ($scope.folderOnly == null) $scope.folderOnly = true;

    $scope.keepConfig = angular.copy($scope.config);

    refresh();

    function refresh() {

      var v = $scope.keepConfig;
      if (!v.bucket) {
        //if(!$scope.ngModel)$scope.ngModel={};
        $scope.selectedItem.wosPath = 'wos://';
        $scope.selectedItem.region = '';
        $scope.isLoading = true;
        wos.listAllBuckets().then(function (arr) {
          $scope.items = arr;
          $scope.isLoading = false;
        });
      } else {
        if (!v.key) $scope.selectedItem.wosPath = 'wos://' + v.bucket + "/";else $scope.selectedItem.wosPath = 'wos://' + v.bucket + "/" + v.key;

        $scope.selectedItem.region = v.region;

        if (v.key.lastIndexOf('/') == v.key.length - 1) {
          //isFolder
          $scope.isLoading = true;
          wos.listAllFiles(v.region, v.bucket, v.key, $scope.folderOnly).then(function (arr) {
            $scope.items = arr;
            $scope.isLoading = false;
          });
        }
      }
    }

    $scope.$watch('keepConfig', function (v) {
      refresh();
    });

    $scope.select = function (item) {

      if (item.isBucket) {
        $scope.selectedItem.wosPath = "wos://" + item.name;
      } else if (item.isFolder) {
        $scope.selectedItem.wosPath = "wos://" + $scope.keepConfig.bucket + "/" + item.path.replace(/\/$/, '') + '/';
      } else {
        $scope.selectedItem.wosPath = "wos://" + $scope.keepConfig.bucket + "/" + item.path.replace(/\/$/, '');
      }
    };

    $scope.goIn = function (item) {
      if (item.isBucket) {
        $scope.keepConfig.region = item.region;
        $scope.keepConfig.key = '';
        $scope.keepConfig.bucket = item.name;
      } else {
        if (item.isFolder) {
          $scope.keepConfig.key = item.path.replace(/\/$/, '') + '/';
        } else {
          $scope.keepConfig.key = item.path.replace(/\/$/, '');
        }
      }
      refresh();
    };

    $scope.goUp = function () {
      var v = $scope.selectedItem.wosPath;
      if (v == 'wos://') {
        return;
      }
      var info = wos.parseWOSPath(v);

      if (info.key == '') {
        if (!$scope.showBuckets) {
          return;
        }
        $scope.keepConfig.bucket = '';
        $scope.keepConfig.key = '';
        refresh();
        return;
      }

      var key = info.key.replace(/\/$/, '');
      $scope.keepConfig.key = key.substring(0, key.lastIndexOf('/'));
      if ($scope.keepConfig.key != '') {
        $scope.keepConfig.key += '/';
      }
      refresh();
    };
  }
}]);
'use strict';

angular.module('web').filter('trustAsResourceUrl', ['$sce', function ($sce) {
  return function (val) {
    return $sce.trustAsResourceUrl(val);
  };
}]).filter('sub', function () {
  return function (s, len) {
    if (s.length < len) return s;else return s.substring(0, len) + '...';
  };
}).filter('hideSecret', function () {
  return function (s) {
    if (s.length < 6) return '******';else return s.substring(0, 3) + '****' + s.substring(s.length - 3);
  };
}).filter('timeFormat', function () {
  return function (d, de) {
    de = de || '';
    try {
      if (!d) return de;
      var s = new Date(d);
      if (s == 'Invalid date') {
        return de;
      }
      return moment(s).format('YYYY-MM-DD HH:mm:ss');
    } catch (e) {
      return de;
    }
  };
}).filter('elapse', function () {
  return function (st, et) {
    et = et || new Date().getTime();

    var ms = et - st;

    if (isNaN(ms)) {
      return '';
    }
    if (ms <= 0) return 0;else if (ms < 1000) return ms + 'ms';

    //return moment.duration(ms).humanize();
    var t = [];
    var h = Math.floor(ms / 3600 / 1000);
    if (h) {
      ms = ms - h * 3600 * 1000;
      t.push(h + 'h');
    }
    var m = Math.floor(ms / 60 / 1000);
    if (m) {
      ms = ms - m * 60 * 1000;
      t.push(m + 'm');
    }
    var s = Math.floor(ms / 1000);
    if (s) {
      ms = ms - s * 1000;
      t.push(s + 's');
    }
    return t.join('');
  };
}).filter('leftTimeFormat', ['utilSvs', function (utilSvs) {
  return function (ms) {
    return utilSvs.leftTime(ms);
  };
}]).filter('sizeFormat', function () {

  return function (n, ex) {
    if (n == 0) return 0;
    if (!n) return '0';

    var t = [];
    var left = n;
    var gb = Math.floor(n / Math.pow(1024, 3));
    if (gb > 0) {
      if (ex) {
        t.push(gb + 'G');
        left = left % Math.pow(1024, 3);
      } else {
        return Math.round(n * 100 / Math.pow(1024, 3)) / 100 + 'GB';
      }
    }

    var mb = Math.floor(left / Math.pow(1024, 2));
    if (mb > 0) {
      if (ex) {
        t.push(mb + 'M');
        left = left % Math.pow(1024, 2);
      } else {
        return Math.round(100 * left / Math.pow(1024, 2)) / 100 + 'MB';
      }
    }

    var kb = Math.floor(left / 1024);
    if (kb > 0) {
      if (ex) {
        t.push(kb + 'K');
        left = left % 1024;
      } else {
        return Math.round(100 * left / 1024) / 100 + 'KB';
      }
    }

    if (left > 0) {
      t.push(left + 'B');
      if (!ex) return left + 'B';
    }
    return t.length > 0 ? t.join('') : 0;
  };
}).filter('persent', function () {
  return function (a, b, status) {

    if (a == 0 && b == 0) {
      if (status == 'finished') {
        return 100;
      } else return 0;
    }
    return Math.floor(a / b * 10000) / 100;
  };
}).filter('statusCls', ['jobUtil', function (jobUtil) {
  return function (s) {
    return jobUtil.getStatusCls(s);
  };
}]).filter('status', ['jobUtil', function (jobUtil) {
  return function (s, isUp) {
    return jobUtil.getStatusLabel(s, isUp);
  };
}]).filter('fileIcon', ['fileSvs', function (fileSvs) {
  return function (item) {
    if (item.storageClass == 'Archive') {
      //restore
      if (item.storageStatus == 2) {
        return 'hourglass-2 text-warning';
      } else if (item.storageStatus != 3) {
        return 'square';
      }
    }
    var info = fileSvs.getFileType(item);

    if (info.type == 'video') return 'file-video-o';else if (info.type == 'audio') return 'file-audio-o';else if (info.type == 'picture') return 'file-image-o';else if (info.type == 'doc') {
      switch (info.ext[0]) {
        case 'doc':
        case 'docx':
          return 'file-word-o';
        case 'pdf':
          return 'file-pdf-o';
        case 'ppt':
        case 'pptx':
          return 'file-powerpoint-o';
        case 'exl':
          return 'file-excel-o';
      }
      return 'file-o';
    } else if (info.type == 'code') {
      return 'file-text-o';
    } else if (info.type == 'others') {
      switch (info.ext[0]) {
        case 'gz':
        case 'tar':
        case 'zip':
        case 'jar':
        case 'bz':
        case 'war':
        case 'xz':
          return 'file-zip-o';

        case 'pkg':
          return 'dropbox';
        case 'app':
        case 'dmg':
          return 'apple';
        case 'apk':
          return 'android';

        case 'msi':
        case 'deb':
        case 'bin':

        case 'exe':
          return 'cog';

        case 'img':
        case 'iso':
          return 'dot-circle-o';

        case 'cmd':
        case 'sh':
          return 'terminal';
      }
      return 'file-o';
    } else return 'file-o';
  };
}]);
'use strict';

angular.module('web').filter('listFilter', function () {
  return function (arr, keyFn, value) {
    if (!value) return arr;
    if (arr && arr.length > 0) {
      var t = [];
      if (typeof keyFn == 'string') {
        angular.forEach(arr, function (n) {
          if (n[keyFn].indexOf(value) != -1) {
            t.push(n);
          }
        });
      } else if (typeof keyFn == 'function') {
        angular.forEach(arr, function (n) {
          if (keyFn(n).indexOf(value) != -1) {
            t.push(n);
          }
        });
      }
      return t;
    }
    return [];
  };
});
'use strict';

angular.module('web').factory('Auth', ['$q', '$rootScope', '$location', '$translate', 'wos', 'AuthInfo', 'Const', 'Cipher', function ($q, $rootScope, $location, $translate, wos, AuthInfo, Const, Cipher) {
  var T = $translate.instant;
  return {
    login: login,
    logout: logout
  };

  function login(data) {
    // if(!data.wospath)delete data.region;
    console.log("123213213213");
    var df = $q.defer();
    data.httpOptions = { timeout: 15000 };

    if (data.id.indexOf('STS.') != 0) {
      delete data.stoken;
    }

    // $rootScope.internalSupported = data.eptpl ? data.eptpl.indexOf('-internal')!=-1 : false;

    if (data.wospath) {

      var info = wos.parseWOSPath(data.wospath);
      data.bucket = info.bucket;
      wos.getClient(data).listObjects({ Bucket: info.bucket, Prefix: info.key, Marker: '', MaxKeys: 1, Delimiter: '/' }, function (err, result) {

        if (err) {
          df.reject(err);
        }
        // else if(result.RequestId && result.CommonPrefixes){
        else if (result.CommonPrefixes) {
            //登录成功
            AuthInfo.save(data);
            df.resolve();
          } else {
            df.reject({ code: 'Error', message: T('login.endpoint.error') }); //'请确定Endpoint是否正确'
          }
      });
    } else {
      data.bucket = undefined;
      wos.getClient(data).listBuckets(function (err, result) {

        if (err) {
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
        else if (result.Buckets) {
            //登录成功
            AuthInfo.save(data);
            df.resolve();
          } else {
            df.reject({ code: 'Error', message: T('login.endpoint.error') });
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
}]);
'use strict';

angular.module('web').factory('AuthInfo', ['$q', 'Const', 'Cipher', function ($q, Const, Cipher) {

  var AUTH_INFO = Const.AUTH_INFO_KEY;
  var AUTH_HIS = Const.AUTH_HIS;
  var AUTH_KEEP = Const.AUTH_KEEP;
  return {
    get: function () {
      return get(AUTH_INFO);
    },
    save: function (obj) {
      save(AUTH_INFO, obj);
    },
    remove: function () {
      remove(AUTH_INFO);
    },
    saveToAuthInfo: saveToAuthInfo,

    remember: function (obj) {
      save(AUTH_KEEP, obj);
    },
    unremember: function () {
      remove(AUTH_KEEP);
    },
    getRemember: function () {
      return get(AUTH_KEEP);
    },

    listHistories: function () {
      return get(AUTH_HIS);
    },
    cleanHistories: function () {
      remove(AUTH_HIS);
    },
    removeFromHistories: removeFromHistories,
    addToHistories: addToHistories
  };

  function addToHistories(obj) {
    var arr = get(AUTH_HIS, []);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id == obj.id) {
        arr.splice(i, 1);
        i--;
      }
    }
    arr.unshift(obj);
    save(AUTH_HIS, arr, []);
  }
  function removeFromHistories(id) {
    var arr = get(AUTH_HIS, []);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id == id) {
        arr.splice(i, 1);
        i--;
      }
    }
    save(AUTH_HIS, arr, []);
  }

  function saveToAuthInfo(opt) {
    var obj = get(AUTH_INFO);
    for (var k in opt) obj[k] = opt[k];
    save(AUTH_INFO, obj);
  }

  ///////////////////////////////
  function remove(key) {
    localStorage.removeItem(key);
  }
  function get(key, defv) {
    var str = localStorage.getItem(key);
    if (str) {
      try {
        str = Cipher.decipher(str);
        return JSON.parse(str);
      } catch (e) {
        console.log(e, str);
      }
    }
    return defv || {};
  }
  function save(key, obj, defv) {

    delete obj['httpOptions'];

    var str = JSON.stringify(obj || defv || {});
    try {
      str = Cipher.cipher(str);
    } catch (e) {
      console.log(e);
    }
    localStorage.setItem(key, str);
  }
}]);
'use strict';

angular.module('web').factory('autoUpgradeSvs', ['settingsSvs', function (settingsSvs) {

  var util = require('./node/wosstore/lib/util');
  var NAME = 'wos-browser';

  var release_notes_url = Global.release_notes_url;
  var upgrade_url = Global.upgrade_url;
  var gVersion = Global.app.version;
  //var config_path = Global.config_path;

  var upgradeOpt = {
    currentVersion: gVersion,
    isLastVersion: false,
    lastVersion: gVersion,
    fileName: '',
    link: '',
    // fileName: fileName,
    // link: linkPre + '/'+ fileName,
    upgradeJob: {
      pkgLink: '',
      progress: 0,
      status: 'waiting'
    }
  };

  return {
    load: load,
    start: start,

    compareVersion: compareVersion,
    getReleaseNote: getReleaseNote,
    getLastestReleaseNote: getLastestReleaseNote
  };

  var job;

  function start() {
    if (job) job.start();
  }

  function getReleaseNote(version, lang, fn) {
    if (compareVersion(version, '1.5.1') <= 0) $.get('../release-notes/' + version + '.md', fn);else $.get('../release-notes/' + version + '.' + lang + '.md', fn);
  }

  //获取最新releaseNote
  function getLastestReleaseNote(version, lang, fn) {
    if (compareVersion(version, '1.5.1') <= 0) $.get(release_notes_url + version + '.md', fn);else $.get(release_notes_url + version + '.' + lang + '.md', fn);
  }

  function FlatDownloadJob(name, from, to) {
    console.log('FlatDownloadJob:', from, to);
    this.total = 0;
    this.progress = 0;
    this.name = name;
    this.from = from;
    this.to = to;

    var _statusChangeFn;
    var _progressChangeFn;

    this.update = function () {
      //copy
      console.log('copy:', __dirname);
      fs.renameSync(to + '.download', to);
      this._changeStatus('finished');
    };
    this.check = function (crc, md5, fn) {
      //crc
      console.log('crc64 check');
      return util.checkFileHash(to + '.download', crc, md5, fn);
    };

    this.precheck = function () {
      this.progress = 0;
      this.total = 0;

      if (fs.existsSync(to)) {
        console.log('exists, done');
        this.progress = 100;
        this._changeStatus('finished');
      }
    };

    this.start = function () {
      this.progress = 0;
      this.total = 0;
      var that = this;

      if (fs.existsSync(to)) {
        console.log('exists, done');
        this.progress = 100;
        this._changeStatus('finished');
        return;
      }

      if (fs.existsSync(to + '.download')) {
        fs.unlinkSync(to + '.download');
      }

      console.log('start download ...');
      that._changeStatus('running');

      request.head({ url: from, timeout: 10000 }).on('error', function (err) {
        console.log(err);
        this._changeStatus('failed', err);
      }).on('response', function (response) {
        console.log(response.statusCode); // 200
        console.log(response.headers); // 'image/png'

        if (response.statusCode == 200) {
          that.total = response.headers['content-length'];
          var current = 0;
          that.progress = Math.round(current * 10000 / that.total) / 100;
          console.log(that.total);

          var ws = fs.createWriteStream(to + '.download', { flags: 'a+' });

          request(from).on('error', function (err) {
            console.log(err);
            that._changeStatus('failed', err);
          }).on('data', function (chunk) {
            current += chunk.length;
            that.progress = Math.round(current * 10000 / that.total) / 100;
            //console.log(that.progress)
            that._changeProgress(that.progress);
            // fs.appendFile(to+'.download', chunk, function(err){
            //    if(err)console.log(err)
            // });
            return chunk;
          }).pipe(ws).on('finish', function () {
            that._changeStatus('verifying');

            that.check(response.headers['x-wos-hash-crc64ecma'], response.headers['content-md5'], function (err) {
              console.log('check error:', err);
              if (err) that._changeStatus('failed', err);else {
                that.update();
              }
            });
          });
        } else {
          console.log(response);
          that._changeStatus('failed', response);
        }
      });
    };
    this.onProgressChange = function (fn) {
      _progressChangeFn = fn;
    };
    this.onStatusChange = function (fn) {
      _statusChangeFn = fn;
    };
    this._changeStatus = function (status, err) {
      //console.log(status, err)
      this.status = status;
      this.message = err;
      if (_statusChangeFn) _statusChangeFn(status);
    };
    this._changeProgress = function (prog) {
      if (_progressChangeFn) _progressChangeFn(prog);
    };
  };

  function load(fn) {

    $.getJSON(upgrade_url, function (data) {

      var isLastVersion = compareVersion(gVersion, data.version) >= 0;
      var lastVersion = data.version;

      upgradeOpt.isLastVersion = isLastVersion;
      upgradeOpt.lastVersion = lastVersion;

      var fileName = NAME + '-' + process.platform + '-' + process.arch + '.zip';

      if (isLastVersion) {
        //无需更新

        var link = data['package_url'].replace(/(\/*$)/g, '') + '/' + data['version'] + '/' + fileName;

        console.log("download url:", link);

        fn({
          currentVersion: gVersion,
          isLastVersion: isLastVersion,
          lastVersion: lastVersion,
          fileName: fileName,
          link: link
        });

        return;
      }

      getFasterUrl(data['package_urls'], lastVersion, function (linkPre) {

        if (data.files) {

          //暂时只支持1个文件更新
          data.file = data.files.length > 0 ? data.files[0] : null;

          var jobs = [];

          //var fileName = NAME + '-' + process.platform + '-' + process.arch + '.zip';

          var pkgLink = linkPre + '/' + process.platform + '-' + process.arch + '/' + data.file;

          upgradeOpt.fileName = fileName;
          upgradeOpt.link = linkPre + '/' + fileName;
          upgradeOpt.upgradeJob.status = 'waiting';
          upgradeOpt.upgradeJob.progress = 0;
          upgradeOpt.upgradeJob.pkgLink = pkgLink;

          var jobsFinishedCount = 0;

          var to = path.join(__dirname, '..', lastVersion + '-' + data.file);

          job = new FlatDownloadJob(data.file, pkgLink, to);

          job.onStatusChange(function (status) {
            upgradeOpt.upgradeJob.status = status;
          });
          job.onProgressChange(function (progress) {
            upgradeOpt.upgradeJob.progress = progress;
          });
          job.precheck();

          //增量更新
          fn(upgradeOpt);
          return;
        }

        //全量更新
        // var fileName = NAME + '-' + process.platform + '-' + process.arch + '.zip';
        // var link = data['package_url'].replace(/(\/*$)/g, '') + '/' + lastVersion + '/' + fileName;

        var link = linkPre + '/' + fileName;
        console.log("download url:", link);

        fn({
          files: data.files,
          currentVersion: gVersion,
          isLastVersion: isLastVersion,
          lastVersion: lastVersion,
          fileName: fileName,
          link: link
        });
      }); // end getFasterUrl
    });
  }

  function getFasterUrl(arr, lastVersion, fn) {

    var fileName = NAME + '-' + process.platform + '-' + process.arch + '.zip';
    var c = 0;
    var t = [];
    _dig();
    function _dig() {
      var t1 = Date.now();
      var linkPre = arr[c].replace(/(\/*$)/g, '') + '/' + lastVersion;
      $.ajax({
        timeout: 5000,
        url: linkPre + '/' + fileName,
        headers: {
          Range: 'bytes=30-210'
        }
      }).then(function (data) {
        var t2 = Date.now();
        t.push({ time: t2 - t1, linkPre: linkPre });

        c++;
        if (c >= arr.length) callback();else _dig();
      }, function (err) {
        var t2 = Date.now();
        t.push({ time: t2, linkPre: linkPre });
        console.log(arr[c], err);

        c++;
        if (c >= arr.length) callback();else _dig();
      });
    }
    function callback() {
      t.sort(function (a, b) {
        return a.time > b.time ? 1 : -1;
      });
      console.log('getFasterUrl:', JSON.stringify(t, ' ', 2));
      fn(t[0].linkPre);
    }
  }

  function compareVersion(curV, lastV) {
    var arr = curV.split('.');
    var arr2 = lastV.split('.');

    var len = Math.max(arr.length, arr2.length);

    for (var i = 0; i < len; i++) {
      var a = parseInt(arr[i]);
      var b = parseInt(arr2[i]);

      if (a > b) {
        return 1;
      } else if (a < b) {
        return -1;
      }
    }
    return 0;
  }
}]);
'use strict';

// register the interceptor as a service
angular.module('web').factory('BaseHttp', ['$http', '$rootScope', '$timeout', function ($http, $rootScope, $timeout) {

    return function (opt) {

        $rootScope.onRequest = true;

        opt.headers = opt.headers || {};
        //for server side: req.xhr
        if (!opt.headers['X-Requested-With']) {
            opt.headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        if (opt.url.indexOf('http') != 0) {
            opt.url = Global.endpoint + opt.url;
        }
        var httpPromise = $http(opt);

        httpPromise.success(function (data, status, header) {
            setOnRequestFalse();
        });

        httpPromise.error(function (err, status, header) {

            if (opt.params && opt.params.ignoreError) {
                //pass
            } else if (opt.data && opt.data.ignoreError) {
                //pass
            } else {
                $rootScope.$broadcast('http_error_message', err);
            }
            setOnRequestFalse();
        });

        return httpPromise;
    };

    var tid;

    function setOnRequestFalse() {
        $timeout.cancel(tid);
        tid = $timeout(function () {
            $rootScope.onRequest = false;
        }, 600);
    }
}]);
'use strict';

angular.module('web').factory('Cipher', function () {

  var crypto = require('crypto');
  var ALGORITHM = 'aes192';
  var KEY = 'x82m#*lx8vv';

  return {
    cipher: cipher,
    decipher: decipher
  };

  function cipher(buf, key, algorithm) {
    if (!buf instanceof Buffer) {
      buf = new Buffer(buf);
    }
    var encrypted = "";
    var cip = crypto.createCipher(algorithm || ALGORITHM, key || KEY);
    encrypted += cip.update(buf, 'utf8', 'hex');
    encrypted += cip.final('hex');
    return encrypted;
  };

  function decipher(encrypted, key, algorithm) {
    var decrypted = "";
    var decipher = crypto.createDecipher(algorithm || ALGORITHM, key || KEY);
    decrypted += decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };
});
'use strict';

angular.module('web').factory('DelayDone', ['$timeout', function ($timeout) {

  var mDelayCall = {};

  return {
    delayRun: delayRun,
    seriesRun: seriesRun

    /**
     * @param id {String}  uniq
     * @param timeout {int}  ms
     * @param times {int}  超过次数也会调, 然后重新统计
     * @param fn {Function}  callback
     */

  };function delayRun(id, timeout, fn, times) {
    if (!mDelayCall[id]) mDelayCall[id] = {
      tid: '',
      c: 0
    };
    var n = mDelayCall[id];

    n.c++;

    if (n.c >= times) {
      fn();
      n.c = 0;
    } else {
      $timeout.cancel(n.tid);
      n.tid = $timeout(fn, timeout);
    }
  }

  function seriesRun(arr, fn, doneFn) {
    var len = arr.length;
    var c = 0;

    function _dig() {
      var n = arr[c];
      fn(n, function () {
        c++;
        if (c >= len) {
          doneFn();
        } else {
          $timeout(function () {
            _dig();
          }, 1);
        }
      });
    }
    _dig();
  }
}]);
'use strict';

angular.module('web').factory('Dialog', ['$uibModal', function ($modal) {

  var dialog = require('electron').remote.dialog;

  return {
    alert: alert,
    confirm: confirm,

    showUploadDialog: showUploadDialog,
    showDownloadDialog: showDownloadDialog
  };

  function showUploadDialog(fn, isFolder) {
    var isMac = navigator.userAgent.indexOf('Macintosh') != -1;
    var selopt = isFolder ? ['openDirectory', 'multiSelections'] : ['openFile', 'multiSelections'];

    dialog.showOpenDialog({
      title: 'Upload',
      properties: isMac ? ['openFile', 'openDirectory', 'multiSelections'] : selopt
    }, function (filePaths) {
      if (typeof fn == 'function') fn(filePaths);
    });
  }
  function showDownloadDialog(fn) {
    dialog.showOpenDialog({
      title: 'Download',
      properties: ['openDirectory']
    }, function (filePaths) {
      if (typeof fn == 'function') fn(filePaths);
    });
  }

  /**
   *
   * @param title
   * @param msg
   * @param fn
   * @param opt
   *    opt.cls: danger success warning info,
   *    opt.hideIcon:     default: false
   */
  function alert(title, msg, fn, opt) {
    opt = opt || { cls: 'primary' };
    if (typeof opt == 'number') {
      switch (opt) {
        case 2:
          opt = { cls: 'warning' };break;
        case 1:
          opt = { cls: 'danger' };break;
        default:
          opt = { cls: 'primary' };break;
      }
    } else {
      opt = Object.assign({ cls: 'primary' }, opt);
    }
    var putData = {
      title: title,
      message: msg,
      opt: opt,
      callback: fn || function (flag) {}
    };

    $modal.open({
      templateUrl: 'components/services/dialog.html',
      controller: 'alertDialogCtrl',
      size: opt.size || 'md',
      resolve: {
        putData: function () {
          return putData;
        }
      }
    });
  }

  function confirm(title, msg, fn, opt) {
    opt = opt || { cls: 'primary' };
    if (typeof opt == 'number') {
      switch (opt) {
        case 2:
          opt = { cls: 'warning' };break;
        case 1:
          opt = { cls: 'danger' };break;
        default:
          opt = { cls: 'primary' };break;
      }
    } else {
      opt = Object.assign({ cls: 'primary' }, opt);
    }
    var putData = {
      title: title,
      message: msg,
      opt: opt,
      callback: fn || function (flag) {}
    };

    $modal.open({
      templateUrl: 'components/services/dialog.html',
      controller: 'confirmDialogCtrl',
      size: opt.size || 'md',
      resolve: {
        putData: function () {
          return putData;
        }
      }
    });
  }
}]).controller('alertDialogCtrl', ['$scope', '$uibModalInstance', 'putData', function ($scope, $modalInstance, putData) {
  angular.extend($scope, putData);
  $scope.isAlert = true;
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
    putData.callback(false);
  };
  $scope.ok = function () {
    $modalInstance.dismiss('cancel');
    putData.callback(true);
  };
}]).controller('confirmDialogCtrl', ['$scope', '$uibModalInstance', 'putData', function ($scope, $modalInstance, putData) {
  angular.extend($scope, putData);
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
    putData.callback(false);
  };
  $scope.ok = function () {
    $modalInstance.dismiss('cancel');
    putData.callback(true);
  };
}]);
'use strict';

angular.module('web').factory('DiffModal', ['$uibModal', function ($modal) {

  return {
    /**
     * @param title
     * @param originalContent
     * @param content
     * @param callback
     * @param editable
     */
    show: function (title, originalContent, content, callback, editable) {
      editable = editable === false ? false : true;

      $modal.open({
        templateUrl: 'components/services/diff-modal.html',
        controller: 'diffModalCtrl',
        size: 'lg',
        resolve: {
          title: function () {
            return title || 'Diff';
          },
          editable: function () {
            return editable;
          },
          originalContent: function () {
            return originalContent;
          },
          content: function () {
            return content;
          },
          callback: function () {
            return function (v) {
              if (editable) callback(v);else callback();
            };
          }
        }
      });
    }
  };
}]).controller('diffModalCtrl', ['$scope', '$uibModalInstance', '$timeout', 'title', 'editable', 'originalContent', 'content', 'callback', function ($scope, $modalInstance, $timeout, title, editable, originalContent, content, callback) {

  angular.extend($scope, {
    title: title || 'Diff',
    originalContent: originalContent,
    content: content,
    initUI: initUI,
    editable: editable,

    ok: ok,
    cancel: cancel
  });

  var editor;

  function initUI() {

    $timeout(function () {

      editor = CodeMirror.MergeView(document.getElementById('diff-view'), {
        value: content,
        origLeft: originalContent,
        //orig:  content,
        lineNumbers: true,
        mode: "javascript",
        highlightDifferences: true,
        connect: 'align',
        collapseIdentical: true,

        //不可编辑
        allowEditingOriginals: false,
        revertButtons: false
      });
    }, 100);
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function ok() {
    callback(editor.editor().getValue());
    $modalInstance.dismiss('close');
  }
}]);
'use strict';

angular.module('web').factory('Fav', ['$q', 'AuthInfo', 'Toast', function ($q, AuthInfo, Toast) {

  var MAX = 100;
  var fs = require('fs');
  var path = require('path');
  var os = require('os');

  return {
    add: add,
    list: list,
    remove: remove,
    has: has
  };
  function has(addr) {
    var arr = list();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].url == addr) {
        return true;
      }
    }
    return false;
  }

  function add(addr) {
    var arr = list();

    if (arr.length >= MAX) return false;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].url == addr) {
        arr.splice(i, 1);
        i--;
      }
    }
    arr.push({ url: addr, time: new Date().getTime() });
    if (arr.length > MAX) {
      arr.splice(MAX, arr.length - MAX);
    }
    //localStorage.setItem('favs',JSON.stringify(arr));
    save(arr);
    return true;
  }

  function remove(addr) {
    var arr = list();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].url == addr) {
        arr.splice(i, 1);
        i--;
      }
    }
    //localStorage.setItem('favs',JSON.stringify(arr));
    save(arr);
  }

  function save(arr) {
    try {
      fs.writeFileSync(getFavFilePath(), JSON.stringify(arr));
    } catch (e) {
      Toast.error('保存书签失败:' + e.message);
    }
  }

  function list() {
    try {
      var data = fs.readFileSync(getFavFilePath());
      return JSON.parse(data ? data.toString() : '[]');
      // var arr = JSON.parse(localStorage.getItem('favs')||'[]');
      // return arr;
    } catch (e) {
      return [];
    }
  }

  //下载进度保存路径
  function getFavFilePath() {
    var folder = path.join(os.homedir(), '.wos-browser');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    var username = AuthInfo.get().id || '';
    return path.join(folder, 'fav_' + username + '.json');
  }
}]);
'use strict';

angular.module('web').factory('fileSvs', ['$q', 'Const', function ($q, Const) {

  return {
    /**
    * 根据后缀判断
    * @param  item = {name, size}
    * @return obj = {type, ...}
    *     type: [picture|code|others|doc|video|audio]
    */
    getFileType: function (item) {
      var ext = item.name.indexOf('.') != -1 ? item.name.toLowerCase().substring(item.name.lastIndexOf('.') + 1) : '';

      if (Const.IMM_DOC_TYPES.indexOf(ext) != -1) {
        //IMM预览支持的文档类型
        return { type: 'doc', ext: [ext] };
      }

      switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
          return { type: 'picture', ext: [ext] };

        //  case 'doc':
        //  case 'docx':
        //  case 'pdf': return {type: 'doc', ext: [ext]};

        case 'mp4':
          return { type: 'video', ext: [ext], mineType: 'video/mp4' };
        case 'webm':
          return { type: 'video', ext: [ext], mineType: 'video/webm' };
        case 'mov':
          return { type: 'video', ext: [ext], mineType: 'video/quicktime' };

        case 'ogv':
          return { type: 'video', ext: [ext], mineType: 'video/ogg' };
        case 'flv':
          return { type: 'video', ext: [ext], mineType: 'video/x-flv' };

        case 'mp3':
          return { type: 'audio', ext: [ext], mineType: 'audio/mp3' };
        case 'ogg':
          return { type: 'audio', ext: [ext], mineType: 'audio/ogg' };
      }

      var codeMode = CodeMirror.findModeByExtension(ext);

      if (codeMode) {
        codeMode.type = 'code';
        return codeMode;
      } else {
        return { type: 'others', ext: [ext] };
      }
    }
  };
}]);
'use strict';

angular.module('web').factory('I18n', [function () {

  var defaultLocale = navigator.language;
  console.log('Default Locale:', defaultLocale);

  var _transMap = {}; // locale: kvPairs
  return {
    init: function (locale, kvPairs) {
      _transMap[locale] = kvPairs;
    },
    use: function (locale) {
      defaultLocale = locale;
    },
    getLocale: function () {
      return defaultLocale;
    },
    translate: function (key, options, locale) {
      try {
        if (options) {
          console.log(key, options, locale, defaultLocale, _transMap);
          var msg = _transMap[locale || defaultLocale][key];
          for (var k in options) {
            msg.replace(new Regex('\\{\\{' + k + '\\}\\}', 'g'), options[k]);
          }
          return msg;
        } else {
          return _transMap[locale || defaultLocale][key];
        }
      } catch (e) {
        console.log('---', e);
        return key;
      }
    }
  };
}]).filter('translate2', ['I18n', function (I18n) {
  return function (key, options) {
    return I18n.translate(key, options);
  };
}]);
'use strict';

angular.module('web').factory('indexDBSvs', ['$q', function ($q) {
  return {
    open: open,
    create: create,
    update: update,
    list: list,
    get: get,
    'delete': del,
    clear: clear
  };
  /**
  initStore: {storeName: }
  */
  function open(name, version, initStoreMap) {
    var df = $q.defer();
    var version = version || 1;
    var request = window.indexedDB.open(name, version);
    request.onerror = function (e) {
      console.error(e.currentTarget.error.message);
      df.reject(e.currentTarget.error);
    };
    request.onsuccess = function (e) {
      var db = e.target.result;
      df.resolve(db);
    };
    request.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (initStoreMap) {
        for (var storeName in initStoreMap) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, initStoreMap[storeName] || { keyPath: 'id', autoIncrement: true });
            //db.createObjectStore(storeName, {keyPath: 'id', utoIncrement: true});
          }
        }
      }
      console.log('DB version changed to ' + version);
    };
    return df.promise;
  }
  function list(db, storeName) {
    var df = $q.defer();
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);
    var cursor = store.openCursor();
    var data = [];
    cursor.onsuccess = function (e) {
      var result = e.target.result;
      if (result && result !== null) {
        data.push(result.value);
        result.continue();
      } else {
        df.resolve(data);
      }
    };
    cursor.onerror = function (e) {
      console.error(e.currentTarget.error.message);
      df.reject(e.currentTarget.error);
    };
    return df.promise;
  }

  function get(db, storeName, key) {
    var df = $q.defer();
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);
    var request = store.get(key);
    request.onsuccess = function (e) {
      var item = e.target.result;
      df.resolve(item);
    };
    request.onerror = function (e) {
      console.error(e.currentTarget.error.message);
      df.reject(e.currentTarget.error);
    };
    return df.promise;
  }
  function create(db, storeName, data) {
    var df = $q.defer();
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);
    var request = store.add(data);
    request.onsuccess = function (e) {
      df.resolve();
    };
    request.onerror = function (e) {
      console.error(e.currentTarget.error.message);
      df.reject(e.currentTarget.error);
    };
    return df.promise;
  }
  function update(db, storeName, key, data) {
    var df = $q.defer();
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);
    var request = store.get(key);
    request.onsuccess = function (e) {
      var item = e.target.result;
      if (item) {
        angular.extend(item, data);
        store.put(item);
      } else {
        store.add(data);
      }
      df.resolve();
    };
    request.onerror = function (e) {
      console.error(e.currentTarget.error.message);
      df.reject(e.currentTarget.error);
    };
    return df.promise;
  }

  function del(db, storeName, key) {
    var df = $q.defer();
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);
    var request = store.delete(key);
    request.onsuccess = function (e) {
      df.resolve();
    };
    request.onerror = function (e) {
      console.error(e.currentTarget.error.message);
      df.reject(e.currentTarget.error);
    };
    return df.promise;
  }
  function clear(db, storeName, key) {
    var df = $q.defer();
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);
    var request = store.clear();
    request.onsuccess = function (e) {
      df.resolve();
    };
    request.onerror = function (e) {
      console.error(e.currentTarget.error.message);
      df.reject(e.currentTarget.error);
    };
    return df.promise;
  }
}]);
'use strict';

angular.module('web').factory('jobUtil', ['$q', '$state', '$timeout', '$translate', function ($q, $state, $timeout, $translate) {
  var T = $translate.instant;
  return {
    getStatusLabel: getStatusLabel,
    getStatusCls: getStatusCls
  };
  function getStatusCls(s) {
    if (!s) return 'default';
    switch (s.toLowerCase()) {
      case 'running':
        return 'info';
      case 'verifying':
        return 'primary';
      case 'failed':
        return 'danger';
      case 'finished':
        return 'success';
      case 'stopped':
        return 'warning';
      case 'retrying':
        return 'warning';
      default:
        return 'default';
    }
  }

  function getStatusLabel(s, isUp) {
    if (!s) return s;
    switch (s.toLowerCase()) {
      case 'running':
        return isUp ? T('status.running.uploading') : T('status.running.downloading'); //'正在上传':'正在下载';
      case 'failed':
        return T('status.failed'); //'失败';
      case 'finished':
        return T('status.finished'); // '完成';
      case 'stopped':
        return T('status.stopped'); //'暂停';
      case 'verifying':
        return T('status.verifying'); //'';
      case 'retrying':
        return T('status.retrying');
      default:
        return T('status.waiting'); //'等待';
    }
  }
}]);
'use strict';

angular.module('web').factory('Mailer', ['settingsSvs', function (settingsSvs) {

  var nodemailer = require('nodemailer');
  var smtpTransport = require('nodemailer-smtp-transport');

  return {
    send: function (info) {
      return new Promise((resolve, reject) => {
        var smtp = settingsSvs.mailSmtp.get();
        var opt = {
          from: smtp.from,
          to: info.to,
          subject: info.subject,
          html: info.html || info.content
          //console.log('sending..', smtp, opt);

        };var transporter = nodemailer.createTransport(smtpTransport(smtp));
        transporter.sendMail(opt, function (err, info) {
          if (err) reject(err);else resolve(info);
        });
      });
    }
  };
}]);
'use strict';

angular.module('web').factory('Project', ['BaseHttp', 'Auth', '$state', function ($http, Auth, $state) {

  return {
    list: function () {
      var token = Auth.getXToken();
      if (!token) {
        $state.go('login');
        return;
      }

      return $http({
        method: 'GET',
        url: Global.endpoint + '/api/projects',
        headers: {
          'x-token': token
        }
      });
    },
    use: function (projectId) {
      localStorage.setItem('projectId', projectId);
    },
    getCurrentProjectId: function () {
      var v = localStorage.getItem('projectId');
      v = v || (isNaN(v) ? v : parseInt(v));
      return v;
    }
  };
}]);
'use strict';

angular.module('web').factory('ramSvs', ['$q', '$state', 'AuthInfo', 'Toast', 'Const', function ($q, $state, AuthInfo, Toast, Const) {

  var AWS = require('aws-sdk');
  return {
    listUsers: listUsers,
    listGroups: listGroups,
    listRoles: listRoles,

    createPolicy: createPolicy,
    getPolicy: getPolicy,
    attachPolicyToRole: attachPolicyToRole,
    attachPolicyToGroup: attachPolicyToGroup,
    attachPolicyToUser: attachPolicyToUser,
    detachPolicyFromUser: detachPolicyFromUser,
    listPoliciesForUser: listPoliciesForUser,

    getUser: getUser,
    createUser: createUser,
    updateUser: updateUser,
    deleteUser: deleteUser,

    createAccessKey: createAccessKey,
    updateAccessKey: updateAccessKey,
    deleteAccessKey: deleteAccessKey,
    listAccessKeys: listAccessKeys
  };

  function listPoliciesForUser(username) {
    var ram = getClient();
    var df = $q.defer();
    ram.listPoliciesForUser({
      UserName: username
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function deleteUser(username) {
    var ram = getClient();
    var df = $q.defer();
    ram.deleteUser({
      UserName: username
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function getUser(username) {
    var ram = getClient();
    var df = $q.defer();
    ram.getUser({
      UserName: username
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function updateUser(item) {
    var ram = getClient();
    var df = $q.defer();
    ram.updateUser(item, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function createUser(opt) {
    if (typeof opt == 'string') {
      opt = {
        UserName: opt
      };
    }

    var ram = getClient();
    var df = $q.defer();

    console.log('createUser:', opt);
    ram.createUser(opt, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function listAccessKeys(username) {
    var ram = getClient();
    var df = $q.defer();
    ram.listAccessKeys({
      UserName: username
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function createAccessKey(username) {
    var ram = getClient();
    var df = $q.defer();
    ram.createAccessKey({
      UserName: username
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }
  function updateAccessKey(username, userAccessKeyId, status) {
    var ram = getClient();
    var df = $q.defer();
    ram.updateAccessKey({
      UserName: username,
      UserAccessKeyId: userAccessKeyId,
      Status: status
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }
  function deleteAccessKey(username, userAccessKeyId) {
    var ram = getClient();
    var df = $q.defer();
    ram.deleteAccessKey({
      UserName: username,
      UserAccessKeyId: userAccessKeyId
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function createPolicy(name, doc, desc) {
    var ram = getClient();
    var df = $q.defer();
    ram.createPolicy({
      PolicyName: name,
      PolicyDocument: doc,
      Description: desc
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function getPolicy(name, type, ignoreError) {
    var ram = getClient();
    var df = $q.defer();
    ram.getPolicy({
      PolicyName: name,
      PolicyType: type
    }, function (err, result) {
      if (err) {
        df.reject(err);
        if (!ignoreError) handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function attachPolicyToUser(policyName, userName) {
    return attachPolicy('attachPolicyToUser', {
      PolicyName: policyName,
      UserName: userName,
      PolicyType: 'Custom'
    });
  }
  function attachPolicyToGroup(policyName, groupName) {
    return attachPolicy('attachPolicyToGroup', {
      PolicyName: policyName,
      GroupName: groupName,
      PolicyType: 'Custom'
    });
  }
  function attachPolicyToRole(policyName, roleName) {
    return attachPolicy('attachPolicyToRole', {
      PolicyName: policyName,
      RoleName: roleName,
      PolicyType: 'Custom'
    });
  }
  function detachPolicyFromUser(policyName, userName) {
    return attachPolicy('detachPolicyFromUser', {
      UserName: userName,
      PolicyName: policyName,
      PolicyType: 'Custom'
    });
  }

  function attachPolicy(callFn, opt) {
    var ram = getClient();
    var df = $q.defer();
    ram[callFn].call(ram, opt, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function listUsers(ignoreError) {
    return listAll('listUsers', 'User', ignoreError);
  }
  function listGroups(ignoreError) {
    return listAll('listGroups', 'Group', ignoreError);
  }
  function listRoles(ignoreError) {
    return listAll('listRoles', 'Role', ignoreError);
  }

  function listAll(callFn, resultKey, ignoreError) {
    var ram = getClient();
    var df = $q.defer();
    var t = [];

    function dig(marker) {
      var opt = { MaxItems: 100 };
      if (marker) opt.Marker = marker;
      ram[callFn].call(ram, opt, function (err, res) {

        if (err) {
          df.reject(err);
          if (!ignoreError) handleError(err);
          return;
        }

        var marker2 = res.Marker;
        t = t.concat(res[resultKey + 's'][resultKey]);
        if (marker2) {
          dig(marker2);
        } else {
          df.resolve(t);
        }
      });
    }
    dig();
    return df.promise;
  }

  function handleError(err) {
    console.error(err);
    if (err.code == 'InvalidAccessKeyId') {
      $state.go('login');
    } else {
      if (!err.code) {
        if (err.message.indexOf('Failed to fetch') != -1) {
          err = { code: 'Error', message: '无法连接' };
        } else err = { code: 'Error', message: err.message };
      } else if (err.message.indexOf('You are not authorized to do this action') != -1) {
        err = { code: 'Error', message: '没有权限, ' + err.message };
      }

      Toast.error(err.code + ': ' + err.message);
    }
  }

  function getClient() {

    var authInfo = AuthInfo.get();
    var ram = new AWS.RAM({
      accessKeyId: authInfo.id,
      secretAccessKey: authInfo.secret,
      endpoint: 'https://ram.aliyuncs.com',
      apiVersion: '2015-05-01'
    });
    return ram;
  }
}]);
'use strict';

angular.module('web').factory('safeApply', [function () {
  return function ($scope, fn) {
    if (!$scope.$root) return;
    var phase = $scope.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn) {
        $scope.$eval(fn);
      }
    } else {
      if (fn) {
        $scope.$apply(fn);
      } else {
        $scope.$apply();
      }
    }
  };
}]);
'use strict';

angular.module('web').factory('settingsSvs', [function () {

  return {
    autoUpgrade: {
      get: function () {
        return parseInt(localStorage.getItem('autoUpgrade') || 0);
      },
      set: function (v) {
        return localStorage.setItem('autoUpgrade', v);
      }
    },
    isCame: {
      get: function () {
        return parseInt(localStorage.getItem('isCame') || 0);
      },
      set: function (v) {
        return localStorage.setItem('isCame', v);
      }
    },
    maxUploadJobCount: {
      get: function () {
        return parseInt(localStorage.getItem('maxUploadJobCount') || 3);
      },
      set: function (v) {
        return localStorage.setItem('maxUploadJobCount', v);
      }
    },

    maxDownloadJobCount: {
      get: function () {
        return parseInt(localStorage.getItem('maxDownloadJobCount') || 3);
      },
      set: function (v) {
        return localStorage.setItem('maxDownloadJobCount', v);
      }
    },

    showImageSnapshot: {
      get: function () {
        return parseInt(localStorage.getItem('showImageSnapshot') || 1);
      },
      set: function (v) {
        return localStorage.setItem('showImageSnapshot', v);
      }
    },

    historiesLength: {
      get: function () {
        return parseInt(localStorage.getItem('historiesLength') || 100);
      },
      set: function (v) {
        return localStorage.setItem('historiesLength', v);
      }
    },
    mailSmtp: {
      get: function () {
        return JSON.parse(localStorage.getItem('mailSender') || '{"port":465}');
      },
      set: function (v) {
        return localStorage.setItem('mailSender', JSON.stringify(v));
      }
    },
    logFile: {
      get: function () {
        return parseInt(localStorage.getItem('logFile') || 0);
      },
      set: function (v) {
        return localStorage.setItem('logFile', v);
      }
    },
    logFileInfo: {
      get: function () {
        return parseInt(localStorage.getItem('logFileInfo') || 0);
      },
      set: function (v) {
        return localStorage.setItem('logFileInfo', v);
      }
    },
    getRequestPayStatus: {
      get: function () {
        return localStorage.getItem('show-request-pay') || 'NO';
      },
      set: function (v) {
        return localStorage.setItem('show-request-pay', v);
      }
    },
    connectTimeout: {
      get: function () {
        return parseInt(localStorage.getItem('connectTimeout') || 60000);
      },
      set: function (v) {
        return localStorage.setItem('connectTimeout', v);
      }
    },
    uploadPartSize: {
      get: function () {
        return parseInt(localStorage.getItem('uploadPartSize') || 10);
      },
      set: function (v) {
        return localStorage.setItem('uploadPartSize', v);
      }
    },
    uploadAndDownloadRetryTimes: {
      get: function () {
        return parseInt(localStorage.getItem('uploadAndDownloadRetryTimes') || 10);
      },
      set: function (v) {
        return localStorage.setItem('uploadAndDownloadRetryTimes', v);
      }
    }
  };
}]);
'use strict';

angular.module('web').factory('stsSvs', ['$q', '$state', 'AuthInfo', 'Toast', 'Const', function ($q, $state, AuthInfo, Toast, Const) {

  var AWS = require('aws-sdk');
  return {
    assumeRole: assumeRole
  };

  /**
  * @param roleArn RoleArn表示的是需要扮演的角色ID，角色的ID可以在 角色管理 > 角色详情 中找到。
                   格式如： "acs:ram::1894189769722283:role/ramtestappreadonly"
  * @param policyStr 表示的是在扮演角色的时候额外加上的一个权限限制。
                   格式如：'{"Version":"1","Statement":[{"Effect":"Allow", "Action":"*", "Resource":"*"}]}'
  * @param seconds  DurationSeconds指的是临时凭证的有效期，单位是s，最小为900，最大为3600。
  */
  function assumeRole(roleArn, policyStr, seconds) {
    var sts = getClient();
    var df = $q.defer();

    // 构造AssumeRole请求
    sts.assumeRole({
      Action: 'AssumeRole',
      // 指定角色Arn
      RoleArn: roleArn,
      //设置Token的附加Policy，可以在获取Token时，通过额外设置一个Policy进一步减小Token的权限；
      Policy: policyStr, //'{"Version":"1","Statement":[{"Effect":"Allow", "Action":"*", "Resource":"*"}]}',
      //设置Token有效期，可选参数，默认3600秒；
      DurationSeconds: seconds || 3600,
      RoleSessionName: 'wos-browser' // RoleSessionName是一个用来标示临时凭证的名称，一般来说建议使用不同的应用程序用户来区分。usr001
    }, function (err, result) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        df.resolve(result);
      }
    });
    return df.promise;
  }

  function handleError(err) {
    if (err.code == 'InvalidAccessKeyId') {
      $state.go('login');
    } else {
      if (!err.code) {
        if (err.message.indexOf('Failed to fetch') != -1) {
          err = { code: 'Error', message: '无法连接' };
        } else err = { code: 'Error', message: err.message };
      } else if (err.message.indexOf('You are not authorized to do this action') != -1) {
        err = { code: 'Error', message: '没有权限, ' + err.message };
      }

      Toast.error(err.code + ': ' + err.message);
    }
  }

  function getClient() {

    var authInfo = AuthInfo.get();
    var ram = new AWS.STS({
      accessKeyId: authInfo.id,
      secretAccessKey: authInfo.secret,
      endpoint: 'https://sts.aliyuncs.com',
      apiVersion: '2015-04-01'
    });
    return ram;
  }
}]);
'use strict';

angular.module('web').factory('subUserAKSvs', ['indexDBSvs', function (indexDBSvs) {
   var DBNAME = 'subUserAkList';
   var DBVERSION = 1;
   var STORENAME = 'subUserAK';
   var INITSTORE = { 'subUserAK': { keyPath: 'AccessKeyId' } };
   return {
      save: save,
      get: get,
      list: list,
      'delete': del
   };

   function list() {
      return indexDBSvs.open(DBNAME, DBVERSION, INITSTORE).then(function (db) {
         return indexDBSvs.list(db, STORENAME);
      });
   }
   function save(data) {
      return indexDBSvs.open(DBNAME, DBVERSION, INITSTORE).then(function (db) {
         return indexDBSvs.update(db, STORENAME, data['AccessKeyId'], data);
      });
   }
   function get(AccessKeyId) {
      return indexDBSvs.open(DBNAME, DBVERSION, INITSTORE).then(function (db) {
         return indexDBSvs.get(db, STORENAME, AccessKeyId);
      });
   }
   function del(AccessKeyId) {
      return indexDBSvs.open(DBNAME, DBVERSION, INITSTORE).then(function (db) {
         return indexDBSvs.delete(db, STORENAME, AccessKeyId);
      });
   }
}]);
'use strict';

angular.module('web').factory('upgradeSvs', [function () {

  var NAME = Global.app.id || 'wos-browser';

  var release_notes_url = Global.release_notes_url;
  var upgrade_url = Global.upgrade_url;
  var gVersion = Global.app.version;

  return {
    load: load,

    compareVersion: compareVersion,
    getReleaseNote: getReleaseNote,
    getLastestReleaseNote: getLastestReleaseNote
  };

  function getReleaseNote(version, fn) {
    $.get('release-notes/' + version + '.md', fn);
  }

  //获取最新releaseNote
  function getLastestReleaseNote(version, fn) {
    // var ind = upgrade_url.lastIndexOf('aliyun/wos-browser');
    // if(ind>0){
    //   var pre = upgrade_url.substring(0, 'aliyun/wos-browser'.length+ind);
    //   $.get(pre + '/master/release-notes/'+version+'.md', fn);
    // }
    if (!release_notes_url) {
      fn('');
      return;
    }
    $.get(release_notes_url + version + '.md', fn);
  }

  function load(fn) {
    if (!upgrade_url) {
      fn({
        currentVersion: Global.app.version,
        isLastVersion: true,
        lastVersion: Global.app.version,
        fileName: '',
        link: ''
      });
      return;
    }

    $.getJSON(upgrade_url, function (data) {

      var isLastVersion = compareVersion(gVersion, data.version) >= 0;
      var lastVersion = data.version;

      var fileName = NAME + '-' + process.platform + '-' + process.arch + '.zip';
      var link = data['package_url'].replace(/(\/*$)/g, '') + '/' + data['version'] + '/' + fileName;
      console.log("download url:", link);

      fn({
        currentVersion: gVersion,
        isLastVersion: isLastVersion,
        lastVersion: lastVersion,
        fileName: fileName,
        link: link
      });
    });
  }

  function compareVersion(curV, lastV) {
    var arr = curV.split('.');
    var arr2 = lastV.split('.');

    var len = Math.max(arr.length, arr2.length);

    for (var i = 0; i < len; i++) {
      var a = parseInt(arr[i]);
      var b = parseInt(arr2[i]);

      if (a > b) {
        return 1;
      } else if (a < b) {
        return -1;
      }
    }
    return 0;
  }

  function getUpgradeFileName() {
    if (process.platform == 'darwin') {
      return NAME + '.dmg';
    } else {
      return NAME + '-' + process.platform + '-' + process.arch + '.zip';
    }

    // if ((navigator.platform == "Win32") || (navigator.platform == "Windows")) {
    //   return NAME + '-'+process.platform+'-'+process.arch+'.zip';
    // } else if ((navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel")) {
    //   return NAME + '.dmg';
    //   //return NAME + '-darwin-x64.zip';
    // } else {
    //   return NAME + '-linux-x64.zip';
    // }
  }
}]);
'use strict';

angular.module('web').factory('utilSvs', ['$timeout', function ($timeout) {

  return {
    leftTime: leftTime
  };

  function leftTime(ms) {
    if (isNaN(ms)) {
      return '';
    }
    if (ms <= 0) return 0;else if (ms < 1000) return ms + 'ms';

    //return moment.duration(ms).humanize();
    var t = [];

    var d = Math.floor(ms / 24 / 3600 / 1000);
    if (d) {
      ms = ms - d * 3600 * 1000 * 24;
      t.push(d + 'D');
    }
    var h = Math.floor(ms / 3600 / 1000);
    if (h) {
      ms = ms - h * 3600 * 1000;
      t.push(h + 'h');
    }
    var m = Math.floor(ms / 60 / 1000);
    if (m) {
      ms = ms - m * 60 * 1000;
      t.push(m + 'm');
    }
    var s = Math.floor(ms / 1000);
    if (s) {
      ms = ms - s * 1000;
      t.push(s + 's');
    }
    //
    //if(ms){
    //  t.push(ms+'ms');
    //}
    return t.join(' ');
  }
}]);
'use strict';

angular.module('web').factory('wosDownloadManager', ['$q', '$state', '$timeout', 'AuthInfo', 'wos', 'Toast', 'Const', 'DelayDone', 'safeApply', 'settingsSvs', function ($q, $state, $timeout, AuthInfo, wos, Toast, Const, DelayDone, safeApply, settingsSvs) {

  var WosStore = require('./node/wosstore');
  var fs = require('fs');
  var path = require('path');
  var os = require('os');

  var stopCreatingFlag = false;

  var concurrency = 0;
  var $scope;
  return {
    init: init,
    createDownloadJobs: createDownloadJobs,
    checkStart: checkStart,
    saveProg: saveProg,

    stopCreatingJobs: function () {
      stopCreatingFlag = true;
    }
  };

  function init(scope) {
    $scope = scope;
    concurrency = 0;
    $scope.lists.downloadJobList = [];
    $scope.retryTimes = 0;
    var arr = loadProg();

    //console.log('----load saving download jobs:' + arr.length);

    var authInfo = AuthInfo.get();

    angular.forEach(arr, function (n) {
      var job = createJob(authInfo, n);
      if (job.status == 'waiting' || job.status == 'running' || job.status == 'verifying') job.stop();
      addEvents(job);
    });
  }

  function addEvents(job) {
    $scope.lists.downloadJobList.push(job);
    $scope.calcTotalProg();
    safeApply($scope);
    checkStart();

    //save
    saveProg();

    job.on('partcomplete', function (prog) {
      safeApply($scope);
      //save
      saveProg($scope);
    });

    job.on('statuschange', function (status, retryTimes) {
      if (status == 'stopped') {
        concurrency--;
        checkStart();
      }

      if (status == 'retrying') {
        $scope.retryTimes = retryTimes;
      }

      safeApply($scope);
      //save
      saveProg();
    });
    job.on('speedChange', function () {
      safeApply($scope);
    });

    job.on('complete', function () {
      concurrency--;
      checkStart();
      //$scope.$emit('needrefreshfilelists');
    });

    job.on('error', function (err) {
      console.error(err);
      concurrency--;
      checkStart();
    });
  }

  //流控, 同时只能有 n 个上传任务.
  function checkStart() {
    var maxConcurrency = settingsSvs.maxDownloadJobCount.get();
    //console.log(concurrency , maxConcurrency);
    concurrency = Math.max(0, concurrency);
    if (concurrency < maxConcurrency) {
      var arr = $scope.lists.downloadJobList;
      for (var i = 0; i < arr.length; i++) {
        if (concurrency >= maxConcurrency) return;

        var n = arr[i];
        if (n.status == 'waiting') {
          n.start();
          concurrency++;
        }
      }
    }
  }

  /**
   * 下载
   * @param fromWosInfos {array}  item={region, bucket, path, name, size=0, isFolder=false}  有可能是目录，需要遍历
   * @param toLocalPath {string}
   * @param jobsAddedFn {Function} 加入列表完成回调方法， jobs列表已经稳定
   */
  function createDownloadJobs(fromWosInfos, toLocalPath, jobsAddedFn) {
    stopCreatingFlag = false;
    //console.log('--------downloadFilesHandler', fromWosInfos, toLocalPath);
    var authInfo = AuthInfo.get();
    var dirPath = path.dirname(fromWosInfos[0].path);

    loop(fromWosInfos, function (jobs) {}, function () {
      if (jobsAddedFn) jobsAddedFn();
    });

    function loop(arr, callFn, callFn2) {
      var t = [];
      var len = arr.length;
      var c = 0;
      var c2 = 0;

      if (len == 0) {
        callFn(t);
        callFn2(t);
        return;
      }

      _kdig();

      function _kdig() {
        dig(arr[c], t, function () {}, function () {
          c2++;
          if (c2 >= len) {
            callFn2(t);
          }
        });
        c++;
        if (c == len) {
          callFn(t);
        } else {

          if (stopCreatingFlag) {
            return;
          }

          $timeout(_kdig, 10);
        }
      }

      // angular.forEach(arr, function (n) {
      //   dig(n, function (jobs) {
      //     t = t.concat(jobs);
      //     c++;
      //     console.log(c,'/',len);
      //     if (c == len) callFn(t);
      //   });
      // });
    }

    function dig(wosInfo, t, callFn, callFn2) {

      if (stopCreatingFlag) {
        return;
      }

      var fileName = path.basename(wosInfo.path);
      var filePath = path.join(toLocalPath, path.relative(dirPath, wosInfo.path));

      if (wosInfo.isFolder) {
        //目录
        fs.mkdir(filePath, function (err) {

          if (err && err.code != 'EEXIST') {
            Toast.error('创建目录[' + filePath + ']失败:' + err.message);
            return;
          }

          //遍历 wos 目录
          function progDig(marker) {
            wos.listFiles(wosInfo.region, wosInfo.bucket, wosInfo.path, marker).then(function (result) {

              var arr2 = result.data;
              arr2.forEach(function (n) {
                n.region = wosInfo.region;
                n.bucket = wosInfo.bucket;
              });
              loop(arr2, function (jobs) {
                t = t.concat(jobs);
                if (result.marker) {
                  $timeout(function () {
                    progDig(result.marker);
                  }, 10);
                } else {
                  if (callFn) callFn();
                }
              }, callFn2);
            });
          }

          progDig();
        });
      } else {
        //文件
        if (process.platform == 'win32') {
          //修复window下，文件名含非法字符需要转义
          if (/[\/\\\:\<\>\?\*\"\|]/.test(fileName)) {
            fileName = encodeURIComponent(fileName);
            filePath = path.join(path.dirname(filePath), encodeURIComponent(path.basename(filePath)));
          }
        }
        var job = createJob(authInfo, {
          region: wosInfo.region,
          from: {
            bucket: wosInfo.bucket,
            key: wosInfo.path
          },
          to: {
            name: fileName,
            path: filePath
          }
        });

        addEvents(job);

        t.push(job);

        if (callFn) callFn();
        if (callFn2) callFn2();
      }
    }
  }

  /**
   * @param  auth {id, secret}
   * @param  opt { region, from, to, ...}
   * @param  opt.from {bucket, key}
   * @param  opt.to   {name, path}
   * @return job  { start(), stop(), status, progress }
   */
  function createJob(auth, opt) {
    var cname = AuthInfo.get().cname || false;

    var endpointname = cname ? auth.eptplcname : auth.eptpl;
    //stsToken
    if (auth.stoken && auth.id.indexOf('STS.') == 0) {
      var store = new WosStore({
        stsToken: {
          Credentials: {
            AccessKeyId: auth.id,
            AccessKeySecret: auth.secret,
            SecurityToken: auth.stoken
          }
        },
        endpoint: wos.getWosEndpoint(opt.region, opt.to.bucket, endpointname),
        cname: cname,
        region: opt.region
      });
    } else {
      var store = new WosStore({
        aliyunCredential: {
          accessKeyId: auth.id,
          secretAccessKey: auth.secret
        },
        endpoint: wos.getWosEndpoint(opt.region, opt.from.bucket, endpointname),
        cname: cname,
        region: opt.region
      });
    }
    return store.createDownloadJob(opt);
  }

  function saveProg() {

    //console.log('request save:', t);
    DelayDone.delayRun('save_download_prog', 1000, function () {

      var t = [];
      angular.forEach($scope.lists.downloadJobList, function (n) {

        if (n.status == 'finished') return;

        t.push({
          checkPoints: n.checkPoints,
          region: n.region,
          to: n.to,
          from: n.from,
          message: n.message,
          status: n.status,
          prog: n.prog
        });
      });
      //console.log('save:', t);

      fs.writeFileSync(getDownProgFilePath(), JSON.stringify(t));
      $scope.calcTotalProg();
    }, 20);
  }

  /**
   * 获取保存的进度
   */
  function loadProg() {
    try {
      var data = fs.readFileSync(getDownProgFilePath());
      return JSON.parse(data ? data.toString() : '[]');
    } catch (e) {}
    return [];
  }

  //下载进度保存路径
  function getDownProgFilePath() {
    var folder = path.join(os.homedir(), '.wos-browser');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    var username = AuthInfo.get().id || '';
    return path.join(folder, 'downprog_' + username + '.json');
  }
}]);
'use strict';

angular.module('web').factory('wosUploadManager', ['$q', '$state', '$timeout', 'wos', 'AuthInfo', 'Toast', 'Const', 'DelayDone', 'safeApply', 'settingsSvs', function ($q, $state, $timeout, wos, AuthInfo, Toast, Const, DelayDone, safeApply, settingsSvs) {

  var WosStore = require('./node/wosstore');
  var fs = require('fs');
  var path = require('path');
  var os = require('os');

  var stopCreatingFlag = false;

  var concurrency = 0;

  var $scope;

  return {
    init: init,
    createUploadJobs: createUploadJobs,
    checkStart: checkStart,
    saveProg: saveProg,

    stopCreatingJobs: function () {
      stopCreatingFlag = true;
    }
  };

  function init(scope) {
    $scope = scope;
    concurrency = 0;
    $scope.lists.uploadJobList = [];
    $scope.retryTimes = 0;

    var arr = loadProg();
    var authInfo = AuthInfo.get();

    angular.forEach(arr, function (n) {
      //console.log(n,'<=====');
      var job = createJob(authInfo, n);
      if (job.status == 'waiting' || job.status == 'running' || job.status == 'verifying' || job.status == 'retrying') job.stop();
      addEvents(job);
    });
  }

  function addEvents(job) {
    $scope.lists.uploadJobList.push(job);
    //$scope.calcTotalProg();
    safeApply($scope);
    checkStart();

    //save
    saveProg();

    job.on('partcomplete', function (prog) {
      safeApply($scope);
      //save
      saveProg();
    });

    job.on('statuschange', function (status, retryTimes) {

      if (status == 'stopped') {
        concurrency--;
        $timeout(checkStart, 100);
      }

      if (status == 'retrying') {
        $scope.retryTimes = retryTimes;
      }

      safeApply($scope);
      //save
      saveProg();
    });
    job.on('speedChange', function () {
      safeApply($scope);
    });

    job.on('complete', function () {
      concurrency--;
      checkStart();
      checkNeedRefreshFileList(job.to.bucket, job.to.key);
      //$scope.$emit('needrefreshfilelists');
    });
    job.on('error', function (err) {
      console.error(err);
      concurrency--;
      checkStart();
    });
  }

  function checkStart() {
    //流控, 同时只能有 n 个上传任务.
    var maxConcurrency = settingsSvs.maxUploadJobCount.get();
    //console.log(concurrency , maxConcurrency);
    concurrency = Math.max(0, concurrency);
    if (concurrency < maxConcurrency) {
      var arr = $scope.lists.uploadJobList;
      for (var i = 0; i < arr.length; i++) {
        if (concurrency >= maxConcurrency) return;

        var n = arr[i];
        if (n.status == 'waiting') {
          n.start();
          concurrency++;
        }
      }
    }
  }

  function checkNeedRefreshFileList(bucket, key) {

    if ($scope.currentInfo.bucket == bucket) {

      var p = path.dirname(key) + '/';
      p = p == './' ? '' : p;

      if ($scope.currentInfo.key == p) {
        $scope.$emit('needrefreshfilelists');
      }
    }
  }

  /**
   * 上传
   * @param filePaths []  {array<string>}  有可能是目录，需要遍历
   * @param bucketInfo {object} {bucket, region, key}
   * @param jobsAddingFn {Function} 快速加入列表回调方法， 返回jobs引用，但是该列表长度还在增长。
   * @param jobsAddedFn {Function} 加入列表完成回调方法， jobs列表已经稳定
   */
  function createUploadJobs(filePaths, bucketInfo, jobsAddingFn) {
    stopCreatingFlag = false;
    //console.log('--------uploadFilesHandler:',  filePaths, bucketInfo);

    var authInfo = AuthInfo.get();

    digArr(filePaths, function () {
      if (jobsAddingFn) jobsAddingFn();
    });
    return;

    function digArr(filePaths, fn) {
      var t = [];
      var len = filePaths.length;
      var c = 0;

      function _dig() {
        var n = filePaths[c];
        var dirPath = path.dirname(n);

        if (stopCreatingFlag) return;

        dig(filePaths[c], dirPath, function (jobs) {
          t = t.concat(jobs);
          c++;

          if (c >= len) {
            fn(t);
          } else {
            _dig();
          }
        });
      }

      _dig();
    }

    function loop(parentPath, dirPath, arr, callFn) {
      var t = [];
      var len = arr.length;
      var c = 0;
      if (len == 0) callFn([]);else inDig();

      //串行
      function inDig() {
        dig(path.join(parentPath, arr[c]), dirPath, function (jobs) {
          t = t.concat(jobs);
          c++;
          //console.log(c,'/',len);
          if (c >= len) callFn(t);else {

            if (stopCreatingFlag) {
              return;
            }

            inDig();
          }
        });
      }
    }

    function dig(absPath, dirPath, callFn) {

      if (stopCreatingFlag) {
        return;
      }

      var fileName = path.basename(absPath);

      var filePath = path.relative(dirPath, absPath);

      if (path.sep != '/') {
        //修复window下 \ 问题
        filePath = filePath.replace(/\\/g, '/');
      }

      //修复window下 \ 问题
      filePath = bucketInfo.key ? bucketInfo.key.replace(/(\/*$)/g, '') + '/' + filePath : filePath;

      if (fs.statSync(absPath).isDirectory()) {
        //创建目录
        wos.createFolder(bucketInfo.region, bucketInfo.bucket, filePath + '/').then(function () {
          //判断是否刷新文件列表
          checkNeedRefreshFileList(bucketInfo.bucket, filePath + '/');
        });

        //递归遍历目录
        // var t = [];
        // var arr = fs.readdirSync(absPath);
        // arr.forEach(function (fname) {
        //   var ret = dig(path.join(absPath, fname), dirPath);
        //   t = t.concat(ret);
        // });

        fs.readdir(absPath, function (err, arr) {

          if (err) {
            console.log(err.stack);
          } else {

            loop(absPath, dirPath, arr, function (jobs) {

              $timeout(function () {
                callFn(jobs);
              }, 1);
            });
          }
        });
      } else {
        //文件
        var job = createJob(authInfo, {
          region: bucketInfo.region,
          from: {
            name: fileName,
            path: absPath
          },
          to: {
            bucket: bucketInfo.bucket,
            key: filePath
          }
        });

        addEvents(job);

        $timeout(function () {
          callFn([job]);
        }, 1);
      }
    }
  }

  /**
   * 创建单个job
   * @param  auth { id, secret}
   * @param  opt   { region, from, to, progress, checkPoints, ...}
   * @param  opt.from {name, path}
   * @param  opt.to   {bucket, key}
   ...
   * @return job  { start(), stop(), status, progress }
   job.events: statuschange, progress
   */
  function createJob(auth, opt) {
    var cname = AuthInfo.get().cname || false;
    var endpointname = cname ? auth.eptplcname : auth.eptpl;

    //stsToken
    if (auth.stoken && auth.id.indexOf('STS.') == 0) {
      var store = new WosStore({
        stsToken: {
          Credentials: {
            AccessKeyId: auth.id,
            AccessKeySecret: auth.secret,
            SecurityToken: auth.stoken
          }
        },
        endpoint: wos.getWosEndpoint(opt.region, opt.to.bucket, endpointname),
        cname: cname,
        region: opt.region
      });
    } else {
      var store = new WosStore({
        aliyunCredential: {
          accessKeyId: auth.id,
          secretAccessKey: auth.secret
        },
        endpoint: wos.getWosEndpoint(opt.region, opt.to.bucket, endpointname),
        cname: cname,
        region: opt.region
      });
    }
    return store.createUploadJob(opt);
    // {
    //   region: opt.region,
    //   from: opt.from,
    //   to: opt.to
    // });
  }

  /**
   * 保存进度
   */
  function saveProg() {
    DelayDone.delayRun('save_upload_prog', 1000, function () {
      var t = [];
      angular.forEach($scope.lists.uploadJobList, function (n) {

        if (n.status == 'finished') return;

        if (n.checkPoints && n.checkPoints.chunks) {
          var checkPoints = angular.copy(n.checkPoints);
          delete checkPoints.chunks;
        }

        t.push({
          crc64Str: n.crc64Str,
          checkPoints: checkPoints,
          region: n.region,
          to: n.to,
          from: n.from,
          status: n.status,
          message: n.message,
          prog: n.prog
        });
      });

      //console.log('request save upload:', t);

      //console.log('-save')
      fs.writeFileSync(getUpProgFilePath(), JSON.stringify(t));
      $scope.calcTotalProg();
    }, 20);
  }

  /**
   * 获取保存的进度
   */
  function loadProg() {
    try {
      var data = fs.readFileSync(getUpProgFilePath());
      return JSON.parse(data ? data.toString() : '[]');
    } catch (e) {}
    return [];
  }

  //上传进度保存路径
  function getUpProgFilePath() {
    var folder = path.join(os.homedir(), '.wos-browser');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    var username = AuthInfo.get().id || '';
    return path.join(folder, 'upprog_' + username + '.json');
  }
}]);
'use strict';

angular.module('web').factory('wos', ['$q', '$rootScope', '$timeout', '$state', 'Toast', 'Const', 'AuthInfo', function ($q, $rootScope, $timeout, $state, Toast, Const, AuthInfo) {
  var NEXT_TICK = 1;

  var DEF_ADDR = 'wos://';
  var AWS = require('aws-sdk');
  var path = require('path');
  var xml2js = require('xml2js');

  return {
    createFolder: createFolder,
    createBucket: createBucket,
    restoreFile: restoreFile,
    loadStorageStatus: loadStorageStatus,

    getMeta: getMeta,
    getFileInfo: getMeta, //head object
    setMeta: setMeta,

    checkFileExists: checkFileExists,
    checkFolderExists: checkFolderExists,

    listAllBuckets: listAllBuckets,

    listAllFiles: listAllFiles,
    listFiles: listFiles,
    getContent: getContent,
    saveContent: saveContent,
    getImageBase64Url: getImageBase64Url,

    //重命名
    moveFile: moveFile,
    //复制，移动
    copyFiles: copyFiles,
    stopCopyFiles: stopCopyFiles,

    //删除
    deleteFiles: deleteFiles,
    stopDeleteFiles: stopDeleteFiles,

    //碎片
    listAllUploads: listAllUploads,
    abortAllUploads: abortAllUploads,

    deleteBucket: deleteBucket,

    getBucketACL: getBucketACL,
    updateBucketACL: updateBucketACL,
    getACL: getACL,
    updateACL: updateACL,

    getClient: getClient,
    parseWOSPath: parseWOSPath,
    getWosEndpoint: getWosEndpoint,
    parseRestoreInfo: parseRestoreInfo,
    signatureUrl: signatureUrl,

    getClient2: getClient2,
    signatureUrl2: signatureUrl2,
    listFilesRegex: listFilesRegex
  };

  function getClient2(opt) {
    var options = prepaireOptions(opt);
    // console.log(options)
    var client = new WOS({
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.secretAccessKey,
      endpoint: options.endpoint,
      bucket: opt.bucket,
      stsToken: options.securityToken,
      cname: options.cname,
      isRequestPay: options.isRequestPayer
    });
    console.log(WOS.version);
    return client;
  }

  function signatureUrl2(region, bucket, key, expires, xprocess) {
    // var client = getClient2({
    //   region: region,
    //   bucket: bucket
    // });
    // return client.signatureUrl(key, {
    //   expires: expires,
    //   process: xprocess
    // });

    var client = getClient({
      region: region,
      bucket: bucket
    });

    var url = client.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expires || 60
    });
    return url;
  }

  function checkFileExists(region, bucket, key) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      var opt = {
        Bucket: bucket,
        Key: key
      };
      client.headObject(opt, function (err, data) {
        if (err) {
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function checkFolderExists(region, bucket, prefix) {
    var df = $q.defer();
    var client = getClient({
      region: region,
      bucket: bucket
    });
    client.listObjects({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 1
    }, function (err, data) {
      if (err) {
        handleError(err);
        df.reject(err);
      } else {
        if (data.Contents.length > 0 && data.Contents[0].Key.indexOf(prefix) == 0) {
          df.resolve(true);
        } else {
          df.resolve(false);
        }
      }
    });
    return df.promise;
  }

  var stopDeleteFilesFlag = false;

  function stopDeleteFiles() {
    stopDeleteFilesFlag = true;
  }

  /**
   * 批量删除文件或目录
   * @param region {string}
   * @param bucket {string}
   * @param items   {array}  item={path,isFolder}
   * @param progCb  {function} 可选， 进度回调  (current,total)
   */
  function deleteFiles(region, bucket, items, progCb) {

    stopDeleteFilesFlag = false;

    var df = $q.defer();

    var client = getClient({
      region: region,
      bucket: bucket
    });
    var progress = {
      current: 0,
      total: 0,
      errorCount: 0
    };

    progress.total += items.length;

    delArr(items, function (terr) {
      if (terr && terr.length > 0) {
        df.resolve(terr);
      } else {
        df.resolve();
      }
    });
    return df.promise;

    function delArr(arr, fn) {
      var c = 0;
      var len = arr.length;
      var terr = [];
      var objectsCount = 0;
      var foldersCount = 0;
      var itemsToDelete = [];
      dig();

      function dig() {
        if (c >= len) {
          if (progCb) progCb(progress);
          $timeout(function () {
            fn(terr);
          }, NEXT_TICK);
          return;
        }

        if (stopDeleteFilesFlag) {
          df.resolve([{
            item: {},
            error: new Error('User cancelled')
          }]);
          return;
        }

        var item = arr[objectsCount + foldersCount];

        if (item.isFolder) {
          foldersCount++;
          listAllFiles(region, bucket, item.path).then(function (arr2) {

            progress.total += arr2.length;
            //删除所有文件
            delArr(arr2, function (terr2) {

              if (stopDeleteFilesFlag) {
                df.resolve([{
                  item: {},
                  error: new Error('User cancelled')
                }]);
                return;
              }

              if (terr2) terr = terr.concat(terr2);
              //删除目录本身
              delFile(item, bucket);
            });
          }, function (err) {
            //删除目录本身
            delFile(item, bucket);
          });
        } else if (itemsToDelete.length < 500 && objectsCount + foldersCount < len) {
          //删除文件
          itemsToDelete.push(item.path);
          objectsCount++;

          if (itemsToDelete.length == 500 || objectsCount != 0 && objectsCount + foldersCount == len) {
            if (itemsToDelete.length > 1) {
              var tempFiles = [];
              for (var i = 0; i < itemsToDelete.length; i++) {
                tempFiles.push({
                  Key: itemsToDelete[i]
                });
              }

              //需要删除的文件集合
              var deleteParams = {
                Bucket: bucket,
                Delete: {
                  Objects: tempFiles,
                  Quiet: false
                }
              };
              //批量删除文件
              client.deleteObjects(deleteParams, function (err, data) {
                if (err) {
                  terr.push({
                    item: item,
                    error: err
                  });
                  progress.errorCount += itemsToDelete.length;
                  c += itemsToDelete.length;
                  itemsToDelete.splice(0, itemsToDelete.length);
                  $timeout(dig, NEXT_TICK);
                } else {
                  c += itemsToDelete.length;
                  progress.current += itemsToDelete.length;
                  itemsToDelete.splice(0, itemsToDelete.length);
                  $timeout(dig, NEXT_TICK);
                }
              });
            } else {
              client.deleteObject({
                Bucket: bucket,
                Key: itemsToDelete[0]
              }, function (err, data) {
                if (err) {
                  terr.push({
                    item: item,
                    error: err
                  });
                  progress.errorCount += itemsToDelete.length;
                  c += itemsToDelete.length;
                  itemsToDelete.splice(0, itemsToDelete.length);
                  $timeout(dig, NEXT_TICK);
                } else {
                  c += itemsToDelete.length;
                  progress.current += itemsToDelete.length;
                  itemsToDelete.splice(0, itemsToDelete.length);
                  $timeout(dig, NEXT_TICK);
                }
              });
            }
          } else {
            $timeout(dig, NEXT_TICK);
          }
        }

        function delFile(item, bucket) {
          if (stopDeleteFilesFlag) {
            df.resolve([{
              item: {},
              error: new Error('User cancelled')
            }]);
            return;
          }

          client.deleteObject({
            Bucket: bucket,
            Key: item.path
          }, function (err, data) {
            if (err) {
              terr.push({
                item: item,
                error: err
              });
              progress.errorCount++;
              c++;
              $timeout(dig, NEXT_TICK);
            } else {
              c++;
              progress.current++;
              $timeout(dig, NEXT_TICK);
            }
          });
        }
      }
    }
  }

  var stopCopyFilesFlag = false;

  function stopCopyFiles() {
    stopCopyFilesFlag = true;
  }

  /**
   * 批量复制或移动文件
   * @param retion {string} 要求相同region
   * @param items {array} 需要被复制的文件列表，可能为folder，可能为file
   * @param target {object} {bucket,key} 目标目录路径
   * @param progFn {Function} 进度回调  {current:1, total: 11, errorCount: 0}
   * @param removeAfterCopy {boolean} 移动flag，复制后删除。 默认false
   * @param renameKey {string} 重命名目录的 key。
   */
  function copyFiles(region, items, target, progFn, removeAfterCopy, renameKey) {

    var progress = {
      total: 0,
      current: 0,
      errorCount: 0
    };
    stopCopyFilesFlag = false;

    //入口
    var df = $q.defer();
    digArr(items, target, renameKey, function (terr) {
      df.resolve(terr);
    });
    return df.promise;

    //copy wos file
    function copyWosFile(client, from, to, fn) {

      var toKey = to.key;
      var fromKey = '/' + from.bucket + '/' + encodeURIComponent(from.key);
      console.info(removeAfterCopy ? 'move' : 'copy', '::', from.bucket + '/' + from.key, '==>', to.bucket + '/' + toKey);

      client.copyObject({
        Bucket: to.bucket,
        Key: toKey,
        CopySource: fromKey
      }, function (err) {

        if (err) {
          fn(err);
          return;
        }

        if (removeAfterCopy) {
          var client2 = getClient({
            region: region,
            bucket: from.bucket
          });
          client2.deleteObject({
            Bucket: from.bucket,
            Key: from.key
          }, function (err) {
            if (err) fn(err);else fn();
          });
        } else {
          fn();
        }
      });
    }

    //打平，一条一条 copy
    function doCopyWosFiles(bucket, pkey, arr, target, fn) {
      var len = arr.length;
      var c = 0;
      var t = [];

      progress.total += len;

      var client = getClient({
        region: region,
        bucket: target.bucket
      });

      function _dig() {
        if (c >= len) {
          $timeout(function () {
            fn(t);
          }, NEXT_TICK);
          return;
        }

        if (stopCopyFilesFlag) {
          df.resolve([{
            item: {},
            error: new Error('User cancelled')
          }]);
          return;
        }

        var item = arr[c];
        var toKey = target.key.replace(/\/$/, '');
        toKey = (toKey ? toKey + '/' : '') + item.path.substring(pkey.length);

        copyWosFile(client, {
          bucket: bucket,
          key: item.path
        }, {
          bucket: target.bucket,
          key: toKey
        }, function (err) {
          if (err) {
            progress.errorCount++;
            if (progFn) try {
              progFn(progress);
            } catch (e) {}
            t.push({
              item: item,
              error: err
            });
          }
          progress.current++;
          if (progFn) try {
            progFn(progress);
          } catch (e) {}
          c++;

          //fix ubuntu
          $timeout(_dig, NEXT_TICK);
        });
      }

      _dig();
    }

    function doCopyFolder(source, target, fn) {
      var t = [];
      var client = getClient({
        region: region,
        bucket: source.bucket
      });

      nextList();

      function nextList(marker) {
        var opt = {
          Bucket: source.bucket,
          Prefix: source.path
        };
        if (marker) opt.Marker = marker;

        client.listObjects(opt, function (err, result) {

          if (err) {
            t.push({
              item: source,
              error: err
            });
            $timeout(function () {
              fn(t);
            }, NEXT_TICK);
            return;
          }
          var newTarget = {
            key: target.key,
            bucket: target.bucket
          };

          var prefix = opt.Prefix;
          if (!prefix.endsWith('/')) {
            prefix = prefix.substring(0, prefix.lastIndexOf('/') + 1);
          }

          var objs = [];
          result['Contents'].forEach(function (n) {
            n.Prefix = n.Prefix || '';

            //if (!opt.Prefix.endsWith('/') || n.Key != opt.Prefix) {
            n.isFile = true;
            n.itemType = 'file';
            n.path = n.Key;
            n.name = n.Key.substring(prefix.length);
            n.size = n.Size;
            n.storageClass = n.StorageClass;
            n.type = n.Type;
            n.lastModified = n.LastModified;
            n.url = getWosUrl(region, opt.Bucket, n.Key);

            objs.push(n);
            //}
          });

          doCopyWosFiles(source.bucket, source.path, objs, newTarget, function (terr) {

            if (stopCopyFilesFlag) {
              df.resolve([{
                item: {},
                error: new Error('User cancelled')
              }]);
              return;
            }

            if (terr) t = t.concat(terr);
            if (result.NextMarker) {
              $timeout(function () {
                nextList(result.NextMarker);
              }, NEXT_TICK);
            } else {
              if (removeAfterCopy && terr.length == 0) {
                //移动全部成功， 删除目录
                client.deleteObject({
                  Bucket: source.bucket,
                  Key: source.path
                }, function (err) {
                  $timeout(function () {
                    fn(t);
                  }, NEXT_TICK);
                });
              } else {
                $timeout(function () {
                  fn(t);
                }, NEXT_TICK);
              }
            }
          });
        });
      }
    }

    function doCopyFile(source, target, fn) {
      var client = getClient({
        region: region,
        bucket: target.bucket
      });
      copyWosFile(client, {
        bucket: source.bucket,
        key: source.path
      }, {
        bucket: target.bucket,
        key: target.key
      }, function (err) {
        if (err) {
          fn(err);
        } else {
          fn();
        }
      });
    }

    function digArr(items, target, renameKey, fn) {
      var len = items.length;
      var c = 0;
      var terr = [];

      progress.total += len;
      if (progFn) try {
        progFn(progress);
      } catch (e) {}

      function _() {

        if (c >= len) {
          fn(terr);
          return;
        }

        if (stopCopyFilesFlag) {
          df.resolve([{
            item: {},
            error: new Error('User cancelled')
          }]);
          return;
        }

        var item = items[c];
        var toKey = renameKey;

        if (!renameKey) {
          toKey = target.key.replace(/\/$/, '');
          toKey = (toKey ? toKey + '/' : '') + items[c].name;
        }

        var newTarget = {
          key: toKey, //target.key.replace(/\/$/,'')+'/'+items[c].name,
          bucket: target.bucket
        };
        c++;

        if (item.isFile) {
          doCopyFile(item, newTarget, function (err) {
            if (err) {
              progress.errorCount++;
              if (progFn) try {
                progFn(progress);
              } catch (e) {}
              terr.push({
                item: item,
                error: err
              });
            }
            progress.current++;
            if (progFn) try {
              progFn(progress);
            } catch (e) {}
            $timeout(_, NEXT_TICK);
          });
        } else {
          doCopyFolder(item, newTarget, function (errs) {
            if (errs) {
              terr = terr.concat(errs);
            }
            progress.current++;
            if (progFn) try {
              progFn(progress);
            } catch (e) {}
            $timeout(_, NEXT_TICK);
          });
        }
      }

      _();
    }
  }

  //移动文件，重命名文件
  function moveFile(region, bucket, oldKey, newKey, isCopy) {
    var df = $q.defer();
    var client = getClient({
      region: region,
      bucket: bucket
    });
    client.copyObject({
      Bucket: bucket,
      Key: newKey,
      CopySource: '/' + bucket + '/' + encodeURIComponent(oldKey),
      MetadataDirective: 'COPY' // 'REPLACE' 表示覆盖 meta 信息，'COPY' 表示不覆盖，只拷贝,
    }, function (err) {
      if (err) {
        df.reject(err);
        handleError(err);
      } else {
        if (isCopy) {
          df.resolve();
        } else {
          client.deleteObject({
            Bucket: bucket,
            Key: oldKey
          }, function (err) {
            if (err) {
              df.reject(err);
              handleError(err);
            } else df.resolve();
          });
        }
      }
    });
    return df.promise;
  }

  /**************************************/

  function listAllUploads(region, bucket) {
    var maxUploads = 100;
    var client = getClient({
      region: region,
      bucket: bucket
    });
    var t = [];
    var df = $q.defer();

    function dig(opt) {
      opt = angular.extend({
        Bucket: bucket,
        Prefix: '',
        'MaxUploads': maxUploads
      }, opt);
      client.listMultipartUploads(opt, function (err, result) {
        if (err) {
          df.reject(err);
          return;
        }

        angular.forEach(result.Uploads, function (n) {
          n.initiated = n.Initiated;
          n.name = n.Key;
          n.storageClass = n.StorageClass;
          n.uploadId = n.UploadId;
        });

        t = t.concat(result.Uploads);

        if (result.Uploads.length == maxUploads) {
          $timeout(function () {
            dig({
              'KeyMarker': result.NextKeyMarker,
              'UploadIdMarker': result.NextUploadIdMarker
            });
          }, NEXT_TICK);
        } else {
          df.resolve(t);
        }
      });
    }

    dig({});
    return df.promise;
  }

  function abortAllUploads(region, bucket, uploads) {
    var df = $q.defer();
    var client = getClient({
      region: region,
      bucket: bucket
    });
    var len = uploads.length;
    var c = 0;

    function dig() {
      if (c >= len) {
        df.resolve();
        return;
      }
      client.abortMultipartUpload({
        Bucket: bucket,
        Key: uploads[c].name,
        UploadId: uploads[c].uploadId
      }, function (err, result) {
        if (err) df.reject(err);else {
          c++;
          $timeout(dig, NEXT_TICK);
        }
      });
    }

    dig();
    return df.promise;
  }

  function createFolder(region, bucket, prefix) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      client.putObject({
        Bucket: bucket,
        Key: prefix,
        Body: ''
      }, function (err, data) {
        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function deleteBucket(region, bucket) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      client.deleteBucket({
        Bucket: bucket
      }, function (err, data) {
        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function signatureUrl(region, bucket, key, expiresSec) {
    var client = getClient({
      region: region,
      bucket: bucket
    });

    var url = client.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expiresSec || 60
    });
    return url;
  }

  function getBucketACL(region, bucket) {
    var df = $q.defer();
    var client = getClient({
      region: region,
      bucket: bucket
    });
    client.getBucketAcl({
      Bucket: bucket
    }, function (err, data) {
      if (err) {
        handleError(err);
        df.reject(err);
      } else {
        if (data.Grants && data.Grants.length == 1) {
          var t = [];
          for (var k in data.Grants[0]) {
            t.push(data.Grants[0][k]);
          }
          data.acl = t.join('');
        } else {
          data.acl = 'default';
        }
        df.resolve(data);
      }
    });
    return df.promise;
  }

  function updateBucketACL(region, bucket, acl) {
    var df = $q.defer();
    var client = getClient({
      region: region,
      bucket: bucket
    });
    client.putBucketAcl({
      Bucket: bucket,
      ACL: acl
    }, function (err, data) {
      if (err) {
        handleError(err);
        df.reject(err);
      } else {
        df.resolve(data);
      }
    });
    return df.promise;
  }

  function getACL(region, bucket, key) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      client.getObjectAcl({
        Bucket: bucket,
        Key: key
      }, function (err, data) {
        if (err) {
          handleError(err);
          b(err);
        } else {
          if (data.Grants && data.Grants.length == 1) {
            var t = [];
            for (var k in data.Grants[0]) {
              t.push(data.Grants[0][k]);
            }
            data.acl = t.join('');
          } else {
            data.acl = 'default';
          }
          a(data);
        }
      });
    });
  }

  function updateACL(region, bucket, key, acl) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      client.putObjectAcl({
        Bucket: bucket,
        Key: key,
        ACL: acl
      }, function (err, data) {
        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function getImageBase64Url(region, bucket, key) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      client.getObject({
        Bucket: bucket,
        Key: key
      }, function (err, data) {
        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function getContent(region, bucket, key) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      client.getObject({
        Bucket: bucket,
        Key: key,
        ResponseCacheControl: 'No-cache'
      }, function (err, data) {
        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function saveContent(region, bucket, key, content) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });

      client.headObject({
        Bucket: bucket,
        Key: key
      }, function (err, result) {

        if (err) {
          handleError(err);
          b(err);
        } else {

          client.putObject({
            Bucket: bucket,
            Key: key,
            Body: content,

            //保留http头
            'ContentLanguage': result.ContentLanguage,
            'ContentType': result.ContentType,
            'CacheControl': result.CacheControl,
            'ContentDisposition': result.ContentDisposition,
            'ContentEncoding': '',
            'Expires': result.Expires,
            'Metadata': result.Metadata
          }, function (err) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              a();
            }
          });
        }
      });
    });
  }

  function createBucket(region, bucket, acl, storageClass) {

    return new Promise(function (a, b) {
      var client = getClient({
        region: 'default',
        bucket: bucket
      });
      client.createBucket({
        Bucket: bucket
        // CreateBucketConfiguration: {
        //   StorageClass: storageClass
        // }
      }, function (err, data) {
        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
          // client.putBucketAcl({
          //   Bucket: bucket,
          //   ACL: acl
          // }, function (err, data) {
          //   if (err) {
          //     handleError(err);
          //     b(err);
          //   } else {
          //     a(data);
          //   }
          // });
        }
      });
    });
  }

  function getMeta(region, bucket, key) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      var opt = {
        Bucket: bucket,
        Key: key
      };
      client.headObject(opt, function (err, data) {

        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function setMeta(region, bucket, key, headers, metas) {
    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      var opt = {
        Bucket: bucket,
        Key: key,
        CopySource: '/' + bucket + '/' + encodeURIComponent(key),
        MetadataDirective: 'REPLACE', //覆盖meta

        Metadata: metas || {},

        ContentType: headers['ContentType'],
        CacheControl: headers['CacheControl'],
        ContentDisposition: headers['ContentDisposition'],
        ContentEncoding: headers['ContentEncoding'],
        ContentLanguage: headers['ContentLanguage'],
        Expires: headers['Expires']
      };
      client.copyObject(opt, function (err, data) {

        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function restoreFile(region, bucket, key, days) {

    return new Promise(function (a, b) {
      var client = getClient({
        region: region,
        bucket: bucket
      });
      var opt = {
        Bucket: bucket,
        Key: key,
        RestoreRequest: {
          Days: days || 7
        }
      };

      client.restoreObject(opt, function (err, data) {
        if (err) {
          handleError(err);
          b(err);
        } else {
          a(data);
        }
      });
    });
  }

  function listFiles(region, bucket, key, marker) {
    return new Promise(function (a, b) {
      _listFilesOrigion(region, bucket, key, marker).then(function (result) {
        var arr = result.data;
        if (arr && arr.length) {
          $timeout(() => {
            loadStorageStatus(region, bucket, arr);
          }, NEXT_TICK);
        }
        a(result);
      }, function (err) {
        b(err);
      });
    });
  }

  function listFilesRegex(region, bucket, key, marker) {
    return new Promise(function (a, b) {
      _listFilesOrigion2(region, bucket, key, marker).then(function (result) {
        var arr = result.data;
        if (arr && arr.length) {
          $timeout(() => {
            loadStorageStatus(region, bucket, arr);
          }, NEXT_TICK);
        }
        a(result);
      }, function (err) {
        b(err);
      });
    });
  }

  function loadStorageStatus(region, bucket, arr) {
    return new Promise(function (a, b) {
      var len = arr.length;
      var c = 0;
      _dig();

      function _dig() {
        if (c >= len) {
          a();
          return;
        }
        var item = arr[c];
        c++;

        if (!item.isFile || item.storageClass != 'Archive') {
          $timeout(_dig, NEXT_TICK);
          return;
        }

        getMeta(region, bucket, item.path).then(function (data) {
          if (data.Restore) {
            var info = parseRestoreInfo(data.Restore);
            if (info['ongoing-request'] == 'true') {
              item.storageStatus = 2; // '归档文件正在恢复中，请耐心等待...';
            } else {
              item.expired_time = info['expiry-date'];
              item.storageStatus = 3; // '归档文件，已恢复，可读截止时间
            }
          } else {
            item.storageStatus = 1;
          }
          $timeout(_dig, NEXT_TICK);
        }, function (err) {
          b(err);
          $timeout(_dig, NEXT_TICK);
        });
      }
    });
  }

  function _listFilesOrigion(region, bucket, key, marker) {

    return new Promise(function (resolve, reject) {
      var client = getClient({
        region: region,
        bucket: bucket
      });

      var t = [];
      var t_pre = [];
      var opt = {
        Bucket: bucket,
        Prefix: key,
        Delimiter: '/',
        Marker: marker || ''
      };

      client.listObjects(opt, function (err, result) {

        if (err) {
          handleError(err);
          reject(err);
          return;
        }

        var prefix = opt.Prefix;
        if (!prefix.endsWith('/')) {
          prefix = prefix.substring(0, prefix.lastIndexOf('/') + 1);
        }

        if (result.CommonPrefixes) {
          //目录
          result.CommonPrefixes.forEach(function (n) {
            n = n.Prefix;
            t_pre.push({
              name: n.substring(prefix.length).replace(/(\/$)/, ''),
              path: n,
              //size: 0,
              isFolder: true,
              itemType: 'folder'
            });
          });
        }

        if (result['Contents']) {
          //文件
          result['Contents'].forEach(function (n) {
            n.Prefix = n.Prefix || '';

            if (!opt.Prefix.endsWith('/') || n.Key != opt.Prefix) {
              n.isFile = true;
              n.itemType = 'file';
              n.path = n.Key;
              n.name = n.Key.substring(prefix.length);
              n.size = n.Size;
              n.storageClass = n.StorageClass;
              n.type = n.Type;
              n.lastModified = n.LastModified;
              n.url = getWosUrl(region, opt.Bucket, encodeURIComponent(n.Key).replace(/%2F/g, '/'));

              t.push(n);
            }
          });
        }

        resolve({
          data: t_pre.concat(t),
          marker: result.NextMarker
        });
      });
    });
  }

  function _listFilesOrigion2(region, bucket, key, marker) {

    return new Promise(function (resolve, reject) {
      var client = getClient({
        region: region,
        bucket: bucket
      });

      var t = [];
      var t_pre = [];
      var opt = {
        Bucket: bucket,
        Prefix: key,
        Delimiter: '',
        Marker: marker || '',
        MaxKeys: 1000
      };

      client.listObjects(opt, function (err, result) {

        if (err) {
          handleError(err);
          reject(err);
          return;
        }

        var prefix = opt.Prefix;
        if (!prefix.endsWith('/')) {
          prefix = prefix.substring(0, prefix.lastIndexOf('/') + 1);
        }

        if (result['Contents']) {
          //文件
          result['Contents'].forEach(function (n) {
            n.Prefix = n.Prefix || '';

            if (!opt.Prefix.endsWith('/') || n.Key != opt.Prefix) {
              n.isFile = true;
              n.itemType = 'file';
              n.path = n.Key;
              n.name = n.Key.substring(prefix.length);
              n.size = n.Size;
              n.storageClass = n.StorageClass;
              n.type = n.Type;
              n.lastModified = n.LastModified;

              t.push(n);
            }
          });
        }

        resolve({
          data: t_pre.concat(t),
          marker: result.NextMarker,
          isTruncated: result.IsTruncated
        });
      });
    });
  }

  //同一时间只能有一个查询，上一个查询如果没有完成，则会被abort
  var keepListFilesJob;

  function listAllFiles(region, bucket, key, folderOnly) {

    // if (keepListFilesJob) {
    //   keepListFilesJob.abort();
    //   keepListFilesJob = null;
    // }

    return new Promise(function (a, b) {
      keepListFilesJob = new DeepListJob(region, bucket, key, folderOnly, function (data) {
        a(data);
      }, function (err) {
        handleError(err);
        b(err);
      });
    });
  }

  function DeepListJob(region, bucket, key, folderOnly, succFn, errFn) {
    var stopFlag = false;

    var client = getClient({
      region: region,
      bucket: bucket
    });

    var t = [];
    var t_pre = [];
    var opt = {
      Bucket: bucket,
      Prefix: key,
      Delimiter: '/'
    };
    _dig();

    function _dig() {
      if (stopFlag) return;
      client.listObjects(opt, function (err, result) {
        if (stopFlag) return;
        if (err) {
          errFn(err);
          return;
        }

        var prefix = opt.Prefix;
        if (!prefix.endsWith('/')) {
          prefix = prefix.substring(0, prefix.lastIndexOf('/') + 1);
        }

        if (result.CommonPrefixes) {
          //目录
          result.CommonPrefixes.forEach(function (n) {
            n = n.Prefix;
            t_pre.push({
              name: n.substring(prefix.length).replace(/(\/$)/, ''),
              path: n,
              //size: 0,
              isFolder: true,
              itemType: 'folder'
            });
          });
        }

        if (!folderOnly && result['Contents']) {
          //文件
          result['Contents'].forEach(function (n) {
            n.Prefix = n.Prefix || '';

            if (!opt.Prefix.endsWith('/') || n.Key != opt.Prefix) {
              n.isFile = true;
              n.itemType = 'file';
              n.path = n.Key;
              n.name = n.Key.substring(prefix.length);
              n.size = n.Size;
              n.storageClass = n.StorageClass;
              n.type = n.Type;
              n.lastModified = n.LastModified;
              n.url = getWosUrl(region, opt.Bucket, n.Key);

              t.push(n);
            }
          });
        }

        if (result.NextMarker) {
          opt.Marker = result.NextMarker;
          $timeout(_dig, NEXT_TICK);
        } else {
          if (stopFlag) return;
          succFn(t_pre.concat(t));
        }
      });
    }

    //////////////////////////
    this.abort = function () {
      stopFlag = true;
    };
  }

  function listAllBuckets() {
    return new Promise(function (resolve, reject) {
      var client = getClient();

      var t = [];

      var opt = {};
      _dig();

      function _dig() {
        //opt.MaxKeys=50
        client.listBuckets(opt, function (err, result) {
          //console.log(opt, err, result)
          if (err) {
            handleError(err);
            reject(err);
            return;
          }

          // 从原始的response从获取数据
          var bodyStr = String.prototype.slice.call(this.httpResponse.body, 0);

          // 解析原始的response
          var xmlParser = new xml2js.Parser();
          let responseBuckets;
          xmlParser.parseString(bodyStr, function (err, result) {
            if (result && result.ListAllMyBucketsResult && result.ListAllMyBucketsResult.Buckets) {
              responseBuckets = JSON.parse(JSON.stringify(result.ListAllMyBucketsResult.Buckets[0].Bucket));
            }
          });

          //bucket
          if (result['Buckets']) {
            for (var i in result['Buckets']) {
              result['Buckets'][i].creationDate = result['Buckets'][i].CreationDate;
              result['Buckets'][i].name = result['Buckets'][i].Name;
              result['Buckets'][i].isBucket = true;
              result['Buckets'][i].itemType = 'bucket';

              // 设置endpoint 和 region
              result['Buckets'][i].endpoint = responseBuckets && responseBuckets[i].Endpoint ? responseBuckets[i].Endpoint[0] : '';
              result['Buckets'][i].region = responseBuckets && responseBuckets[i].Region ? responseBuckets[i].Region[0] : '';

              // 测试环境带端口
              if (result['Buckets'][i].region == 'region99') {
                result['Buckets'][i].endpoint = result['Buckets'][i].endpoint + ":99";
              } else if (result['Buckets'][i].region == 'region97') {
                result['Buckets'][i].endpoint = result['Buckets'][i].endpoint + ":97";
              }
            }
            // result['Buckets'].forEach(function (n) {
            //   n.creationDate = n.CreationDate;
            //   n.region = n.Region;
            //   n.name = n.Name;
            //   // n.extranetEndpoint = n.ExtranetEndpoint;
            //   // n.intranetEndpoint = n.IntranetEndpoint;
            //   n.endpoint = n.Endpoint;
            //   n.storageClass = n.StorageClass;
            //   n.lastModified = n.LastModified;
            //
            //   n.isBucket = true;
            //   n.itemType = 'bucket';
            // });
            t = t.concat(result['Buckets']);
          }
          // resolve(t);
          // console.log(result)

          if (result.NextMarker) {
            opt.Marker = result.NextMarker;
            $timeout(_dig, NEXT_TICK);
          } else {
            resolve(t);
          }
        });
      }
    });
  }

  function parseRestoreInfo(s) {
    //"ongoing-request="true"
    var arr = s.match(/([\w\-]+)=\"([^\"]+)\"/g);
    var m = {};
    angular.forEach(arr, function (n) {
      var kv = n.match(/([\w\-]+)=\"([^\"]+)\"/);
      m[kv[1]] = kv[2];
    });
    return m;
  }

  function handleError(err) {
    if (err.code == 'InvalidAccessKeyId') {
      $state.go('login');
    } else {

      if (!err.code) {
        if (err.message.indexOf('Failed to fetch') != -1) {
          err = {
            code: 'Error',
            message: '无法连接'
          };
        } else err = {
          code: 'Error',
          message: err.message
        };
      }
      if (err.code == 'NetworkingError' && err.message.indexOf('ENOTFOUND') != -1) {
        console.error(err);
      } else Toast.error(err.code + ': ' + err.message);
    }
  }

  /**
   * @param opt   {object|string}
   *    object = {id, secret, region, bucket}
   */
  function getClient(opt) {

    var options = prepaireOptions(opt);

    // var client = new ALY.WOS(options);

    AWS.config.update({ accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey, endpoint: options.endpoint, region: options.region });
    var client = new AWS.S3({ apiVersion: '2006-03-01', customUserAgent: 'wos-browser-win32-x64-v1.0.0', s3DisableBodySigning: false });
    return client;
  }

  function prepaireOptions(opt) {
    var authInfo = AuthInfo.get();

    var bucket;
    if (opt) {
      if (typeof opt == 'object') {
        angular.extend(authInfo, opt);
        bucket = opt.bucket;
      }
    }
    var endpointname = authInfo.cname ? authInfo.eptplcname : authInfo.eptpl;
    var endpoint = getWosEndpoint(authInfo.region || 's3-cn-east-1', bucket, endpointname);
    console.log("[endpoint]:", endpoint);
    var options = {
      //region: authInfo.region,
      accessKeyId: authInfo.id || 'a',
      secretAccessKey: authInfo.secret || 'a',
      endpoint: endpoint,
      apiVersion: '2013-10-15',
      httpOptions: {
        timeout: authInfo.httpOptions ? authInfo.httpOptions.timeout : 0
      },
      maxRetries: 50,
      cname: authInfo.cname || false,
      isRequestPayer: authInfo.requestpaystatus == 'NO' ? false : true
    };

    if (authInfo.id && authInfo.id.indexOf('STS.') == 0) {
      options.securityToken = authInfo.stoken || null;
    }
    options.region = opt && opt.region ? opt.region : authInfo && authInfo.region ? authInfo.region : "";
    return options;
  }

  function parseWOSPath(wosPath) {
    if (!wosPath || wosPath.indexOf(DEF_ADDR) == -1 || wosPath == DEF_ADDR) {
      return {};
    }

    var str = wosPath.substring(DEF_ADDR.length);
    var ind = str.indexOf('/');
    if (ind == -1) {
      var bucket = str;
      var key = '';
    } else {
      var bucket = str.substring(0, ind);
      var key = str.substring(ind + 1);
    }
    return {
      bucket: bucket,
      key: key
    };
  }

  function getWosUrl(region, bucket, key) {

    var eptpl = AuthInfo.get().eptpl || 'http://{region}.wcsapi.com';

    var protocol = eptpl.indexOf('https:') == 0 ? 'https:' : "http:"; // Global.wosEndpointProtocol == 'https:';

    if (bucket && $rootScope.bucketMap && $rootScope.bucketMap[bucket]) {
      // var endpoint = $rootScope.bucketMap[bucket][$rootScope.internalSupported ? 'intranetEndpoint' : 'extranetEndpoint'];
      var endpoint = $rootScope.bucketMap[bucket]['endpoint'];

      if (endpoint) {
        //return 'http://'+ endpoint + '/' + key;
        return protocol + '//' + bucket + '.' + endpoint + '/' + key;
        //return isHttps ? (protocol+'//'+ bucket+'.'+ endpoint  +'/' + key) : ('http://'+ endpoint + '/' + key);
      }
    }

    //region是domain
    if (region) {
      if (region.indexOf('.') != -1) {
        if (region.indexOf('http') == -1) {
          region = protocol + '//' + bucket + '.' + region + '/' + key;
        }
        return region;
      }
      return protocol + '//' + bucket + '.' + region + '.wcsapi.com' + '/' + key;
    } else {
      if (eptpl.indexOf('https://') == 0) {
        var domain = eptpl.substring(8, eptpl.length);
        domain.replace(/\/$/, '');
        return protocol + '//' + bucket + '.' + domain + '/' + key;
      } else if (eptpl.indexOf('http://') == 0) {
        var domain = eptpl.substring(7, eptpl.length);
        domain.replace(/\/$/, '');
        return protocol + '//' + bucket + '.' + domain + '/' + key;
      }
      return protocol + '//' + bucket + '.' + region + '.wcsapi.com' + '/' + key;
    }
  }

  function getWosEndpoint(region, bucket, eptpl) {

    eptpl = eptpl || AuthInfo.get().eptpl || 'http://{region}.wcsapi.com';
    //通过bucket获取endpoint
    if (bucket && $rootScope.bucketMap && $rootScope.bucketMap[bucket]) {
      // var endpoint = $rootScope.bucketMap[bucket][$rootScope.internalSupported ? 'intranetEndpoint' : 'extranetEndpoint'];
      var endpoint = $rootScope.bucketMap[bucket]['endpoint'];
      if (endpoint) return eptpl.indexOf('https://') == 0 ? 'https://' + endpoint : 'http://' + endpoint;
    }
    eptpl = eptpl.replace('{region}', region);

    return eptpl;

    //
    // //region是domain
    // if (region && region.indexOf('.') != -1) {
    //   if (region.indexOf('http') != 0) {
    //     region = Global.wosEndpointProtocol == 'https:' ? ('https://' + region + ':443') : ('http://' + region);
    //   }
    //   return region;
    // }
    //
    // //region
    // if (Global.wosEndpointProtocol == 'https:') {
    //   return $rootScope.internalSupported
    //       ?'https://' + region + '-internal.wcsapi.com:443'
    //       :'https://' + region + '.wcsapi.com:443';
    // }
    // return $rootScope.internalSupported
    //       ? 'http://' + region + '-internal.wcsapi.com'
    //       : 'http://' + region + '.wcsapi.com';
  }
}]);
'use strict';

angular.module('web').controller('topCtrl', ['$scope', '$rootScope', '$uibModal', '$location', '$translate', '$timeout', 'Dialog', 'Auth', 'Const', 'AuthInfo', 'settingsSvs', 'autoUpgradeSvs', 'safeApply', function ($scope, $rootScope, $modal, $location, $translate, $timeout, Dialog, Auth, Const, AuthInfo, settingsSvs, autoUpgradeSvs, safeApply) {

  var fs = require('fs');
  var path = require('path');
  var T = $translate.instant;

  angular.extend($scope, {
    logout: logout,
    showFavList: showFavList,
    showAbout: showAbout,
    showReleaseNote: showReleaseNote,
    click10: click10
  });

  var ctime = 0;
  var tid;
  function click10() {
    ctime++;
    if (ctime > 10) {
      console.log('---open dev tool---');
      openDevTools();
    }
    $timeout.cancel(tid);
    tid = $timeout(function () {
      ctime = 0;
    }, 600);
  }

  $rootScope.app = {};
  angular.extend($rootScope.app, Global.app);

  //$scope.aid = AuthInfo.get().id;
  $scope.authInfo = AuthInfo.get();
  $scope.authInfo.expirationStr = moment(new Date($scope.authInfo.expiration)).format('YYYY-MM-DD HH:mm:ss');

  $scope.$watch('upgradeInfo.isLastVersion', function (v) {
    if (false === v) {
      if (1 == settingsSvs.autoUpgrade.get()) autoUpgradeSvs.start();else $scope.showAbout();

      if (!$scope.upgradeInfo.files) {
        $scope.showAbout();
      }
    }
  });
  $scope.$watch('upgradeInfo.upgradeJob.status', function (s) {
    if ('failed' == s || 'finished' == s) {
      $scope.showAbout();
    }
  });

  $rootScope.showSettings = function (fn) {
    $modal.open({
      templateUrl: 'main/modals/settings.html',
      controller: 'settingsCtrl',
      resolve: {
        callback: function () {
          return fn;
        }
      }
    });
  };

  function logout() {
    var title = T('logout');
    var message = T('logout.message');
    Dialog.confirm(title, message, function (b) {
      if (b) {
        Auth.logout().then(function () {
          $location.url('/login');
        });
      }
    }, 1);
  }

  function showReleaseNote() {
    var converter = new showdown.Converter();

    var url = autoUpgradeSvs.compareVersion(Global.app.version, '1.0.0') <= 0 ? path.join(__dirname, 'release-notes', Global.app.version + '.md') : path.join(__dirname, 'release-notes', Global.app.version + '.' + $scope.langSettings.lang + '.md');

    fs.readFile(url, function (err, text) {
      if (err) {
        console.error(err);
        return;
      }
      text = text + '';
      var html = converter.makeHtml(text);
      var message = T('main.upgration'); //'主要更新'
      Dialog.alert(message, html, function () {}, { size: 'lg' });
    });
  }

  function showFavList() {
    $modal.open({
      templateUrl: 'main/modals/fav-list.html',
      controller: 'favListCtrl',
      size: 'lg'
    });
  }

  function showAbout() {
    $modal.open({
      templateUrl: 'main/modals/about.html',
      controller: 'aboutCtrl',
      size: 'md',
      resolve: {
        pscope: function () {
          return $scope;
        }
      }
    });
  }
}]);
'use strict';

angular.module('web').controller('loginCtrl', ['$scope', '$rootScope', '$translate', 'Auth', 'AuthInfo', '$timeout', '$location', 'Const', 'Dialog', 'Toast', 'Cipher', 'settingsSvs', function ($scope, $rootScope, $translate, Auth, AuthInfo, $timeout, $location, Const, Dialog, Toast, Cipher, settingsSvs) {

  var DEF_EP_TPL = 'https://{region}.aliyuncs.com';

  var KEY_REMEMBER = Const.KEY_REMEMBER;
  var SHOW_HIS = Const.SHOW_HIS;
  var SHOW_REQUEST_PAY = Const.SHOW_REQUEST_PAY;
  var KEY_AUTHTOKEN = 'key-authtoken';
  var regions = angular.copy(Const.regions);

  var T = $translate.instant;

  angular.extend($scope, {
    gtab: parseInt(localStorage.getItem('gtag') || 1),
    flags: {
      remember: 'NO',
      showHis: 'NO',
      requestpaystatus: 'NO'
    },
    item: {
      eptpl: DEF_EP_TPL
    },
    eptplType: 'default',

    hideTopNav: 1,
    reg_wospath: /^wos\:\/\//,
    regions: regions,
    onSubmit: onSubmit,
    showCleanHistories: showCleanHistories,
    useHis: useHis,
    showRemoveHis: showRemoveHis,

    open: open,

    onSubmit2: onSubmit2,
    authTokenChange: authTokenChange,

    eptplChange: eptplChange
  });

  $scope.$watch('item.eptpl', function (v) {
    $scope.eptplType = v == DEF_EP_TPL ? 'default' : 'customize';
  });

  // $scope.$watch('item.eptpl', function(v){
  //     // $scope.eptplType = (v==DEF_EP_TPL)?'default':'customize';
  // });

  $scope.$watch('gtab', function (v) {
    localStorage.setItem('gtag', v);
  });

  $scope.$watch('item.cname', function (v) {
    console.log('cname: ' + v);
    if (v) {
      $scope.eptplType = 'cname';
    }
  });

  function eptplChange(t) {
    $scope.eptplType = t;
    //console.log(t);
    if (t == 'default') {
      $scope.item.eptpl = DEF_EP_TPL;
      $scope.item.cname = false;
    } else if (t == 'customize') {
      $scope.item.cname = false;
      $scope.item.eptpl = '';
    } else if (t == 'cname') {
      $scope.item.cname = true;
      $scope.item.eptplcname = '';
    }
  }

  function open(a) {
    openExternal(a);
  }

  var tid;

  function authTokenChange() {
    $timeout.cancel(tid);
    tid = $timeout(function () {
      var authToken = $scope.item.authToken || '';

      localStorage.setItem(KEY_AUTHTOKEN, authToken);

      if (!authToken) {
        $scope.authTokenInfo = null;
        return;
      }

      try {
        var str = Buffer.from(authToken, 'base64').toString();
        var info = JSON.parse(str);

        if (info.id && info.secret && info.stoken && info.privilege && info.expiration && info.wospath) {

          //过期
          try {
            var d = new Date(info.expiration).getTime();
            info.isExpired = d <= new Date().getTime();
          } catch (e) {}
          $scope.authTokenInfo = info;

          $scope.authTokenInfo.expirationStr = moment(new Date(info.expiration)).format('YYYY-MM-DD HH:mm:ss');
        } else if (info.id && info.secret && !info.id.startsWith('STS.')) {
          //子用户ak
          $scope.authTokenInfo = info;
        } else if (new Date(info.expiration).getTime() < new Date().getTime()) {
          $scope.authTokenInfo = null;
        }
      } catch (e) {
        $scope.authTokenInfo = null;
      }
    }, 600);
  }

  init();

  function init() {
    $scope.flags.remember = localStorage.getItem(KEY_REMEMBER) || 'NO';
    $scope.flags.showHis = localStorage.getItem(SHOW_HIS) || 'NO';

    //requestPay状态
    $scope.flags.requestpaystatus = localStorage.getItem(SHOW_REQUEST_PAY) || 'NO';
    eptplChange('customize');
    angular.extend($scope.item, AuthInfo.getRemember());

    //临时token
    $scope.item.authToken = localStorage.getItem(KEY_AUTHTOKEN) || '';
    authTokenChange();

    listHistories();

    $scope.$watch('flags.remember', function (v) {
      if (v == 'NO') {
        AuthInfo.unremember();
        localStorage.setItem(KEY_REMEMBER, 'NO');
      }
    });

    $scope.$watch('flags.showHis', function (v) {
      localStorage.setItem(SHOW_HIS, v);
    });

    $scope.$watch('flags.requestpaystatus', function (v) {
      console.log(v);
      localStorage.setItem(SHOW_REQUEST_PAY, v);
    });
  }

  function useHis(h) {
    if (h.cname) {
      $scope.eptplType = 'cname';
    }
    angular.extend($scope.item, h);

    $scope.item.desc = h.desc || '';
  }

  function showRemoveHis(h) {
    var title = T('auth.removeAK.title'); //删除AK
    var message = T('auth.removeAK.message', { id: h.id }); //'ID：'+h.id+', 确定删除?'
    Dialog.confirm(title, message, function (b) {
      if (b) {
        AuthInfo.removeFromHistories(h.id);
        listHistories();
      }
    }, 1);
  }

  function listHistories() {
    $scope.his = AuthInfo.listHistories();
  }

  function showCleanHistories() {
    var title = T('auth.clearAKHistories.title'); //清空AK历史
    var message = T('auth.clearAKHistories.message'); //确定?
    var successMessage = T('auth.clearAKHistories.successMessage'); //已清空AK历史
    Dialog.confirm(title, message, function (b) {
      if (b) {
        AuthInfo.cleanHistories();
        listHistories();
        Toast.success(successMessage);
      }
    }, 1);
  }

  function onSubmit(form1) {
    console.log(11111111);
    if (!form1.$valid) return;
    localStorage.setItem(KEY_REMEMBER, $scope.flags.remember);
    var data = angular.copy($scope.item);

    delete data.requestpaystatus;

    if (!data.requestpaystatus) {
      data.requestpaystatus = localStorage.getItem(SHOW_REQUEST_PAY) || 'NO';
    }
    //trim password
    if (data.secret) data.secret = data.secret.trim();

    delete data.authToken;
    delete data.securityToken;

    if (data.id.indexOf('STS.') != 0) {
      delete data.stoken;
    }

    if ($scope.flags.remember == 'YES') {
      AuthInfo.remember(data);
    }

    Toast.info(T('logining'), 1000);

    Auth.login(data).then(function () {
      if (!data.region && data.eptpl.indexOf('{region}') === -1) {
        var regExp = /https?:\/\/(\S*)\.aliyuncs\.com/;
        var res = data.eptpl.match(regExp);

        if (res) {
          data.region = res[1].replace('-internal', '');
          AuthInfo.save(data);
        }
      }
      if ($scope.flags.remember == 'YES') AuthInfo.addToHistories(data);
      Toast.success(T('login.successfully'), 1000);
      $location.url('/');
    }, function (err) {
      Toast.error(err.code + ':' + err.message);
    });

    return false;
  }

  //token login
  function onSubmit2(form2) {
    console.log('123123');
    if (!form2.$valid) return;

    if (!$scope.authTokenInfo) {
      return;
    }

    var data = angular.copy($scope.authTokenInfo);

    Toast.info(T('logining'), 1000); //'正在登录...'

    Auth.login(data).then(function () {
      Toast.success(T('login.successfully'), 1000); //'登录成功，正在跳转...'
      $location.url('/');
    }, function (err) {
      Toast.error(err.code + ':' + err.message);
    });

    return false;
  }
}]);
'use strict';

angular.module('web').controller('filesCtrl', ['$scope', '$rootScope', '$uibModal', '$timeout', '$translate', 'AuthInfo', 'wos', 'settingsSvs', 'fileSvs', 'safeApply', 'Toast', 'Dialog', '$location', function ($scope, $rootScope, $modal, $timeout, $translate, AuthInfo, wos, settingsSvs, fileSvs, safeApply, Toast, Dialog, $location) {
  var T = $translate.instant;
  angular.extend($scope, {
    showTab: 1,
    ref: {
      isBucketList: false,
      isListView: true
    },

    keepMoveOptions: null,
    isMac: os.platform() == 'darwin',

    sch: {
      bucketName: '',
      objectName: ''
    },
    searchObjectName: searchObjectName,

    goIn: goIn,

    transVisible: localStorage.getItem('transVisible') == 'true',
    toggleTransVisible: function (f) {
      $scope.transVisible = f;
      localStorage.setItem('transVisible', f);
    },

    //object 相关
    showAddFolder: showAddFolder,
    showDeleteFiles: showDeleteFiles,
    showRestoreBatch: showRestoreBatch,
    showDeleteFilesSelected: showDeleteFilesSelected,
    showRename: showRename,
    showMove: showMove,

    //bucket相关
    showDeleteBucket: showDeleteBucket,
    showAddBucket: showAddBucket,
    showUpdateBucket: showUpdateBucket,
    showBucketMultipart: showBucketMultipart,
    showFilesSearch: showFilesSearch,

    //全选相关
    sel: {
      hasArchive: false,
      all: false, //boolean
      has: false, //[] item: wosObject={name,path,...}
      x: {} //{} {'i_'+$index, true|false}
    },
    selectAll: selectAll,
    selectChanged: selectChanged,

    //bucket 单选
    bucket_sel: {
      item: null
    },
    selectBucket: selectBucket,

    //上传， 下载
    handlers: {
      uploadFilesHandler: null,
      downloadFilesHandler: null
    },
    handlerDrop: handlerDrop, //拖拽释放
    showUploadDialog: showUploadDialog,
    showDownloadDialog: showDownloadDialog,

    //预览 编辑
    showPreview: showPreview,
    //item 下载
    showDownload: showDownload,

    //授权
    showGrant: showGrant,
    showGrantToken: showGrantToken,
    showUserList: showUserList,
    //地址
    showAddress: showAddress,
    showACL: showACL,

    showHttpHeaders: showHttpHeaders,

    showRestore: showRestore,

    loadNext: loadNext,

    showPaste: showPaste,
    cancelPaste: cancelPaste,
    getCurrentWosPath: getCurrentWosPath,

    mock: {
      uploads: '',
      downloads: '',
      uploadsChange: uploadsChange,
      downloadsChange: downloadsChange
    },

    // 当前是否在刷新中
    forceRefreshing: false

  });

  if ($scope.isMac) {
    $scope.fileSpacerMenuOptions = [[function () {
      return '<i class="fa fa-upload text-info"></i> ' + T('upload');
    }, function ($itemScope, $event) {
      showUploadDialog();
    }, function () {
      return $scope.currentAuthInfo.privilege != 'readOnly';
    }]];
  } else {
    $scope.fileSpacerMenuOptions = [[function () {
      return '<i class="fa fa-upload text-info"></i> ' + T('file');
    }, function ($itemScope, $event) {
      showUploadDialog();
    }, function () {
      return $scope.currentAuthInfo.privilege != 'readOnly';
    }], [function () {
      return '<i class="fa fa-upload text-info"></i> ' + T('folder');
    }, function ($itemScope, $event) {
      showUploadDialog(true);
    }, function () {
      return $scope.currentAuthInfo.privilege != 'readOnly';
    }]];
  }
  $scope.fileSpacerMenuOptions = $scope.fileSpacerMenuOptions.concat([[function () {
    return '<i class="glyphicon glyphicon-plus text-success"></i> ' + T('folder.create');
  }, function ($itemScope, $event) {
    showAddFolder();
  }, function () {
    return $scope.currentAuthInfo.privilege != 'readOnly';
  }], [function () {
    return '<i class="fa fa-paste text-primary"></i> ' + T('paste') + ($scope.keepMoveOptions ? '(' + $scope.keepMoveOptions.items.length + ')' : '');
  }, function ($itemScope, $event) {
    showPaste();
  }, function () {
    return $scope.keepMoveOptions;
  }]]);

  $scope.fileMenuOptions = function (item, $index) {
    if ($scope.sel.x['i_' + $index]) {
      //pass
    } else {
      $scope.objects.forEach(function (n, i) {
        $scope.sel.x['i_' + i] = false;
      });
      $scope.sel.x['i_' + $index] = true;
      selectChanged();
    }

    return [[function () {
      //download
      return '<i class="fa fa-download text-primary"></i> ' + T('download');
    }, function ($itemScope, $event) {
      showDownloadDialog();
    }, function () {
      return $scope.sel.has;
    }], [function () {
      //copy
      return '<i class="fa fa-clone text-primary"></i> ' + T('copy');
    }, function ($itemScope, $event) {
      showMove($scope.sel.has, true);
    }, function () {
      return $scope.sel.has && $scope.currentAuthInfo.privilege != 'readOnly';
    }], [function () {
      //move
      return '<i class="fa fa-cut text-primary"></i> ' + T('move');
    }, function ($itemScope, $event) {
      showMove($scope.sel.has);
    }, function () {
      return $scope.sel.has && $scope.currentAuthInfo.privilege != 'readOnly';
    }], [function () {
      return '<i class="fa fa-edit text-info"></i> ' + T('rename');
    }, function ($itemScope, $event) {
      showRename($scope.sel.has[0]);
    }, function () {
      return $scope.sel.has && $scope.sel.has.length == 1 && $scope.currentAuthInfo.privilege != 'readOnly' && $scope.sel.has[0].storageClass != 'Archive';
    }],

    // [function(){
    //   return '<i class="fa fa-shield text-success"></i> ' + T('acl')
    // }, function ($itemScope, $event) {
    //   showACL($scope.sel.has[0])
    // }, function(){
    //   return $scope.sel.has && $scope.sel.has.length==1 && !$scope.sel.has[0].isFolder && $scope.currentAuthInfo.privilege!='readOnly';
    // }],


    // [function(){
    //   return '<i class="fa fa-shield text-warning"></i> ' + T('simplePolicy')
    // }, function ($itemScope, $event) {
    //   showGrant($scope.sel.has)
    // }, function(){
    //   return $scope.sel.has && $scope.currentAuthInfo.id.indexOf('STS.')!=0;
    // }],

    // [function(){
    //   //生成授权码
    //   return '<i class="fa fa-shield text-success"></i> ' + T('genAuthToken')
    // }, function ($itemScope, $event) {
    //   showGrantToken($scope.sel.has[0])
    // }, function(){
    //   return $scope.sel.has && $scope.sel.has.length==1 && $scope.sel.has[0].isFolder && $scope.currentAuthInfo.id.indexOf('STS.')!=0;
    // }],

    [function () {
      //获取地址
      return '<i class="fa fa-download"></i> ' + T('getAddress');
    }, function ($itemScope, $event) {
      showAddress($scope.sel.has[0]);
    }, function () {
      return $scope.sel.has && $scope.sel.has.length == 1 && !$scope.sel.has[0].isFolder && $scope.currentAuthInfo.id.indexOf('STS.') != 0;
    }], [function () {
      //Http头
      return '<i class="fa fa-cog"></i> ' + T('http.headers');
    }, function ($itemScope, $event) {
      showHttpHeaders($scope.sel.has[0]);
    }, function () {
      return $scope.sel.has && $scope.sel.has.length == 1 && !$scope.sel.has[0].isFolder;
    }], [function () {
      return '<i class="fa fa-remove text-danger"></i> ' + T('delete');
    }, function ($itemScope, $event) {
      showDeleteFilesSelected();
    }, function () {
      return $scope.sel.has && $scope.currentAuthInfo.privilege != 'readOnly';
    }]];
  };
  $scope.bucketSpacerMenuOptions = [[function () {
    return '<i class="glyphicon glyphicon-plus text-success"></i> ' + T('bucket.add');
  }, function ($itemScope, $event) {
    showAddBucket();
  }]];

  $scope.bucketMenuOptions = [[function ($itemScope, $event, modelValue, text, $li) {
    $scope.bucket_sel.item = $itemScope.item;
    return '<i class="fa fa-copy"></i> ' + T('bucket.multipart');
    // <!-- 碎片 -->
  }, function ($itemScope, $event) {
    // Action
    showBucketMultipart($scope.bucket_sel.item);
  }],

  // [function ($itemScope, $event, modelValue, text, $li) {
  //   $scope.bucket_sel.item = $itemScope.item
  //   return '<i class="fa fa-shield text-success"></i> '+T('acl');
  // }, function ($itemScope, $event) {
  //     // Action
  //   showUpdateBucket($scope.bucket_sel.item);
  // }],

  // [function ($itemScope, $event, modelValue, text, $li) {
  //   $scope.bucket_sel.item = $itemScope.item
  //   return '<i class="fa fa-shield text-warning"></i> '+T('simplePolicy');
  // }, function ($itemScope, $event) {
  //     // Action
  //   showGrant([$scope.bucket_sel.item]);
  // }],

  [function ($itemScope, $event, modelValue, text, $li) {
    $scope.bucket_sel.item = $itemScope.item;
    return '<i class="fa fa-remove text-danger"></i> ' + T('delete');
  }, function ($itemScope, $event) {
    // Action
    showDeleteBucket($scope.bucket_sel.item);
  }]];

  /////////////////////////////////

  var tid_uploads;
  function uploadsChange() {
    $timeout.cancel(tid_uploads);
    tid_uploads = $timeout(function () {
      if ($scope.mock.uploads) {
        var arr = $scope.mock.uploads.split(',');
        $scope.handlers.uploadFilesHandler(arr, $scope.currentInfo);
      }
    }, 600);
  }
  var tid_downloads;
  function downloadsChange() {
    $timeout.cancel(tid_downloads);
    tid_downloads = $timeout(function () {
      if ($scope.mock.downloads) {
        _downloadMulti($scope.mock.downloads);
      }
    }, 600);
  }

  var ttid;
  $scope.$on('needrefreshfilelists', function (e) {
    console.log('on:needrefreshfilelists');
    $timeout.cancel(ttid);
    ttid = $timeout(function () {
      goIn($scope.currentInfo.bucket, $scope.currentInfo.key);
    }, 600);
  });

  $timeout(init, 100);

  function init() {
    var authInfo = AuthInfo.get();
    var forRefreshing = false;

    $rootScope.currentAuthInfo = authInfo;

    if (authInfo.wospath) {
      $scope.ref.isBucketList = false;
      //bucketMap
      $rootScope.bucketMap = {};
      var bucket = wos.parseWOSPath(authInfo.wospath).bucket;
      $rootScope.bucketMap[bucket] = {
        region: authInfo.region
      };

      $timeout(function () {
        addEvents();
        //$rootScope.$broadcast('wosAddressChange', authInfo.wospath);
        $scope.$broadcast('filesViewReady');
      });
    } else {

      $scope.ref.isBucketList = true;
      listBuckets(function () {
        addEvents();
        $scope.$broadcast('filesViewReady');
      });
    }
  }

  //按名称过滤
  var ttid2;

  function searchObjectName() {
    $timeout.cancel(ttid2);
    ttid2 = $timeout(function () {
      var info = angular.copy($scope.currentInfo);
      info.key += $scope.sch.objectName;
      listFiles(info);
    }, 600);
  }

  function addEvents() {
    $scope.$on('wosAddressChange', function (e, addr, forceRefresh) {
      console.log('on:wosAddressChange:', addr, 'forceRefresh:', forceRefresh);
      if (forceRefresh) {
        if ($scope.forceRefreshing) {
          console.log('on:wosAddressChange:', addr, 'forceRefreshing:', $scope.forceRefreshing);
          return;
        } else {
          $scope.forceRefreshing = true;
        }
      }

      var info = wos.parseWOSPath(addr);

      if (info.key) {
        var lastGan = info.key.lastIndexOf('/');

        if (info.key && lastGan != info.key.length - 1) {
          //if not endswith /
          var fileKey = info.key;
          var fileName = info.key.substring(lastGan + 1);
          info.key = info.key.substring(0, lastGan + 1);
        }
      }

      $scope.currentInfo = info;

      if (info.bucket) {

        //has bucket , list objects
        $scope.currentBucket = info.bucket;
        if (!$rootScope.bucketMap[info.bucket]) {
          Toast.error('No permission');

          clearObjectsList();

          return;
        }
        info.region = $rootScope.bucketMap[info.bucket].region;
        $scope.ref.isBucketList = false;

        if (fileName) {
          //search
          $scope.sch.objectName = fileName;
          searchObjectName();
        } else {
          //fix ubuntu
          $timeout(function () {
            listFiles();
          }, 100);
        }
      } else {

        //list buckets
        $scope.currentBucket = null;
        $scope.ref.isBucketList = true;
        //只有从来没有 list buckets 过，才list，减少http请求开销
        if (!$scope.buckets || forceRefresh) listBuckets();

        clearObjectsList();
      }
    });
  }

  function goIn(bucket, prefix) {
    var wosPath = 'wos://';

    if (bucket) {
      wosPath = 'wos://' + bucket + '/' + (prefix || '');
    }
    $rootScope.$broadcast('goToWosAddress', wosPath);
  }

  function listFiles(info, marker, fn) {
    clearObjectsList();
    info = info || $scope.currentInfo;
    $scope.isLoading = true;

    doListFiles(info, marker, function (err) {
      $scope.isLoading = false;
      safeApply($scope);

      if ($scope.forceRefreshing) {
        $scope.forceRefreshing = false;
      }
    });
  }

  function doListFiles(info, marker, fn) {

    wos.listFiles(info.region, info.bucket, info.key, marker || '').then(function (result) {

      var arr = result.data;
      settingsSvs.showImageSnapshot.get() == 1 ? signPicURL(info, arr) : null;

      $scope.objects = $scope.objects.concat(arr);
      $scope.nextObjectsMarker = result.marker || null;

      safeApply($scope);
      if (fn) fn(null);
    }, function (err) {
      console.log(err);
      clearObjectsList();

      if (fn) fn(err);
    });
  }

  function loadNext() {

    if ($scope.nextObjectsMarker) {
      console.log('loadNext');
      doListFiles($scope.currentInfo, $scope.nextObjectsMarker);
    }
  }

  function clearObjectsList() {
    initSelect();
    $scope.objects = [];
    $scope.nextObjectsMarker = null;
  }

  function signPicURL(info, result) {
    var authInfo = AuthInfo.get();
    if (authInfo.id.indexOf('STS.') == 0) {
      angular.forEach(result, function (n) {
        if (!n.isFolder && fileSvs.getFileType(n).type == 'picture') {
          wos.getImageBase64Url(info.region, info.bucket, n.path).then(function (data) {
            if (data.ContentType.indexOf('image/') == 0) {
              var base64str = new Buffer(data.Body).toString('base64');
              n.pic_url = 'data:' + data.ContentType + ';base64,' + base64str;
            }
          });
        }
      });
    } else {
      angular.forEach(result, function (n) {
        if (!n.isFolder && fileSvs.getFileType(n).type == 'picture') {
          n.pic_url = wos.signatureUrl2(info.region, info.bucket, n.path, 3600, 'image/resize,w_48');
        }
      });
    }
    //return result;
  }

  function listBuckets(fn) {
    $scope.isLoading = true;

    // 自动登录，登录信息里面没有region，跳转到登录页
    if (!$rootScope.currentAuthInfo.region) {
      $location.url('/login');
      return;
    }

    wos.listAllBuckets().then(function (buckets) {
      $scope.isLoading = false;

      // s3Rest 新增返回字段region和endopoint；未升级则默认取登录配置的
      var authRegion = $rootScope.currentAuthInfo.region;
      var eptpl = $rootScope.currentAuthInfo.eptpl;
      var endpoint = eptpl.indexOf("https://") != -1 ? eptpl.substring(8, eptpl.length) : eptpl.substring(7, eptpl.length);
      angular.forEach(buckets, function (n) {
        if (!n.region) {
          n.region = authRegion;
          n.endpoint = endpoint;
        }
      });

      $scope.buckets = buckets;

      var m = {};
      angular.forEach(buckets, function (n) {
        m[n.name] = n;
      });
      $rootScope.bucketMap = m;

      safeApply($scope);

      if (fn) fn();
    }, function (err) {
      console.log(err);
      $scope.isLoading = false;

      clearObjectsList();

      // $scope.buckets = [];
      // $rootScope.bucketMap = {};

      safeApply($scope);

      if (fn) fn();
    });
  }

  function showDeleteBucket(item) {
    var title = T('bucket.delete.title');
    var message = T('bucket.delete.message', { name: item.name, region: item.region });
    Dialog.confirm(title, message, function (b) {
      if (b) {
        wos.deleteBucket(item.region, item.name).then(function () {
          Toast.success(T('bucket.delete.success')); //删除Bucket成功
          //删除Bucket不是实时的，等待1秒后刷新
          $timeout(function () {
            listBuckets();
          }, 1000);
        });
      }
    }, 1);
  }

  function showDeleteFilesSelected() {
    showDeleteFiles($scope.sel.has);
  }

  function showDeleteFiles(items) {
    $modal.open({
      templateUrl: 'main/files/modals/delete-files-modal.html',
      controller: 'deleteFilesModalCtrl',
      backdrop: 'static',
      resolve: {
        items: function () {
          return items;
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        },
        callback: function () {
          return function () {
            $timeout(function () {
              listFiles();
            }, 300);
          };
        }
      }
    });
  }

  function showAddBucket() {
    $modal.open({
      templateUrl: 'main/files/modals/add-bucket-modal.html',
      controller: 'addBucketModalCtrl',
      resolve: {
        item: function () {
          return null;
        },
        callback: function () {
          return function () {
            Toast.success(T('bucket.add.success')); //'创建Bucket成功'
            //创建Bucket不是实时的，等待1秒后刷新
            $timeout(function () {
              listBuckets();
            }, 1000);
          };
        }
      }
    });
  }

  function showAddFolder() {
    $modal.open({
      templateUrl: 'main/files/modals/add-folder-modal.html',
      controller: 'addFolderModalCtrl',
      resolve: {
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        },
        callback: function () {
          return function () {
            Toast.success(T('folder.create.success')); //'创建目录成功'
            $timeout(function () {
              listFiles();
            }, 300);
          };
        }
      }
    });
  }

  function showUpdateBucket(item) {
    $modal.open({
      templateUrl: 'main/files/modals/update-bucket-modal.html',
      controller: 'updateBucketModalCtrl',
      resolve: {
        item: function () {
          return item;
        },
        callback: function () {
          return function () {
            Toast.success(T('bucketACL.update.success')); //'修改Bucket权限成功'
            $timeout(function () {
              listBuckets();
            }, 300);
          };
        }
      }
    });
  }

  function showBucketMultipart(item) {
    $modal.open({
      templateUrl: 'main/files/modals/bucket-multipart-modal.html',
      controller: 'bucketMultipartModalCtrl',
      size: 'lg',
      backdrop: 'static',
      resolve: {
        bucketInfo: function () {
          return item;
        }
      }
    });
  }

  function showPreview(item, type) {

    var fileType = fileSvs.getFileType(item);
    fileType.type = type || fileType.type;
    // console.log(fileType);

    //type: [picture|code|others|doc]

    var templateUrl = 'main/files/modals/preview/others-modal.html';
    var controller = 'othersModalCtrl';
    var backdrop = true;

    if (fileType.type == 'code') {
      templateUrl = 'main/files/modals/preview/code-modal.html';
      controller = 'codeModalCtrl';
      backdrop = 'static';
    } else if (fileType.type == 'picture') {
      templateUrl = 'main/files/modals/preview/picture-modal.html';
      controller = 'pictureModalCtrl';
      //backdrop = 'static';
    } else if (fileType.type == 'video') {
      templateUrl = 'main/files/modals/preview/media-modal.html';
      controller = 'mediaModalCtrl';
    } else if (fileType.type == 'audio') {
      templateUrl = 'main/files/modals/preview/media-modal.html';
      controller = 'mediaModalCtrl';
    } else if (fileType.type == 'doc') {
      templateUrl = 'main/files/modals/preview/doc-modal.html';
      controller = 'docModalCtrl';
    }

    $modal.open({
      templateUrl: templateUrl,
      controller: controller,
      size: 'lg',
      //backdrop: backdrop,
      resolve: {
        bucketInfo: function () {
          return angular.copy($scope.currentInfo);
        },
        objectInfo: function () {
          return item;
        },
        fileType: function () {
          return fileType;
        },
        showFn: function () {
          return {
            callback: function (reloadStorageStatus) {
              if (reloadStorageStatus) {
                $timeout(function () {
                  //listFiles();
                  wos.loadStorageStatus($scope.currentInfo.region, $scope.currentInfo.bucket, [item]);
                }, 300);
              }
            },
            preview: showPreview,
            download: function () {
              showDownload(item);
            },
            grant: function () {
              showGrant([item]);
            },
            move: function (isCopy) {
              showMove([item], isCopy);
            },
            remove: function () {
              showDeleteFiles([item]);
            },
            rename: function () {
              showRename(item);
            },
            address: function () {
              showAddress(item);
            },
            acl: function () {
              showACL(item);
            },
            httpHeaders: function () {
              showHttpHeaders(item);
            },
            crc: function () {
              showCRC(item);
            }
          };
        }
      }
    });
  }

  function showCRC(item) {

    $modal.open({
      templateUrl: 'main/files/modals/crc-modal.html',
      controller: 'crcModalCtrl',
      resolve: {
        item: function () {
          return angular.copy(item);
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        }
      }
    });
  }

  function showDownload(item) {
    var bucketInfo = angular.copy($scope.currentInfo);
    var fromInfo = angular.copy(item);

    fromInfo.region = bucketInfo.region;
    fromInfo.bucket = bucketInfo.bucket;

    Dialog.showDownloadDialog(function (folderPaths) {

      if (!folderPaths || folderPaths.length == 0) return;

      var to = folderPaths[0];
      to = to.replace(/(\/*$)/g, '');

      $scope.handlers.downloadFilesHandler([fromInfo], to);
    });
  }

  ////////////////////////
  function initSelect() {
    $scope.sel.all = false;
    $scope.sel.has = false;
    $scope.sel.x = {};
  }

  function selectAll() {
    var f = $scope.sel.all;
    $scope.sel.has = f ? $scope.objects : false;
    var len = $scope.objects.length;
    for (var i = 0; i < len; i++) {
      $scope.sel.x['i_' + i] = f;
    }
  }

  var lastSeleteIndex = -1;

  function selectChanged(e, index) {
    //批量选中
    if (e && e.shiftKey) {
      var min = Math.min(lastSeleteIndex, index);
      var max = Math.max(lastSeleteIndex, index);
      for (var i = min; i <= max; i++) {
        $scope.sel.x['i_' + i] = true;
      }
    }

    var len = $scope.objects.length;
    var all = true;
    var has = false;
    for (var i = 0; i < len; i++) {
      if (!$scope.sel.x['i_' + i]) {
        all = false;
      } else {
        if (!has) has = [];
        has.push($scope.objects[i]);
      }
    }
    $scope.sel.all = all;
    $scope.sel.has = has;

    lastSeleteIndex = index;
  }
  ////////////////////////////////

  function selectBucket(item) {
    if ($scope.bucket_sel.item == item) {
      $scope.bucket_sel.item = null;
    } else {
      $scope.bucket_sel.item = item;
    }
  }

  //上传下载
  var oudtid, oddtid;

  function showUploadDialog(isFolder) {
    if (oudtid) return;
    oudtid = true;
    $timeout(function () {
      oudtid = false;
    }, 600);

    Dialog.showUploadDialog(function (filePaths) {
      if (!filePaths || filePaths.length == 0) return;
      $scope.handlers.uploadFilesHandler(filePaths, $scope.currentInfo);
    }, isFolder);
  }

  function showDownloadDialog() {
    if (oddtid) return;
    oddtid = true;
    $timeout(function () {
      oddtid = false;
    }, 600);

    Dialog.showDownloadDialog(function (folderPaths) {

      if (!folderPaths || folderPaths.length == 0 || !$scope.sel.has) return;

      var to = folderPaths[0];
      _downloadMulti(to);
    });
  }

  function _downloadMulti(to) {
    to = to.replace(/(\/*$)/g, '');

    var fromArr = angular.copy($scope.sel.has);
    angular.forEach(fromArr, function (n) {
      n.region = $scope.currentInfo.region;
      n.bucket = $scope.currentInfo.bucket;
    });

    /**
     * @param fromWosPath {array}  item={region, bucket, path, name, size }
     * @param toLocalPath {string}
     */
    $scope.handlers.downloadFilesHandler(fromArr, to);
  }

  /**
   * 监听 drop
   * @param e
   * @returns {boolean}
   */
  function handlerDrop(e) {

    var files = e.originalEvent.dataTransfer.files;
    var filePaths = [];
    if (files) {
      angular.forEach(files, function (n) {
        filePaths.push(n.path);
      });
    }

    $scope.handlers.uploadFilesHandler(filePaths, $scope.currentInfo);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  //授权
  function showGrant(items) {
    $modal.open({
      templateUrl: 'main/files/modals/grant-modal.html',
      controller: 'grantModalCtrl',
      resolve: {
        items: function () {
          return items;
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        }
      }
    });
  }

  //生成授权码
  function showGrantToken(item) {
    $modal.open({
      templateUrl: 'main/files/modals/grant-token-modal.html',
      controller: 'grantTokenModalCtrl',
      resolve: {
        item: function () {
          return item;
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        }
      }
    });
  }

  //重命名
  function showRename(item) {
    $modal.open({
      templateUrl: 'main/files/modals/rename-modal.html',
      controller: 'renameModalCtrl',
      backdrop: 'static',
      resolve: {
        item: function () {
          return angular.copy(item);
        },
        moveTo: function () {
          return angular.copy($scope.currentInfo);
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        },
        isCopy: function () {
          return false;
        },
        callback: function () {
          return function () {
            $timeout(function () {
              listFiles();
            }, 300);
          };
        }
      }
    });
  }

  function getCurrentWosPath() {
    return 'wos://' + $scope.currentInfo.bucket + '/' + $scope.currentInfo.key;
  }
  function cancelPaste() {
    $scope.keepMoveOptions = null;
    safeApply($scope);
  }
  function showPaste() {
    // if($scope.keepMoveOptions.originPath==getCurrentWosPath()){
    //   $scope.keepMoveOptions = null;
    //   return;
    // }
    var keyword = $scope.keepMoveOptions.isCopy ? T('copy') : T('move');
    var keepmove = $scope.keepMoveOptions.currentInfo;
    var current = $scope.currentInfo;

    if ($scope.keepMoveOptions.items.length == 1 && $scope.currentInfo.bucket == $scope.keepMoveOptions.currentInfo.bucket) {
      //1个支持重命名
      $modal.open({
        templateUrl: 'main/files/modals/rename-modal.html',
        controller: 'renameModalCtrl',
        backdrop: 'static',
        resolve: {
          item: function () {
            return angular.copy($scope.keepMoveOptions.items[0]);
          },
          moveTo: function () {
            return angular.copy($scope.currentInfo);
          },
          currentInfo: function () {
            return angular.copy($scope.keepMoveOptions.currentInfo);
          },
          isCopy: function () {
            return $scope.keepMoveOptions.isCopy;
          },
          callback: function () {
            return function () {
              $scope.keepMoveOptions = null;
              $timeout(function () {
                listFiles();
              }, 100);
            };
          }
        }
      });
      return;
    }
    if (current.key === keepmove.key && keyword === T('move') && current.bucket === keepmove.bucket) {
      Toast.warn(T('forbidden'));
    } else {
      var msg = T('paste.message1', { name: $scope.keepMoveOptions.items[0].name, action: keyword });

      //  '将 <span class="text-info">'+
      //     + '等</span> ' + keyword+' 到这个目录下面（如有相同的文件或目录则覆盖）？';

      Dialog.confirm(keyword, msg, function (b) {
        if (b) {
          $modal.open({
            templateUrl: 'main/files/modals/move-modal.html',
            controller: 'moveModalCtrl',
            backdrop: 'static',
            resolve: {
              items: function () {
                return angular.copy($scope.keepMoveOptions.items);
              },
              moveTo: function () {
                return angular.copy($scope.currentInfo);
              },
              isCopy: function () {
                return $scope.keepMoveOptions.isCopy;
              },
              renamePath: function () {
                return '';
              },
              fromInfo: function () {
                return angular.copy($scope.keepMoveOptions.currentInfo);
              },
              callback: function () {
                return function () {
                  $scope.keepMoveOptions = null;
                  $timeout(function () {
                    listFiles();
                  }, 100);
                };
              }
            }
          });
        }
      });
    }
  }

  //移动
  function showMove(items, isCopy) {

    $scope.keepMoveOptions = {
      items: items,
      isCopy: isCopy,
      currentInfo: angular.copy($scope.currentInfo),
      originPath: getCurrentWosPath()
    };
  }
  //地址
  function showAddress(item) {
    $modal.open({
      templateUrl: 'main/files/modals/get-address.html',
      controller: 'getAddressModalCtrl',
      resolve: {
        item: function () {
          return angular.copy(item);
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        }
      }
    });
  }

  //acl
  function showACL(item) {
    $modal.open({
      templateUrl: 'main/files/modals/update-acl-modal.html',
      controller: 'updateACLModalCtrl',
      resolve: {
        item: function () {
          return angular.copy(item);
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        }
      }
    });
  }

  function showHttpHeaders(item) {
    $modal.open({
      templateUrl: 'main/files/modals/update-http-headers-modal.html',
      controller: 'updateHttpHeadersModalCtrl',
      resolve: {
        item: function () {
          return angular.copy(item);
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        }
      }
    });
  }

  function showRestoreBatch() {
    let selectObjects = $scope.sel.has;
    let SelRestore = [];
    if (selectObjects && selectObjects.length > 0) {
      for (let i in selectObjects) {
        // if (selectObjects[i].storageStatus !== 3 && selectObjects[i].StorageClass === 'Archive') {
        //   SelRestore.push(selectObjects[i]);
        // }
        SelRestore.push(selectObjects[i]);
      }
      if (!SelRestore.length) {
        Toast.info(T('restore.msg'));
      } else {
        showSelrestores(SelRestore);
      }
    }
  }

  function showSelrestores(items) {
    $modal.open({
      templateUrl: 'main/files/modals/batch-restore-modal.html',
      controller: 'batchRestoreModalCtrl',
      resolve: {
        item: function () {
          return angular.copy(items);
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        },
        callback: function () {
          return function () {
            $timeout(function () {
              wos.loadStorageStatus($scope.currentInfo.region, $scope.currentInfo.bucket, items);
            }, 300);
          };
        }
      }
    });
  }

  function showRestore(item) {
    $modal.open({
      templateUrl: 'main/files/modals/restore-modal.html',
      controller: 'restoreModalCtrl',
      resolve: {
        item: function () {
          return angular.copy(item);
        },
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        },
        callback: function () {
          return function () {
            $timeout(function () {
              //listFiles();
              wos.loadStorageStatus($scope.currentInfo.region, $scope.currentInfo.bucket, [item]);
            }, 300);
          };
        }
      }
    });
  }

  function showUserList() {
    $modal.open({
      templateUrl: 'main/modals/users.html',
      controller: 'usersCtrl',
      size: 'lg',
      backdrop: 'static'
    });
  }

  function showFilesSearch() {
    $modal.open({
      templateUrl: 'main/files/modals/file-search.html',
      controller: 'fileSearchCtrl',
      size: 'lg',
      resolve: {
        currentInfo: function () {
          return angular.copy($scope.currentInfo);
        },
        callback: function () {
          return;
        },
        showFn: function () {
          return {
            showPreview: function (item, type) {
              showPreview(item, type);
            }
          };
        }
      }
    });
  }
}]);
'use strict';

angular.module('web').controller('aboutCtrl', ['$scope', '$state', '$uibModalInstance', '$interval', 'autoUpgradeSvs', 'safeApply', 'Toast', 'pscope', function ($scope, $state, $modalInstance, $interval, autoUpgradeSvs, safeApply, Toast, pscope) {

  angular.extend($scope, {
    cancel: cancel,
    startUpgrade: startUpgrade,
    installAndRestart: installAndRestart,
    open: open,
    app_logo: Global.app.logo,
    info: {
      currentVersion: Global.app.version
    },
    custom_about_html: Global.about_html
  });

  $interval(function () {
    Object.assign($scope.info, pscope.upgradeInfo);
  }, 1000);

  function installAndRestart() {
    gInstallAndRestart($scope.info.lastVersion);
  }

  init();
  function init() {
    $scope.info = pscope.upgradeInfo;

    if (!$scope.info.isLastVersion) {
      var converter = new showdown.Converter();
      autoUpgradeSvs.getLastestReleaseNote($scope.info.lastVersion, $scope.langSettings.lang, function (text) {
        text = text + '';
        var html = converter.makeHtml(text);
        $scope.info.lastReleaseNote = html;
        //safeApply($scope);
      });
    }
  }

  function startUpgrade() {
    autoUpgradeSvs.start();
  }

  function open(a) {
    openExternal(a);
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }
}]);
'use strict';

angular.module('web').controller('favListCtrl', ['$scope', '$rootScope', '$translate', '$state', '$uibModalInstance', 'Fav', 'Toast', function ($scope, $rootScope, $translate, $state, $modalInstance, Fav, Toast) {
  var T = $translate.instant;
  angular.extend($scope, {

    cancel: cancel,
    refresh: refresh,
    removeFav: removeFav,
    goTo: goTo
  });

  refresh();
  function refresh() {
    var arr = Fav.list();
    $scope.items = arr;
  }

  function goTo(url) {
    $rootScope.$broadcast('goToWosAddress', url);
    cancel();
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function removeFav(item) {
    Fav.remove(item.url);
    Toast.warning(T('bookmarks.delete.success')); //删除书签成功
    refresh();
  }
}]);
'use strict';

angular.module('web').controller('settingsCtrl', ['$scope', '$state', '$timeout', '$uibModalInstance', '$translate', 'callback', 'settingsSvs', 'Mailer', 'Toast', 'Dialog', 'Const', function ($scope, $state, $timeout, $modalInstance, $translate, callback, settingsSvs, Mailer, Toast, Dialog, Const) {
  var T = $translate.instant;
  angular.extend($scope, {
    showTab: 3,
    set: {
      autoUpgrade: settingsSvs.autoUpgrade.get(),
      maxUploadJobCount: settingsSvs.maxUploadJobCount.get(),
      maxDownloadJobCount: settingsSvs.maxDownloadJobCount.get(),
      showImageSnapshot: settingsSvs.showImageSnapshot.get(),
      historiesLength: settingsSvs.historiesLength.get(),
      mailSmtp: settingsSvs.mailSmtp.get(),
      logFile: settingsSvs.logFile.get(),
      logFileInfo: settingsSvs.logFileInfo.get(),
      connectTimeout: settingsSvs.connectTimeout.get(),
      uploadPartSize: settingsSvs.uploadPartSize.get(),
      uploadAndDownloadRetryTimes: settingsSvs.uploadAndDownloadRetryTimes.get()
    },
    reg: {
      email: Const.REG.EMAIL
    },
    setChange: setChange,
    cancel: cancel,

    testMail: testMail,
    openDebug: openDebug
  });
  var tid;
  var { ipcRenderer } = require('electron');
  function setChange(form1, key, ttl) {
    $timeout.cancel(tid);
    tid = $timeout(function () {
      if (!form1.$valid) return;
      settingsSvs[key].set($scope.set[key]);
      Toast.success(T('settings.success')); //已经保存设置
      if (key == 'logFile' || key == "logFileInfo" || key == "uploadPartSize" || key == "uploadAndDownloadRetryTimes") {
        ipcRenderer.send('asynchronous', { key: 'refreshPage' });
      }
    }, ttl || 100);
  }

  function cancel() {
    if (callback) callback();
    $modalInstance.dismiss('close');
  }

  function testMail() {
    var title = T('mail.test.title'); //测试邮件
    var message = T('mail.test.message', { from: $scope.set.mailSmtp.from }); //将发送测试邮件到
    Dialog.confirm(title, message, function (b) {
      if (!b) return;
      Toast.info(T('mail.send.on'));
      Mailer.send({
        subject: 'WOS Browser Test',
        to: $scope.set.mailSmtp.from,
        html: 'test'
      }).then(function (result) {
        console.log(result);
        Toast.success(T('mail.test.success')); // 邮件发送成功');
      }, function (err) {
        console.error(err);
        Toast.error(err);
      });
    });
  }

  function openDebug() {
    ipcRenderer.send('asynchronous', { key: 'openDevTools' });
  }
}]);
'use strict';

angular.module('web').controller('userAKCtrl', ['$scope', '$rootScope', '$translate', '$state', '$uibModalInstance', 'user', 'ramSvs', 'subUserAKSvs', 'Toast', 'Dialog', 'Const', function ($scope, $rootScope, $translate, $state, $modalInstance, user, ramSvs, subUserAKSvs, Toast, Dialog, Const) {
  var T = $translate.instant;

  angular.extend($scope, {
    user: user || {},
    items: [],
    isLoading: false,
    cancel: cancel,
    refresh: refresh,
    updateStatus: updateStatus,
    showRemove: showRemove,
    showAdd: showAdd
  });
  refresh();

  function refresh() {

    $scope.isLoading = true;
    subUserAKSvs.list().then(function (arr) {
      var akMap = {};
      angular.forEach(arr, function (n) {
        akMap[n.AccessKeyId] = n.AccessKeySecret;
      });

      ramSvs.listAccessKeys(user.UserName).then(function (result) {
        $scope.isLoading = false;
        var items = result.AccessKeys.AccessKey;
        angular.forEach(items, function (n) {
          n.AccessKeySecret = akMap[n.AccessKeyId] || '';
        });
        items.sort(function (a, b) {
          return a.UpdateDate < b.UpdateDate ? 1 : -1;
        });
        $scope.items = items;
      }, function () {
        $scope.isLoading = false;
      });
    });
  }

  function showRemove(item) {
    Dialog.confirm(title, message, function (b) {
      if (!b) return;
      ramSvs.deleteAccessKey(user.UserName, item.AccessKeyId).then(function () {
        refresh();
      });
    });
  }

  function updateStatus(item) {
    var title = T('ak.status.update.title.' + item.Status);
    var message = T('ak.status.update.message.' + item.Status);

    var status = item.Status == 'Active' ? 'Inactive' : 'Active';

    Dialog.confirm(title, message, function (b) {
      if (!b) return;
      ramSvs.updateAccessKey(user.UserName, item.AccessKeyId, status).then(function () {
        refresh();
      });
    }, item.Status == 'Active' ? 1 : 0);
  }

  function showRemove(item) {
    var title = T('ak.delete.title');
    var message = T('ak.delete.message');

    Dialog.confirm(title, message, function (b) {
      if (!b) return;
      ramSvs.deleteAccessKey(user.UserName, item.AccessKeyId).then(function () {
        refresh();
      });
    }, 1);
  }

  function showAdd() {
    ramSvs.createAccessKey(user.UserName).then(function (result) {
      //result.AccessKey.AccessKeyId,
      subUserAKSvs.save({
        AccessKeyId: result.AccessKey.AccessKeyId,
        AccessKeySecret: result.AccessKey.AccessKeySecret,
        UserName: user.UserName
      }).then(function () {
        refresh();
      });
    });
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }
}]);
'use strict';

angular.module('web').controller('userUpdateCtrl', ['$scope', '$rootScope', '$translate', '$state', '$uibModalInstance', 'item', 'callback', 'ramSvs', 'Toast', 'Const', function ($scope, $rootScope, $translate, $state, $modalInstance, item, callback, ramSvs, Toast, Const) {
  var T = $translate.instant;

  var countryNum = angular.copy(Const.countryNum);
  var countryNumMap = {};
  angular.forEach(countryNum, function (n) {
    countryNumMap[n.value] = n;
  });

  angular.extend($scope, {
    reg: {
      email: Const.REG.EMAIL
    },
    item: initNewItem(item),
    cancel: cancel,
    countryNum: countryNum,
    countryNumMap: countryNumMap,
    onSubmit: onSubmit
  });

  init();
  function init() {
    var numkv = angular.copy(countryNum[0]);
    $scope.item._MobilePhonePre = numkv.value;
    $scope.item._MobilePhoneNum = '';

    if (item.UserId) {
      ramSvs.getUser(item.UserName).then(function (result) {
        angular.extend($scope.item, initNewItem(result.User));
      });
    }
  }
  function initNewItem(item) {
    var info = {
      UserName: item.UserName,
      NewUserName: item.UserName,
      NewDisplayName: item.DisplayName,
      NewMobilePhone: item.MobilePhone,
      NewEmail: item.Email,
      NewComments: item.Comments
    };
    if (item.MobilePhone) {
      var numkv = item.MobilePhone.split('-');
      info._MobilePhonePre = numkv[0];
      info._MobilePhoneNum = numkv[1];
    }
    return info;
  }

  function onSubmit(form1) {
    if (!form1.$valid) return;

    var item = angular.copy($scope.item);
    if (item._MobilePhonePre && item._MobilePhoneNum) {
      item.NewMobilePhone = item._MobilePhonePre + '-' + item._MobilePhoneNum;
    } else {
      item.NewMobilePhone = '';
    }
    delete item._MobilePhonePre;
    delete item._MobilePhoneNum;

    //console.log(item);
    ramSvs.updateUser(item).then(function (result) {
      callback();
      cancel();
    });
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }
}]);
'use strict';

angular.module('web').controller('usersCtrl', ['$scope', '$rootScope', '$q', '$translate', '$state', '$uibModalInstance', '$uibModal', 'ramSvs', 'Dialog', 'Toast', function ($scope, $rootScope, $q, $translate, $state, $modalInstance, $modal, ramSvs, Dialog, Toast) {
  var T = $translate.instant;
  angular.extend($scope, {
    items: [],
    isLoading: false,
    err: null,
    sch: {
      txt: ''
    },
    open: function () {},
    cancel: cancel,
    refresh: refresh,
    showUpdate: showUpdate,
    showRemove: showRemove,
    showAK: showAK
  });

  refresh();
  function refresh() {
    $scope.isLoading = true;
    $scope.err = null;
    ramSvs.listUsers().then(function (arr) {
      $scope.isLoading = false;
      arr.sort(function (a, b) {
        return a.UpdateDate < b.UpdateDate ? 1 : -1;
      });
      $scope.items = arr;
      //UserId, UserName, DisplayName, CreateDate, UpdateDate, Comments;
    }, function (err) {
      $scope.err = err;
      $scope.isLoading = false;
    });
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function showUpdate(item) {
    $modal.open({
      templateUrl: 'main/modals/user-update.html',
      controller: 'userUpdateCtrl',
      resolve: {
        item: function () {
          return item;
        },
        callback: function () {
          return function () {
            refresh();
          };
        }
      }
    });
  }
  function showAK(item) {
    $modal.open({
      templateUrl: 'main/modals/user-ak.html',
      controller: 'userAKCtrl',
      size: 'lg',
      resolve: {
        user: function () {
          return item;
        },
        callback: function () {
          return function () {
            refresh();
          };
        }
      }
    });
  }

  function showRemove(item) {
    var title = T('user.delete.title');
    var message = T('user.delete.message', { name: item.UserName });

    Dialog.confirm(title, message, function (b) {
      if (!b) return;
      Toast.info(T('user.delete.on'));
      ramSvs.listPoliciesForUser(item.UserName).then(function (result) {
        var arr = result.Policies.Policy;
        dig(arr, function (n) {
          return ramSvs.detachPolicyFromUser(n.PolicyName, item.UserName);
        }).then(function () {
          ramSvs.listAccessKeys(item.UserName).then(function (result) {
            var arr = result.AccessKeys.AccessKey;
            dig(arr, function (n) {
              return ramSvs.deleteAccessKey(item.UserName, n.AccessKeyId);
            }).then(function () {
              //删除
              ramSvs.deleteUser(item.UserName).then(function () {
                Toast.success(T('user.delete.success'));
                refresh();
              });
            });
          });
        });
      });
    });

    function dig(arr, fn) {
      var len = arr.length;
      var c = 0;
      var df = $q.defer();
      _();
      function _() {
        if (c >= len) {
          df.resolve();
          return;
        }
        fn(arr[c]).then(function () {
          c++;
          _();
        });
      }
      return df.promise;
    }
  }
}]);
'use strict';

angular.module('web').controller('addressBarCtrl', ['$scope', '$translate', 'Fav', 'AuthInfo', 'Toast', 'settingsSvs', function ($scope, $translate, Fav, AuthInfo, Toast, settingsSvs) {

  var DEF_ADDR = 'wos://';
  var T = $translate.instant;

  angular.extend($scope, {
    address: AuthInfo.get().wospath || DEF_ADDR,
    goUp: goUp,
    go: go,
    goHome: goHome,
    saveDefaultAddress: saveDefaultAddress,
    getDefaultAddress: getDefaultAddress,

    isFav: isFav,
    toggleFav: toggleFav,

    //历史，前进，后退
    canGoAhead: false,
    canGoBack: false,
    goBack: goBack,
    goAhead: goAhead
  });

  function isFav(addr) {
    return Fav.has(addr);
  }

  function toggleFav(addr) {
    if (isFav(addr)) {
      Fav.remove(addr);
      Toast.warn(T('bookmark.remove.success')); //'已删除书签'
    } else {
      var f = Fav.add(addr);
      if (f) Toast.success(T('bookmark.add.success')); //'添加书签成功'
      else Toast.warn(T('bookmark.add.error1')); //'添加书签失败: 超过最大限制'
    }
  }

  /************ 历史记录前进后退 start **************/
  var His = new function () {
    var arr = [];
    var index = -1;
    this.add = function (url) {
      if (index > -1 && url == arr[index].url) return;

      if (index < arr.length - 1) arr.splice(index + 1, arr.length - index);

      arr.push({ url: url, time: new Date().getTime() });
      index++;

      var MAX = settingsSvs.historiesLength.get();
      if (arr.length > MAX) {
        arr.splice(MAX, arr.length - MAX);
        index = arr.length - 1;
      }

      this._change(index, arr);
    };
    this.clear = function () {
      arr = [];
      index = -1;
      this._change(index, arr);
    };
    this.list = function () {
      return JSON.parse(JSON.stringify(arr));
    };
    this.goBack = function () {
      if (arr.length == 0) return null;
      if (index > 0) {
        index--;
        this._change(index, arr);
      }
      return arr[index];
    };
    this.goAhead = function () {
      if (arr.length == 0) return null;
      if (index < arr.length - 1) {
        index++;
        this._change(index, arr);
      }
      return arr[index];
    };

    //监听事件
    this.onChange = function (fn) {
      this._change = fn;
    };
  }();

  His.onChange(function (index, arr) {
    //console.log('histories changed:', index, arr)
    if (arr.length == 0) {
      $scope.canGoBack = false;
      $scope.canGoAhead = false;
    } else {
      $scope.canGoBack = index > 0;
      $scope.canGoAhead = index < arr.length - 1;
    }
  });

  function goBack() {
    var addr = His.goBack();
    //console.log('-->',addr);
    $scope.address = addr.url;
    $scope.$emit('wosAddressChange', addr.url);
  }
  function goAhead() {
    var addr = His.goAhead();
    //console.log('-->',addr);
    $scope.address = addr.url;
    $scope.$emit('wosAddressChange', addr.url);
  }
  /************ 历史记录前进后退 end **************/

  $scope.$on('filesViewReady', function () {

    goHome();

    $scope.$on('goToWosAddress', function (e, addr) {
      console.log('on:goToWosAddress', addr);
      $scope.address = addr;
      go();
    });
  });

  function goHome() {
    var defaultAddress = getDefaultAddress();
    if ($scope.address != defaultAddress) {
      $scope.address = defaultAddress;
      go(true);
    } else {
      go();
    }
  }

  //保存默认地址
  function saveDefaultAddress() {
    AuthInfo.saveToAuthInfo({ address: $scope.address });
    Toast.success(T('saveAsHome.success'), 1000); //'设置默认地址成功'
  }
  function getDefaultAddress() {
    var info = AuthInfo.get();
    return info['wospath'] || info['address'] || DEF_ADDR;
  }

  //修正 address
  function getAddress() {
    var addr = $scope.address;
    if (!addr) {
      $scope.address = DEF_ADDR;
      return DEF_ADDR;
    }

    if (addr == DEF_ADDR) {
      return addr;
    }

    if (addr.indexOf(DEF_ADDR) !== 0) {
      addr = addr.replace(/(^\/*)|(\/*$)/g, '');
      $scope.address = addr ? DEF_ADDR + addr + '/' : DEF_ADDR;
    } else {
      //$scope.address = $scope.address.replace(/(\/*$)/g,'') + '/';
    }
    return $scope.address;
  }

  //浏览
  function go(force) {
    var addr = getAddress();
    His.add(addr); //历史记录
    $scope.$emit('wosAddressChange', addr, force);
  }
  //向上
  function goUp() {
    var addr = getAddress();
    if (addr == DEF_ADDR) {
      return go();
    }

    addr = addr.substring(DEF_ADDR.length);
    addr = addr.replace(/(^\/*)|(\/*$)/g, '');

    var arr = addr.split('/');

    arr.pop();
    if (arr.length === 0) {
      addr = DEF_ADDR;
    } else {
      addr = DEF_ADDR + arr.join('/') + '/';
    }
    $scope.address = addr;
    go();
  }
}]);
'use strict';

angular.module('web').controller('batchRestoreModalCtrl', ['$scope', '$uibModalInstance', '$translate', 'wos', 'item', 'currentInfo', 'callback', 'Toast', 'safeApply', function ($scope, $modalInstance, $translate, wos, items, currentInfo, callback, Toast, safeApply) {
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
    for (let i in items) {
      wos.getFileInfo(currentInfo.region, currentInfo.bucket, items[i].path).then(function (data) {
        if (data.Restore) {
          var info = parseRestoreInfo(data.Restore);
          if (info['ongoing-request'] == 'true') {
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
    angular.forEach(arr, function (n) {
      var kv = n.match(/([\w\-]+)=\"([^\"]+)\"/);
      m[kv[1]] = kv[2];
    });
    return m;
  };

  function cancel() {
    $modalInstance.dismiss('close');
  };

  function onSubmit(form1) {
    if (!form1.$valid) return;
    var days = $scope.info.days;
    Toast.info(T('restore.on')); //'提交中...'
    for (let i in items) {
      wos.restoreFile(currentInfo.region, currentInfo.bucket, items[i].path, days).then(function () {
        callback();
        cancel();
      });
    }
    Toast.success(T('restore.success')); //'恢复请求已经提交'
  };
}]);
'use strict';

angular.module('web').controller('listViewOptionsCtrl', ['$scope', function ($scope) {

  angular.extend($scope, {
    setListView: setListView
  });

  $scope.ref.isListView = getListView();

  function getListView() {
    return localStorage.getItem('is-list-view') == 'false' ? false : true;
  }
  function setListView(f) {
    $scope.ref.isListView = f;
    localStorage.setItem('is-list-view', f);
  }
}]);
'use strict';

angular.module('web').controller('subAddressBarCtrl', ['$scope', '$translate', 'Fav', 'AuthInfo', 'Toast', 'settingsSvs', function ($scope, $translate, Fav, AuthInfo, Toast, settingsSvs) {

  var DEF_ADDR = AuthInfo.get().wospath;
  var T = $translate.instant;

  angular.extend($scope, {
    address: DEF_ADDR,
    subAddress: '/',
    goUp: goUp,
    go: go,
    goHome: goHome,
    saveDefaultAddress: saveDefaultAddress,
    getDefaultAddress: getDefaultAddress,

    isFav: isFav,
    toggleFav: toggleFav,

    //历史，前进，后退
    canGoAhead: false,
    canGoBack: false,
    goBack: goBack,
    goAhead: goAhead
  });

  function isFav(addr) {
    return Fav.has(addr);
  }
  function toggleFav(addr) {
    if (isFav(addr)) {
      Fav.remove(addr);
      Toast.warn(T('bookmark.remove.success')); //'已删除书签'
    } else {
      var f = Fav.add(addr);
      if (f) Toast.success(T('bookmark.add.success')); //'添加书签成功'
      else Toast.warn(T('bookmark.add.error1')); //'添加书签失败: 超过最大限制'
    }
  }

  /************ 历史记录前进后退 start **************/
  var His = new function () {
    var arr = [];
    var index = -1;
    this.add = function (url) {
      if (index > -1 && url == arr[index].url) return;

      if (index < arr.length - 1) arr.splice(index + 1, arr.length - index);

      arr.push({ url: url, time: new Date().getTime() });
      index++;

      var MAX = settingsSvs.historiesLength.get();
      if (arr.length > MAX) {
        arr.splice(MAX, arr.length - MAX);
        index = arr.length - 1;
      }

      this._change(index, arr);
    };
    this.clear = function () {
      arr = [];
      index = -1;
      this._change(index, arr);
    };
    this.list = function () {
      return JSON.parse(JSON.stringify(arr));
    };
    this.goBack = function () {
      if (arr.length == 0) return null;
      if (index > 0) {
        index--;
        this._change(index, arr);
      }
      return arr[index];
    };
    this.goAhead = function () {
      if (arr.length == 0) return null;
      if (index < arr.length - 1) {
        index++;
        this._change(index, arr);
      }
      return arr[index];
    };

    //监听事件
    this.onChange = function (fn) {
      this._change = fn;
    };
  }();

  His.onChange(function (index, arr) {
    //console.log('histories changed:', index, arr)
    if (arr.length == 0) {
      $scope.canGoBack = false;
      $scope.canGoAhead = false;
    } else {
      $scope.canGoBack = index > 0;
      $scope.canGoAhead = index < arr.length - 1;
    }
  });

  function goBack() {
    var addr = His.goBack();
    //console.log('-->',addr);
    $scope.address = addr.url;
    $scope.subAddress = getSubAddress();
    $scope.$emit('wosAddressChange', addr.url);
  }
  function goAhead() {
    var addr = His.goAhead();
    //console.log('-->',addr);
    $scope.address = addr.url;
    $scope.subAddress = getSubAddress();
    $scope.$emit('wosAddressChange', addr.url);
  }
  /************ 历史记录前进后退 end **************/

  $scope.$on('filesViewReady', function () {

    goHome();

    $scope.$on('goToWosAddress', function (e, addr) {
      console.log('on:goToWosAddress', addr);
      $scope.address = addr;
      $scope.subAddress = getSubAddress();
      go();
    });
  });

  function goHome() {
    $scope.address = getDefaultAddress();
    $scope.subAddress = getSubAddress();
    go(true);
  }

  //保存默认地址
  function saveDefaultAddress() {
    AuthInfo.saveToAuthInfo({ address: $scope.address });
    Toast.success(T('saveAsHome.success'), 1000); //'设置默认地址成功'
  }
  function getDefaultAddress() {
    var info = AuthInfo.get();
    return info['wospath'] || info['address'] || DEF_ADDR;
  }

  //修正 address
  function getAddress() {
    var addr = $scope.address;
    if (!addr) {
      $scope.address = DEF_ADDR;
      $scope.subAddress = getSubAddress();
      length;
      return DEF_ADDR;
    }

    if (addr == DEF_ADDR) {
      return addr;
    }

    if (addr.indexOf(DEF_ADDR) !== 0) {
      addr = addr.replace(/(^\/*)|(\/*$)/g, '');
      $scope.address = addr ? DEF_ADDR + addr + '/' : DEF_ADDR;
      $scope.subAddress = getSubAddress();
    } else {
      //$scope.address = $scope.address.replace(/(\/*$)/g,'') + '/';
    }
    return $scope.address;
  }

  //浏览
  function go(force) {
    var addr = getAddress();
    His.add(addr); //历史记录
    console.log(addr);
    $scope.$emit('wosAddressChange', addr, force);
  }
  //向上
  function goUp() {
    var addr = getAddress();
    if (addr == DEF_ADDR) {
      return go();
    }

    addr = addr.substring(DEF_ADDR.length);
    addr = addr.replace(/(^\/*)|(\/*$)/g, '');

    var arr = addr.split('/');

    arr.pop();
    if (arr.length === 0) {
      addr = DEF_ADDR;
    } else {
      addr = DEF_ADDR + arr.join('/') + '/';
    }
    $scope.address = addr;
    $scope.subAddress = getSubAddress();
    go();
  }

  function getSubAddress(addr) {
    addr = addr || $scope.address;
    addr = addr.substring(DEF_ADDR.length);
    return addr == '/' ? '/' : '/' + addr;
  }
}]);
'use strict';

angular.module('web').controller('addBucketModalCtrl', ['$scope', '$uibModalInstance', '$translate', 'callback', 'wos', 'Const', 'Toast', function ($scope, $modalInstance, $translate, callback, wos, Const, Toast) {
  var T = $translate.instant;

  var bucketACL = angular.copy(Const.bucketACL);
  var regions = angular.copy(Const.regions);
  var storageClassesMap = {};
  angular.forEach(regions, function (n) {
    storageClassesMap[n.id] = n.storageClasses;
  });

  angular.extend($scope, {
    bucketACL: [], //angular.copy(Const.bucketACL),
    regions: [],
    cancel: cancel,
    onSubmit: onSubmit,
    storageClasses: [],
    item: {
      acl: bucketACL[0].acl,
      //region: regions[0].id,
      storageClass: 'Standard'
    },
    reg: /^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/,
    onRegionChanged: onRegionChanged,
    openURL: function (v) {
      openExternal(v);
    }
  });

  i18nStorageClassesType();
  i18nBucketACL();
  i18nRegion();

  function i18nRegion() {
    var arr = angular.copy(Const.regions);
    //console.log(arr);
    angular.forEach(arr, function (n) {
      n.label = T('region.' + n.id);
    });
    $scope.regions = arr;
  }

  function i18nBucketACL() {
    var arr = angular.copy(Const.bucketACL);
    angular.forEach(arr, function (n) {
      n.label = T('aclType.' + n.acl);
    });
    $scope.bucketACL = arr;
  }

  function i18nStorageClassesType() {
    var arr = angular.copy(storageClassesMap[$scope.item.region]);
    angular.forEach(arr, function (n) {
      n.name = T('storageClassesType.' + n.value.toLowerCase());
    });
    $scope.storageClasses = arr;
  }

  function onRegionChanged() {
    //console.log(storageClassesMap, $scope.item.region)
    i18nStorageClassesType();
    // if(['wos-cn-beijing','wos-cn-hangzhou'].indexOf($scope.item.region)==-1){
    //   $scope.storageClasses=[{value:'Standard',name:'标准类型'},{value:'IA',name:'低频访问类型'}];
    // }else{
    //   $scope.storageClasses=[{value:'Standard',name:'标准类型'},{value:'IA',name:'低频访问类型'},{value:'Archive',name:'归档类型'}];
    // }
    $scope.item.storageClass = 'Standard';
  }

  function cancel() {
    $modalInstance.dismiss('cancel');
  }

  function onSubmit(form) {
    if (!form.name.$valid) {
      Toast.error(T('bucket.add.name.invalid')); //'bucket名称无效'
      return;
    }
    if (!form.$valid) return;
    var item = angular.copy($scope.item);

    wos.createBucket(item.region, item.name, item.acl, item.storageClass).then(function (result) {

      callback();
      cancel();
    });
  }
}]);
'use strict';

angular.module('web').controller('addFolderModalCtrl', ['$scope', '$uibModalInstance', 'currentInfo', 'callback', 'wos', function ($scope, $modalInstance, currentInfo, callback, wos) {

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
    if (!form.$valid) return;

    var folderName = $scope.item.name;

    wos.createFolder(currentInfo.region, currentInfo.bucket, currentInfo.key + folderName + '/').then(function () {
      callback();
      cancel();
    });
  }
}]);
'use strict';

angular.module('web').controller('bucketMultipartModalCtrl', ['$scope', '$q', '$uibModalInstance', '$translate', 'Dialog', 'bucketInfo', 'Toast', 'wos', 'safeApply', function ($scope, $q, $modalInstance, $translate, Dialog, bucketInfo, Toast, wos, safeApply) {
  var T = $translate.instant;

  angular.extend($scope, {
    bucketInfo: bucketInfo,
    cancel: cancel,
    refresh: refresh,
    showDelete: showDelete,
    sch: {
      txt: '',
      limitTo: 20
    },
    loadNext: loadNext,

    //全选相关
    sel: {
      all: false, //boolean
      has: false, //[] item: wosObject={name,path,...}
      x: {} //{} {'i_'+$index, true|false}
    },
    selectAll: selectAll,
    selectChanged: selectChanged
  });

  function loadNext() {
    $scope.sch.limitTo += 20;
  }

  refresh();

  function refresh() {
    initSelect();
    $scope.isLoading = true;
    listUploads(function () {
      $scope.isLoading = false;
    });
  }
  function listUploads(fn) {
    wos.listAllUploads(bucketInfo.region, bucketInfo.name).then(function (result) {
      $scope.items = result;
      if (fn) fn();
    });
  }

  function cancel() {
    $modalInstance.dismiss('cancel');
  }

  function showDelete(items) {
    var title = T('delete.multiparts.title'); //删除碎片
    var message = T('delete.multiparts.message', { num: items.length }); //删除碎片
    Dialog.confirm(title, message, function (b) {
      if (b) {
        Toast.success(T('delete.multiparts.on')); //'正在删除碎片...'
        wos.abortAllUploads(bucketInfo.region, bucketInfo.name, items).then(function () {
          Toast.success(T('delete.multiparts.success')); //'删除碎片成功'
          refresh();
        });
      }
    }, 1);
  }

  ////////////////////////////////
  function initSelect() {
    $scope.sel.all = false;
    $scope.sel.has = false;
    $scope.sel.x = {};
  }
  function selectAll() {
    var f = $scope.sel.all;
    $scope.sel.has = f ? $scope.items : false;
    var len = $scope.items.length;
    for (var i = 0; i < len; i++) {
      $scope.sel.x['i_' + i] = f;
    }
  }

  function selectChanged() {
    var len = $scope.items.length;
    var all = true;
    var has = false;
    for (var i = 0; i < len; i++) {
      if (!$scope.sel.x['i_' + i]) {
        all = false;
      } else {
        if (!has) has = [];
        has.push($scope.items[i]);
      }
    }
    $scope.sel.all = all;
    $scope.sel.has = has;
  }
  ////////////////////////////////
}]);
'use strict';

angular.module('web').controller('crcModalCtrl', ['$scope', '$q', '$uibModalInstance', 'item', 'currentInfo', 'wos', 'safeApply', function ($scope, $q, $modalInstance, item, currentInfo, wos, safeApply) {

  angular.extend($scope, {
    item: item,
    info: {},
    currentInfo: currentInfo,
    openDoc: openDoc,
    cancel: cancel
  });

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function openDoc() {
    openExternal('https://help.aliyun.com/document_detail/43394.html');
  }

  init();

  function init() {
    wos.getFileInfo(currentInfo.region, currentInfo.bucket, item.path).then(function (data) {
      $scope.info = data;
      safeApply($scope);
    });
  }
}]);
'use strict';

// isLog==1 open else close
var isLog = localStorage.getItem('logFile') || 0;
var isLogInfo = localStorage.getItem('logFileInfo') || 0;
//本地日志收集模块
var log = require('electron-log');

angular.module('web').controller('deleteFilesModalCtrl', ['$scope', '$q', '$uibModalInstance', '$timeout', 'items', 'currentInfo', 'callback', 'wos', 'safeApply', function ($scope, $q, $modalInstance, $timeout, items, currentInfo, callback, wos, safeApply) {

  var l = "";
  for (var i = 0; i < items.length; i++) {
    l = l + items[i].path;
    if (i != items.length - 1) {
      l = l + ",";
    }
  }

  angular.extend($scope, {
    items: items,

    currentInfo: currentInfo,
    step: 1,
    start: start,
    stop: stop,
    close: close
  });

  function stop() {
    //$modalInstance.dismiss('cancel');
    $scope.isStop = true;
    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = 'info';
      log.info(`----stop remove ` + l);
    }
    wos.stopDeleteFiles();
  }
  function close() {
    $modalInstance.dismiss('cancel');
  }

  function start() {
    $scope.isStop = false;
    $scope.step = 2;
    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = 'info';
      log.info(`[${currentInfo.bucket}] ----start remove  ${l} `);
    }
    wos.deleteFiles(currentInfo.region, currentInfo.bucket, items, function (prog) {
      //进度
      $scope.progress = angular.copy(prog);
      safeApply($scope);
    }).then(function (terr) {
      //结果
      $scope.step = 3;
      $scope.terr = terr;
      callback();
      if (isLog == 1 && isLogInfo == 1) {
        log.transports.file.level = 'info';
        log.info(`[${currentInfo.bucket}] ----remove ${l} succeeded!`);
      }
    });
  }
}]);
'use strict';

angular.module('web').controller('fileSearchCtrl', ['$scope', '$rootScope', '$translate', '$state', '$uibModalInstance', 'Fav', 'Toast', 'wos', 'currentInfo', 'showFn', function ($scope, $rootScope, $translate, $state, $modalInstance, Fav, Toast, wos, currentInfo, showFn) {
    var T = $translate.instant;
    angular.extend($scope, {
        currentInfo: currentInfo,
        searchObjectName: '',
        items: [],
        lastItems: [],
        pageCount: 1000,
        isTruncated: false,
        marker: '',
        isEnd: false,
        isSearching: false,
        cancel: cancel,
        doFileSearch: doFileSearch,
        nextPage: nextPage,
        showPreview: showPreview,
        showFn: showFn
    });

    function doFileSearch() {
        initInfo();
        if ($scope.searchObjectName == '') {
            return;
        }
        $scope.isSearching = true;
        var info = angular.copy($scope.currentInfo);
        //info.key='';
        doNextPage(info);
    }

    function initInfo() {
        $scope.items = [];
        $scope.lastItems = [];
        $scope.isTruncated = false;
        $scope.marker = '';
        $scope.isEnd = false;
    }

    function nextPage() {
        if ($scope.searchObjectName == '') {
            return;
        }

        if ($scope.isEnd == true) {
            return;
        }

        $scope.isSearching = true;

        var info = angular.copy($scope.currentInfo);
        //info.key='';
        doNextPage(info);
    }

    async function doNextPage(info) {
        var currentCount = 0;
        do {
            await wos.listFilesRegex(info.region, info.bucket, info.key, $scope.marker || '').then(function (result) {
                var arr = result.data;
                $scope.marker = result.marker;
                $scope.isTruncated = result.isTruncated;
                if ($scope.isTruncated == false) {
                    $scope.isEnd = true;
                }

                for (var j = 0; j < $scope.lastItems.length; j++) {
                    currentCount++;
                    $scope.items.push($scope.lastItems[j]);
                }
                $scope.lastItems = [];

                for (var i = 0; i < arr.length; i++) {
                    var len = arr[i].path.length;
                    if (arr[i].path.substring(info.key.length, len).includes($scope.searchObjectName) == true) {
                        currentCount++;
                        if (currentCount <= $scope.pageCount) {
                            $scope.items.push(arr[i]);
                        } else {
                            $scope.lastItems.push(arr[i]);
                        }
                    }
                }
            }, function (err) {
                console.log(err);
            });
        } while ($scope.isTruncated == true && currentCount < $scope.pageCount);
        $scope.isSearching = false;
    }

    function cancel() {
        $modalInstance.dismiss('close');
    }

    function showPreview(item, type) {
        showFn.showPreview(item, type);
    }
}]);
'use strict';

angular.module('web').controller('getAddressModalCtrl', ['$scope', '$q', '$translate', '$uibModalInstance', 'item', 'currentInfo', 'wos', 'safeApply', 'Const', 'Mailer', 'Toast', function ($scope, $q, $translate, $modalInstance, item, currentInfo, wos, safeApply, Const, Mailer, Toast) {
  var T = $translate.instant;

  angular.extend($scope, {
    item: item,
    reg: {
      email: Const.REG.EMAIL
    },
    currentInfo: currentInfo,
    info: {
      sec: 3600,
      url: null,
      mailTo: ''
    },
    cancel: cancel,
    onSubmit: onSubmit,
    sendTo: sendTo
  });

  function cancel() {
    $modalInstance.dismiss('close');
  }

  init();

  function init() {
    $scope.isLoading = false;
    $scope.step = 2;
    var ignoreError = true;
    $scope.info.url = null;

    // var v = $scope.info.sec;
    // var url = wos.signatureUrl(currentInfo.region, currentInfo.bucket, item.path, v);
    //
    // $scope.isLoading = false;
    // $scope.info.url = url;
    // safeApply($scope);

    // $.ajax({
    //   url: item.url,
    //   headers: {
    //     'Range': 'bytes=0-1',
    //     'x-random': Math.random(),
    //     'Cache-Control': "no-cache"
    //   },
    //   complete: function (xhr) {
    //     $scope.isLoading = false;
    //     $scope.err = null;
    //     if (xhr.status >= 200 && xhr.status <= 300) {
    //       $scope.info.url = $scope.item.url;
    //       $scope.step = 1;
    //     } else if (xhr.status == 403) {
    //       $scope.step = 2;
    //     } else {
    //       $scope.err = xhr.responseText;
    //       $scope.step = 3;
    //     }
    //     safeApply($scope);
    //   }
    // });
  }

  function onSubmit(form1) {
    if (!form1.$valid) return;

    var v = $scope.info.sec;
    var url = wos.signatureUrl2(currentInfo.region, currentInfo.bucket, item.path, v);

    $scope.isLoading = false;
    $scope.info.url = url;
    // $scope.isLoading = true;
    // $.ajax({
    //   url: url,
    //   headers: {
    //     'Range': 'bytes=0-1',
    //     'x-random': Math.random(),
    //     'Cache-Control': "no-cache"
    //   },
    //   complete: function (xhr) {
    //     $scope.isLoading = false;
    //     if (xhr.status >= 200 && xhr.status <= 300) {
    //       $scope.err = null;
    //       $scope.info.url = url;
    //     } else {
    //       $scope.err = xhr.responseText;
    //       $scope.step = 3;
    //     }
    //     safeApply($scope);
    //   }
    // });
    safeApply($scope);
  }

  function sendTo(form1) {
    var url = $scope.info.url;

    if (!form1.email.$valid || !url) return;

    var t = [];
    var name = $scope.item.name;

    t.push(T('click.download') + ': <a href="' + url + '" target="_blank">' + name + '</a>'); //点此下载

    t.push(T('qrcode.download') + ':'); //扫码下载

    var src = $('#addr-qrcode-wrap canvas')[0].toDataURL("image/jpeg");
    t.push('<img src="' + src + '" style="width:300px;height:300px"/>');

    var sendInfo = {
      subject: T('file.download.address') + ':[' + name + ']',
      to: $scope.info.mailTo,
      html: t.join('<br/>')
    };
    //console.log(sendInfo)

    //发邮件
    Toast.info(T('mail.send.on'));
    Mailer.send(sendInfo).then(function (result) {
      console.log(result);
      Toast.success(T('mail.test.success'));
    }, function (err) {
      console.error(err);
      Toast.error(err);
    });
  }
}]);
'use strict';

angular.module('web').controller('grantModalCtrl', ['$scope', '$q', '$uibModalInstance', '$translate', 'items', 'currentInfo', 'ramSvs', 'wos', 'settingsSvs', 'subUserAKSvs', 'Mailer', 'Const', 'Toast', 'AuthInfo', 'safeApply', function ($scope, $q, $modalInstance, $translate, items, currentInfo, ramSvs, wos, settingsSvs, subUserAKSvs, Mailer, Const, Toast, AuthInfo, safeApply) {
  var T = $translate.instant;
  angular.extend($scope, {
    cancel: cancel,
    policyChange: policyChange,
    onSubmit: onSubmit,
    genUserName: genUserName,
    items: items,
    reg: {
      email: Const.REG.EMAIL
    },
    create: {
      UserName: '',
      Email: ''
    },
    grant: {
      toTypes: ['group', 'user', 'role'],
      toType: 'user',
      privTypes: ['readOnly', 'all'],
      privType: 'readOnly'
    },
    policyNameReg: /^[a-z0-9A-Z\-]{1,128}$/,
    mailSmtp: settingsSvs.mailSmtp.get(),
    showEmailSettings: function () {
      $scope.showSettings(function () {
        $scope.mailSmtp = settingsSvs.mailSmtp.get();
      });
    }
  });

  init();
  function init() {

    policyChange();
    var ignoreError = true;

    ramSvs.listUsers(ignoreError).then(function (result) {
      $scope.users = result;
    }, function (err) {
      $scope.users = [];
      if (err.message.indexOf('You are not authorized to do this action') != -1) {
        Toast.error(T('simplePolicy.noauth.message1')); //'没有权限获取用户列表'
      }
    });
    ramSvs.listGroups(ignoreError).then(function (result) {
      $scope.groups = result;
    }, function (err) {
      $scope.groups = [];
      if (err.message.indexOf('You are not authorized to do this action') != -1) {
        Toast.error(T('simplePolicy.noauth.message2')); //'没有权限获取用户组列表'
      }
    });
    ramSvs.listRoles(ignoreError).then(function (result) {
      $scope.roles = result;
    }, function (err) {
      $scope.roles = [];

      if (err.message.indexOf('You are not authorized to do this action') != -1) {
        Toast.error(T('simplePolicy.noauth.message3')); //'没有权限获取角色列表'
      }
    });
  }

  //Object的读操作包括：GetObject，HeadObject，CopyObject和UploadPartCopy中的对source object的读；
  //Object的写操作包括：PutObject，PostObject，AppendObject，DeleteObject，DeleteMultipleObjects，CompleteMultipartUpload以及CopyObject对新的Object的写。

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function genPolicy(privType) {
    var t = [];

    var actions = [];
    if (privType == 'readOnly') {
      actions = ['wos:Get*', 'wos:List*'];
    } else if (privType == 'readWrite') {
      actions = ['wos:Get*', 'wos:List*', 'wos:Put*', 'wos:AbortMultipartUpload'];
    } else if (privType == 'all') {
      actions = ['wos:*'];
    }

    angular.forEach($scope.items, function (item) {
      if (item.region || item.isFolder) {
        var bucket = item.region ? item.name : currentInfo.bucket;
        var key = item.path || '';

        t.push({
          "Effect": "Allow",
          "Action": ["wos:ListObjects"],
          "Resource": ["acs:wos:*:*:" + bucket],
          "Condition": {
            "StringLike": {
              "wos:Prefix": key + "*"
            }
          }
        });

        t.push({
          "Effect": "Allow",
          "Action": actions,
          "Resource": ["acs:wos:*:*:" + bucket + "/" + key + "*"]
        });
      } else {
        //文件所有权限
        t.push({
          "Effect": "Allow",
          "Action": ["wos:ListObjects"],
          "Resource": ["acs:wos:*:*:" + currentInfo.bucket],
          "Condition": {
            "StringLike": {
              "wos:Prefix": item.path
            }
          }
        });

        t.push({
          "Effect": "Allow",
          "Action": actions,
          "Resource": ["acs:wos:*:*:" + currentInfo.bucket + '/' + item.path]
        });
      }
    });

    return {
      "Version": "1",
      "Statement": t
    };
  }

  var policy;
  function policyChange() {
    var privType = $scope.grant.privType;
    policy = genPolicy(privType);
    $scope.grant.policy = JSON.stringify(policy, ' ', 2);

    var name = (Math.random() + '').substring(2);
    if ($scope.items && $scope.items.length == 1) {
      name = $scope.items[0].name; //.replace(/[\W_]+/g,'-');
    }
    $scope.grant.policyName = 'plc-' + privType + '-' + name;
  }

  function onSubmit(form1) {
    if (!form1.$valid) return false;

    checkCreateUser(function (username, sendInfo) {

      if (username) {
        $scope.grant.userName = username;
        ramSvs.listUsers(true).then(function (result) {
          $scope.users = result;
        });
      }

      var policyName = $scope.grant.policyName;

      var title = T('simplePolicy.title'); //简化policy授权
      var successMsg = T('simplePolicy.success'); //'应用policy成功'
      checkCreatePolicy(policyName, $scope.grant.policy, title).then(function () {
        switch ($scope.grant.toType) {
          case 'user':
            ramSvs.attachPolicyToUser(policyName, $scope.grant.userName).then(function () {
              //发邮件
              if (sendInfo) Mailer.send(sendInfo).then(function (result) {
                console.log(result);
                Toast.success(T('mail.test.success'));
              }, function (err) {
                console.error(err);
                Toast.error(err);
              });

              Toast.success(successMsg);
              cancel();
            });
            break;
          case 'group':
            ramSvs.attachPolicyToGroup(policyName, $scope.grant.groupName).then(function () {
              Toast.success(successMsg);
              cancel();
            });
            break;
          case 'role':
            ramSvs.attachPolicyToRole(policyName, $scope.grant.roleName).then(function () {
              Toast.success(successMsg);
              cancel();
            });
            break;
        }
      });
    });
  }
  function genUserName() {
    $scope.create.UserName = 'usr-' + new Date().getTime() + (Math.random() + '').substring(10);
  }

  function checkCreatePolicy(policyName, policy, title) {
    var df = $q.defer();
    return ramSvs.getPolicy(policyName, 'Custom', true).then(function (result) {
      console.log('getPolicy:', result);
      df.resolve(result.Policy);
    }, function (err) {
      ramSvs.createPolicy(policyName, policy, title).then(function (result) {
        console.log('createPolicy:', result);
        df.resolve(result.Policy);
      }, function (err) {
        df.reject(err);
      });
    });
    return df.promise;
  }

  function checkCreateUser(fn) {
    if ($scope.grant.toType != 'user') {
      fn();
      return;
    }

    if ($scope.grant.userName) {
      fn($scope.grant.userName);
    } else {
      var userName = $scope.create.UserName;
      var comments = [];
      var region = '';
      var bucket = '';
      angular.forEach($scope.items, function (n) {
        if (n.itemType == 'bucket') {
          region = n.region;
          bucket = n.name;
          comments.push('wos://' + n.name + '/');
        } else {
          region = currentInfo.region;
          bucket = currentInfo.bucket;
          comments.push('wos://' + currentInfo.bucket + '/' + n.path);
        }
      });
      ramSvs.createUser({
        UserName: userName,
        Email: $scope.create.Email,
        Comments: ($scope.grant.privType + ',' + comments.join(',')).substring(0, 100)
      }).then(function () {
        ramSvs.createAccessKey(userName).then(function (result) {
          //AccessKeyId
          //console.log(result.AccessKey);
          var id = result.AccessKey.AccessKeyId;
          var secret = result.AccessKey.AccessKeySecret;
          subUserAKSvs.save({
            AccessKeyId: id,
            AccessKeySecret: secret,
            UserName: userName
          });

          var sendInfo = getSendInfo(id, secret, userName, bucket, region, comments, $scope.create.Email, $scope.grant.privType);
          fn(userName, sendInfo);
        });
      });
    }
  }

  function getSendInfo(id, secret, userName, bucket, region, comments, toEmail, privType) {
    var eptpl = wos.getWosEndpoint(region, bucket, AuthInfo.get().eptpl);
    var opt = {
      id: id,
      secret: secret,
      desc: userName,
      region: region,
      wospath: comments[0],
      eptpl: eptpl
    };

    var tokenStr = new Buffer(JSON.stringify(opt)).toString('base64');

    var sendInfo = {
      //  AccessKeyId: result.AccessKey.AccessKeyId,
      //  AccessKeySecret: result.AccessKey.AccessKeySecret,
      //  UserName: userName,
      subject: T('grant.email.title'), // 'WOS Browser 授权',
      to: toEmail,
      html: `${T('grant.email.body.title')}<br/>
<br/>
1. ${T('auth.akLogin')}:<br/>
<br/>
子用户名(Sub User): ${userName}<br/>
AccessKeyId: ${id}<br/>
AccessKeySecret: ${secret}<br/>
区域(Region): ${region}<br/>
授权路径(wospath): ${comments.join(',<br/>')}<br/>
授予权限(permission): ${privType}<br/>
<br/>

2. ${T('auth.tokenLogin')}:<br/><br/>

<code>${tokenStr}</code>

<br/>
<hr/>
您可以使用 <a href="https://github.com/Wangsu-Cloud-Storage/wos-browser" target="_blank">WOS Browser</a> 浏览或管理这些文件。
`
      //   '子用户名(Sub User): '+userName+ '<br/>'
      // + 'AccessKeyId: '+result.AccessKey.AccessKeyId+ '<br/>'
      // + 'AccessKeySecret: '+ result.AccessKey.AccessKeySecret+ '<br/>'
      // + '区域(Region): '+ currentInfo.region  + '<br/>'
      // + '授予权限(permission): '+$scope.grant.privType + '<br/>'
      // + '授权路径(wospath): ' + comments.join(',<br/>')
      // + '<hr/>'
      // + '您可以使用 <a href="https://github.com/Wangsu-Cloud-Storage/wos-browser" target="_blank">WOS Browser</a> 浏览或管理这些文件。'
    };
    return sendInfo;
  }
}]);
'use strict';

angular.module('web').controller('grantTokenModalCtrl', ['$scope', '$q', '$uibModalInstance', '$translate', 'item', 'currentInfo', 'ramSvs', 'wos', 'AuthInfo', 'stsSvs', 'Toast', 'safeApply', function ($scope, $q, $modalInstance, $translate, item, currentInfo, ramSvs, wos, AuthInfo, stsSvs, Toast, safeApply) {
  var T = $translate.instant;
  angular.extend($scope, {
    cancel: cancel,
    policyChange: policyChange,
    onSubmit: onSubmit,
    item: item,
    grant: {
      //privTypes: ['readOnly','all'],
      durSeconds: 3600,
      privType: 'readOnly'
    },
    openExternal: openExternal,
    policyNameReg: /^[a-z0-9A-Z\-]{1,128}$/,
    message5: {
      object: item.name,
      type: item.isBucket ? "Bucket" : T('folder'),
      privilege: T('privilege.readonly'),
      expiration: ''
    }
  });

  $scope.$watch('grant.privType', function (v) {
    $scope.message5.privilege = T('privilege.' + v.toLowerCase());
  });

  init();
  function init() {

    policyChange();
    var ignoreError = true;

    ramSvs.listRoles(ignoreError).then(function (result) {
      $scope.roles = result;
    }, function (err) {
      $scope.roles = [];

      if (err.message.indexOf('You are not authorized to do this action') != -1) {
        Toast.error(T('simplePolicy.noauth.message3')); //'没有权限获取角色列表'
      }
    });
  }

  //Object的读操作包括：GetObject，HeadObject，CopyObject和UploadPartCopy中的对source object的读；
  //Object的写操作包括：PutObject，PostObject，AppendObject，DeleteObject，DeleteMultipleObjects，CompleteMultipartUpload以及CopyObject对新的Object的写。

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function genPolicy(privType) {
    var t = [];

    var actions = [];
    if (privType == 'readOnly') {
      actions = ['wos:Get*', 'wos:List*'];
    } else if (privType == 'readWrite') {
      actions = ['wos:Get*', 'wos:List*', 'wos:Put*', 'wos:DeleteObject', 'wos:AbortMultipartUpload'];
    } else if (privType == 'all') {
      actions = ['wos:*'];
    }

    var item = angular.copy($scope.item);

    if (item.region || item.isFolder) {
      var bucket = item.region ? item.name : currentInfo.bucket;
      var key = item.path || '';

      t.push({
        "Effect": "Allow",
        "Action": ["wos:ListObjects"],
        "Resource": ["acs:wos:*:*:" + bucket],
        "Condition": {
          "StringLike": {
            "wos:Prefix": key + "*"
          }
        }
      });

      t.push({
        "Effect": "Allow",
        "Action": actions,
        "Resource": ["acs:wos:*:*:" + bucket + "/" + key + "*"]
      });
    } else {
      //文件所有权限
      t.push({
        "Effect": "Allow",
        "Action": ["wos:ListObjects"],
        "Resource": ["acs:wos:*:*:" + currentInfo.bucket],
        "Condition": {
          "StringLike": {
            "wos:Prefix": item.path
          }
        }
      });

      t.push({
        "Effect": "Allow",
        "Action": actions,
        "Resource": ["acs:wos:*:*:" + currentInfo.bucket + '/' + item.path]
      });
    }

    return {
      "Version": "1",
      "Statement": t
    };
  }

  var policy;
  function policyChange() {
    var privType = $scope.grant.privType;
    policy = genPolicy(privType);
    $scope.grant.policy = JSON.stringify(policy, ' ', 2);

    // var name =  (Math.random()+'').substring(2);
    // name = $scope.item.name.replace(/[\W_]+/g,'-');
    // $scope.grant.policyName = name;
  }

  function onSubmit(form1) {
    if (!form1.$valid) return false;
    //var policyName= $scope.grant.policyName;
    var info = angular.copy($scope.grant);
    var item = angular.copy($scope.item);
    var region = item.region || currentInfo.region;
    var bucket = item.region ? item.name : currentInfo.bucket;
    var key = item.path || '';
    var eptpl = wos.getWosEndpoint(region, bucket, AuthInfo.get().eptpl);

    //console.log(info)

    stsSvs.assumeRole(info.roleArn, info.policy, info.durSeconds).then(function (result) {
      //console.log(result)

      $scope.origin_token = result;

      var credentials = angular.copy(result.Credentials);

      var tokenInfo = {
        id: credentials.AccessKeyId,
        secret: credentials.AccessKeySecret,
        stoken: credentials.SecurityToken,
        expiration: credentials.Expiration,
        region: region,
        wospath: 'wos://' + bucket + '/' + key,
        privilege: info.privType,
        eptpl: eptpl
      };

      $scope.token = Buffer.from(JSON.stringify(tokenInfo)).toString('base64');

      $scope.message5.expiration = moment(new Date(result.Credentials.Expiration)).format('YYYY-MM-DD HH:mm:ss');
    }, function (err) {
      console.log(err);
    });
  }
}]);
'use strict';

// isLog==1 open else close
var isLog = localStorage.getItem('logFile') || 0;
var isLogInfo = localStorage.getItem('logFileInfo') || 0;
//本地日志收集模块
var log = require('electron-log');

angular.module('web').controller('moveModalCtrl', ['$scope', '$uibModalInstance', '$timeout', 'items', 'isCopy', 'renamePath', 'fromInfo', 'moveTo', 'callback', 'wos', 'Toast', 'AuthInfo', 'safeApply', function ($scope, $modalInstance, $timeout, items, isCopy, renamePath, fromInfo, moveTo, callback, wos, Toast, AuthInfo, safeApply) {

  var authInfo = AuthInfo.get();

  var l = "";
  for (var i = 0; i < items.length; i++) {
    l = l + items[i].path;
    if (i != items.length - 1) {
      l = l + ",";
    }
  }

  angular.extend($scope, {
    renamePath: renamePath,
    fromInfo: fromInfo,
    items: items,
    isCopy: isCopy,
    step: 2,

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
      key: moveTo.key
    },
    canMove: false
  });

  //$scope.originPath = 'wos://'+currentInfo.bucket+'/'+currentInfo.key;
  start();

  function stop() {
    //$modalInstance.dismiss('cancel');
    $scope.isStop = true;
    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = 'info';
      log.info(`----stop move ` + l);
    }
    wos.stopCopyFiles();
  }

  function cancel() {
    $modalInstance.dismiss('cancel');
  }

  function start() {
    $scope.isStop = false;
    $scope.step = 2;
    var target = angular.copy($scope.moveTo);
    var items = angular.copy($scope.items);

    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = 'info';
      log.info(`[${fromInfo.bucket}] ----start move ` + l + ",to target:" + target.key);
    }

    angular.forEach(items, function (n) {
      //n.region = currentInfo.region;
      n.bucket = fromInfo.bucket;
    });

    //console.log(fromInfo.region, items, target, renamePath);

    //复制 or 移动
    wos.copyFiles(fromInfo.region, items, target, function progress(prog) {
      //进度
      $scope.progress = angular.copy(prog);

      safeApply($scope);
    }, !isCopy, renamePath).then(function (terr) {
      //结果
      $scope.step = 3;
      $scope.terr = terr;
      callback();
    });
    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = 'info';
      log.info(`[${fromInfo.bucket}] ----move ` + l + ",to target:" + target.key + "succeeded");
    }
  }
}]);
'use strict';

// isLog==1 open else close
var isLog = localStorage.getItem('logFile') || 0;
var isLogInfo = localStorage.getItem('logFileInfo') || 0;
//本地日志收集模块
var log = require('electron-log');

angular.module('web').controller('renameModalCtrl', ['$scope', '$uibModalInstance', '$translate', '$uibModal', 'item', 'isCopy', 'currentInfo', 'moveTo', 'callback', 'wos', 'Dialog', 'Toast', function ($scope, $modalInstance, $translate, $modal, item, isCopy, currentInfo, moveTo, callback, wos, Dialog, Toast) {
  var T = $translate.instant;
  //console.log(item)
  angular.extend($scope, {
    currentInfo: currentInfo,
    moveTo: moveTo,
    item: item,
    isCopy: isCopy,
    keep: {
      name: item.name
    },
    cancel: cancel,
    onSubmit: onSubmit,
    reg: {
      folderName: /^[^\/]+$/
    },
    isLoading: false
  });

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function onSubmit(form) {
    if (!form.$valid) return;

    var title = T('whetherCover.title'); //是否覆盖
    var msg1 = T('whetherCover.message1'); //已经有同名目录，是否覆盖?
    var msg2 = T('whetherCover.message2'); //已经有同名文件，是否覆盖?
    //console.log(title, msg1,msg2)

    if ($scope.item.isFolder) {
      var newPath = moveTo.key == '' ? item.name : moveTo.key.replace(/(\/$)/, '') + '/' + item.name;
      newPath += '/';
      //console.log(item.path, newPath)
      if (item.path == newPath) return;

      $scope.isLoading = true;
      wos.checkFolderExists(moveTo.region, moveTo.bucket, newPath).then(function (has) {
        if (has) {
          Dialog.confirm(title, msg1, function (b) {
            if (b) {
              showMoveFolder(newPath);
            } else {
              $scope.isLoading = false;
            }
          });
        } else {
          showMoveFolder(newPath);
        }
      }, function (err) {
        $scope.isLoading = false;
      });
    } else {
      var newPath = moveTo.key == '' ? item.name : moveTo.key.replace(/(\/$)/, '') + '/' + item.name;
      if (item.path == newPath) return;

      //suffix
      // if(path.extname(item.path)!=path.extname(newPath)){
      //   if(!confirm('确定要修改后缀名吗?')){
      //     return;
      //   }
      // }

      $scope.isLoading = true;

      wos.checkFileExists(moveTo.region, moveTo.bucket, newPath).then(function (data) {
        Dialog.confirm(title, msg2, function (b) {
          if (b) {
            renameFile(newPath);
          } else {
            $scope.isLoading = false;
          }
        });
      }, function (err) {
        renameFile(newPath);
      });
    }
  }
  function renameFile(newPath) {
    var onMsg = T('rename.on'); //正在重命名...
    var successMsg = T('rename.success'); //重命名成功

    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = 'info';
      log.info(`[${currentInfo.bucket}] ----start rename  source path:` + item.path + " ,new path :" + newPath);
    }

    Toast.info(onMsg);
    wos.moveFile(currentInfo.region, currentInfo.bucket, item.path, newPath, isCopy).then(function () {
      Toast.success(successMsg);
      $scope.isLoading = false;
      callback();
      cancel();
      if (isLog == 1 && isLogInfo == 1) {
        log.transports.file.level = 'info';
        log.info(`[${currentInfo.bucket}] ----rename  source path:` + item.path + " ,new path :" + newPath + " succeeded!");
      }
    }, function () {
      $scope.isLoading = false;
    });
  }

  function showMoveFolder(newPath) {
    var successMsg = T('rename.success'); //重命名成功
    $modal.open({
      templateUrl: 'main/files/modals/move-modal.html',
      controller: 'moveModalCtrl',
      backdrop: 'static',
      resolve: {
        items: function () {
          return angular.copy([item]);
        },
        moveTo: function () {
          return angular.copy(moveTo);
        },
        renamePath: function () {
          return newPath;
        },
        isCopy: function () {
          return isCopy;
        },
        fromInfo: function () {
          return angular.copy(currentInfo);
        },
        callback: function () {
          return function () {
            Toast.success(successMsg);
            $scope.isLoading = false;
            callback();
            cancel();
          };
        }
      }
    });
  }
}]);
'use strict';

angular.module('web').controller('restoreModalCtrl', ['$scope', '$uibModalInstance', '$translate', 'wos', 'item', 'currentInfo', 'callback', 'Toast', 'safeApply', function ($scope, $modalInstance, $translate, wos, item, currentInfo, callback, Toast, safeApply) {
  var T = $translate.instant;
  angular.extend($scope, {
    currentInfo: currentInfo,
    item: item,
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
    wos.getFileInfo(currentInfo.region, currentInfo.bucket, item.path).then(function (data) {
      if (data.Restore) {
        var info = parseRestoreInfo(data.Restore);
        if (info['ongoing-request'] == 'true') {
          $scope.info.type = 2;
          //$scope.info.msg = '正在恢复中，请耐心等待！';
        } else {
          $scope.info.type = 3;
          $scope.info.expiry_date = info['expiry-date'];
          //$scope.info.msg = '可读截止时间：'+ info['expiry-date']
        }
      } else {
        $scope.info.type = 1;
        // $scope.info.msg = null;
      }

      $scope.isLoading = false;
      safeApply($scope);
    });
  }

  function parseRestoreInfo(s) {
    //"ongoing-request="true"
    var arr = s.match(/([\w\-]+)=\"([^\"]+)\"/g);
    var m = {};
    angular.forEach(arr, function (n) {
      var kv = n.match(/([\w\-]+)=\"([^\"]+)\"/);
      m[kv[1]] = kv[2];
    });
    return m;
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function onSubmit(form1) {
    if (!form1.$valid) return;

    var days = $scope.info.days;

    Toast.info(T('restore.on')); //'提交中...'
    wos.restoreFile(currentInfo.region, currentInfo.bucket, item.path, days).then(function () {
      Toast.success(T('restore.success')); //'恢复请求已经提交'
      callback();
      cancel();
    });
  }
}]);
'use strict';

angular.module('web').controller('updateACLModalCtrl', ['$scope', '$uibModalInstance', '$translate', 'item', 'currentInfo', 'wos', 'Toast', 'safeApply', function ($scope, $modalInstance, $translate, item, currentInfo, wos, Toast, safeApply) {
  var T = $translate.instant;

  angular.extend($scope, {
    currentInfo: currentInfo,
    item: item,
    cancel: cancel,
    onSubmit: onSubmit,
    info: {
      acl: 'default'
    }
  });

  wos.getACL(currentInfo.region, currentInfo.bucket, item.path).then(function (res) {
    $scope.info.acl = res.acl || 'default';
    safeApply($scope);
  });

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function onSubmit(form) {
    if (!form.$valid) return;
    var acl = $scope.info.acl;
    wos.updateACL(currentInfo.region, currentInfo.bucket, item.path, acl).then(function (res) {
      Toast.success(T('acl.update.success')); //'修改ACL权限成功'
      cancel();
    });
  }
}]);
'use strict';

angular.module('web').controller('updateBucketModalCtrl', ['$scope', '$uibModalInstance', '$translate', 'item', 'callback', 'wos', 'safeApply', 'Const', function ($scope, $modalInstance, $translate, item, callback, wos, safeApply, Const) {
  var T = $translate.instant;
  var bucketACL = angular.copy(Const.bucketACL);
  var regions = angular.copy(Const.regions);

  angular.extend($scope, {
    bucketACL: [], //angular.copy(Const.bucketACL),
    //regions: angular.copy(Const.regions),
    cancel: cancel,
    onSubmit: onSubmit,
    item: item
  });

  i18nBucketACL();

  function i18nBucketACL() {
    var arr = angular.copy(Const.bucketACL);
    angular.forEach(arr, function (n) {
      n.label = T('aclType.' + n.acl);
    });
    $scope.bucketACL = arr;
  }

  wos.getBucketACL(item.region, item.name).then(function (result) {
    $scope.item.acl = result.acl;
    safeApply($scope);
  });

  function cancel() {
    $modalInstance.dismiss('cancel');
  }

  function onSubmit(form) {
    if (!form.$valid) return;
    var item = angular.copy($scope.item);

    wos.updateBucketACL(item.region, item.name, item.acl).then(function (result) {
      callback();
      cancel();
    });
  }
}]);
'use strict';

angular.module('web').controller('updateHttpHeadersModalCtrl', ['$scope', '$q', '$translate', '$uibModalInstance', 'item', 'currentInfo', 'wos', 'Toast', 'safeApply', function ($scope, $q, $translate, $modalInstance, item, currentInfo, wos, Toast, safeApply) {

  var T = $translate.instant;
  angular.extend($scope, {
    item: item,
    currentInfo: currentInfo,
    //metas: {},
    headers: {},
    metaItems: [],
    cancel: cancel,
    onSubmit: onSubmit
  });

  function cancel() {
    $modalInstance.dismiss('close');
  }

  init();
  function init() {
    $scope.isLoading = true;
    $scope.step = 2;
    var ignoreError = true;

    wos.getMeta(currentInfo.region, currentInfo.bucket, item.path).then(function (result) {

      $scope.headers = {
        'ContentLanguage': result.ContentLanguage,
        'ContentType': result.ContentType,
        'CacheControl': result.CacheControl,
        'ContentDisposition': result.ContentDisposition,
        'ContentEncoding': result.ContentEncoding,
        'Expires': result.Expires
      };
      //$scope.metas = result.Metadata;

      var t = [];
      for (var k in result.Metadata) {
        t.push({ key: k, value: result.Metadata[k] });
      }
      $scope.metaItems = t;

      safeApply($scope);
    });
  }

  function onSubmit(form1) {
    if (!form1.$valid) return;

    var headers = angular.copy($scope.headers);
    var metaItems = angular.copy($scope.metaItems);

    for (var k in headers) {
      if (!headers[k]) delete headers[k];
    }

    var metas = {};
    angular.forEach(metaItems, function (n) {
      if (n.key && n.value) metas[n.key] = n.value;
    });
    //console.log(headers, metas)
    Toast.info(T('setting.on')); //'正在设置..'

    wos.setMeta(currentInfo.region, currentInfo.bucket, item.path, headers, metas).then(function (result) {
      Toast.success(T('setting.success')); //'设置成功'
      cancel();
    });
  }
}]);
'use strict';

angular.module('web').controller('transferDownloadsCtrl', ['$scope', '$timeout', '$translate', '$interval', 'jobUtil', 'wosDownloadManager', 'DelayDone', 'Toast', 'Dialog', 'safeApply', function ($scope, $timeout, $translate, $interval, jobUtil, wosDownloadManager, DelayDone, Toast, Dialog, safeApply) {
  var T = $translate.instant;
  angular.extend($scope, {
    showRemoveItem: showRemoveItem,
    clearAllCompleted: clearAllCompleted,
    clearAll: clearAll,
    stopAll: stopAll,
    startAll: startAll,
    checkStartJob: checkStartJob,
    openLocaleFolder: function (item) {
      var suffix = item.status == 'finished' ? '' : '.download';
      openLocaleFolder(item.to.path + suffix);
    },

    sch: {
      downname: null
    },
    schKeyFn: function (item) {
      return item.to.name + ' ' + item.status + ' ' + jobUtil.getStatusLabel(item.status);
    },
    limitToNum: 100,
    loadMoreDownloadItems: loadMoreItems
  });

  function loadMoreItems() {
    var len = $scope.lists.downloadJobList.length;
    if ($scope.limitToNum < len) {
      $scope.limitToNum += Math.min(100, len - $scope.limitToNum);
    }
  }

  function checkStartJob(item) {
    item.wait();
    wosDownloadManager.checkStart();
  }

  function showRemoveItem(item) {

    if (item.status == 'finished') {
      doRemove(item);
    } else {
      var title = T('remove.from.list.title'); //'从列表中移除'
      var message = T('remove.from.list.message'); //'确定移除该下载任务?'
      Dialog.confirm(title, message, function (btn) {
        if (btn) {
          doRemove(item);
        }
      }, 1);
    }
  }

  function doRemove(item) {
    var arr = $scope.lists.downloadJobList;
    for (var i = 0; i < arr.length; i++) {
      if (item === arr[i]) {
        arr.splice(i, 1);
        break;
      }
    }
    wosDownloadManager.saveProg();
    $scope.calcTotalProg();
    safeApply($scope);
  }

  function clearAllCompleted() {
    var arr = $scope.lists.downloadJobList;
    for (var i = 0; i < arr.length; i++) {
      if ('finished' == arr[i].status) {
        arr.splice(i, 1);
        i--;
      }
    }

    $scope.calcTotalProg();
  }

  function clearAll() {
    if (!$scope.lists.downloadJobList || $scope.lists.downloadJobList.length == 0) {
      return;
    }
    var title = T('clear.all.title'); //清空所有
    var message = T('clear.all.download.message'); //确定清空所有下载任务?
    Dialog.confirm(title, message, function (btn) {
      if (btn) {
        var arr = $scope.lists.downloadJobList;
        for (var i = 0; i < arr.length; i++) {
          var n = arr[i];
          if (n.status == 'running' || n.status == 'waiting' || n.status == 'verifying' || n.status == 'retrying') n.stop();
          arr.splice(i, 1);
          i--;
        }
        $scope.calcTotalProg();
        wosDownloadManager.saveProg();
      }
    }, 1);
  }

  var stopFlag = false;

  function stopAll() {
    var arr = $scope.lists.downloadJobList;
    if (arr && arr.length > 0) {
      stopFlag = true;

      wosDownloadManager.stopCreatingJobs();

      Toast.info(T('pause.on')); //'正在暂停...'
      $scope.allActionBtnDisabled = true;

      angular.forEach(arr, function (n) {
        if (n.status == 'running' || n.status == 'waiting' || n.status == 'verifying' || n.status == 'retrying') n.stop();
      });
      Toast.success(T('pause.success')); //'暂停成功'

      $timeout(function () {
        wosDownloadManager.saveProg();
        $scope.allActionBtnDisabled = false;
      }, 100);
    }
  }

  function startAll() {
    var arr = $scope.lists.downloadJobList;
    stopFlag = false;

    //串行
    if (arr && arr.length > 0) {
      $scope.allActionBtnDisabled = true;
      DelayDone.seriesRun(arr, function eachItemFn(n, fn) {
        if (stopFlag) return;

        if (n && (n.status == 'stopped' || n.status == 'failed')) {
          n.wait();
        }
        wosDownloadManager.checkStart();
        fn();
      }, function doneFy() {
        $scope.allActionBtnDisabled = false;
      });
    }
  }
}]);
'use strict';

angular.module('web').controller('transferFrameCtrl', ['$scope', '$translate', 'wosUploadManager', 'wosDownloadManager', 'Toast', 'safeApply', function ($scope, $translate, wosUploadManager, wosDownloadManager, Toast, safeApply) {
  var T = $translate.instant;
  angular.extend($scope, {
    lists: {
      uploadJobList: [],
      downloadJobList: []
    },

    totalProg: { loaded: 0, total: 0 },
    totalNum: { running: 0, total: 0, upDone: 0, downDone: 0,
      upFailed: 0, upStopped: 0,
      downFailed: 0, downStopped: 0 },
    calcTotalProg: calcTotalProg,

    transTab: 1

  });

  //functions in parent scope
  $scope.handlers.uploadFilesHandler = uploadFilesHandler;

  $scope.handlers.downloadFilesHandler = downloadFilesHandler;

  wosUploadManager.init($scope);
  wosDownloadManager.init($scope);

  //  $scope.netInit().then(function(){
  //    //确认是否可以使用内部网络，再初始化
  //    wosUploadManager.init($scope);
  //    wosDownloadManager.init($scope);
  //  });


  /**
   * 下载
   * @param fromWosPath {array}  item={region, bucket, path, name, size=0, isFolder=false}  有可能是目录，需要遍历
   * @param toLocalPath {string}
   */
  function downloadFilesHandler(fromWosPath, toLocalPath) {
    Toast.info(T('download.addtolist.on')); //'正在添加到下载队列'
    wosDownloadManager.createDownloadJobs(fromWosPath, toLocalPath, function (isCancelled) {
      Toast.info(T('download.addtolist.success')); //'已全部添加到下载队列'
      $scope.toggleTransVisible(true);
      $scope.transTab = 2;
    });
  }
  /**
   * 上传
   * @param filePaths []  {array<string>}  有可能是目录，需要遍历
   * @param bucketInfo {object} {bucket, region, key}
   */
  function uploadFilesHandler(filePaths, bucketInfo) {
    Toast.info(T('upload.addtolist.on')); //'正在添加到上传队列'
    wosUploadManager.createUploadJobs(filePaths, bucketInfo, function (isCancelled) {
      Toast.info(T('upload.addtolist.success')); //'已全部添加到上传队列'
      $scope.toggleTransVisible(true);
      $scope.transTab = 1;
    });
  }

  function calcTotalProg() {
    var c = 0,
        c2 = 0;
    var cf = 0,
        cs = 0;
    var cf2 = 0,
        cs2 = 0;
    angular.forEach($scope.lists.uploadJobList, function (n) {
      if (n.status == 'running') {
        c++;
      }
      if (n.status == 'waiting') {
        c++;
      }
      if (n.status == 'verifying') {
        c++;
      }
      if (n.status == 'failed') {
        cf++;
      }
      if (n.status == 'stopped') {
        c++;
        cs++;
      }
    });
    angular.forEach($scope.lists.downloadJobList, function (n) {
      if (n.status == 'running') {
        c2++;
      }
      if (n.status == 'waiting') {
        c2++;
      }
      if (n.status == 'failed') {
        cf2++;
      }
      if (n.status == 'stopped') {
        c2++;
        cs2++;
      }
    });
    //  $scope.totalNum.upRunning = c;
    //  $scope.totalNum.downRunning = c;
    $scope.totalNum.running = c + c2;

    $scope.totalNum.upDone = $scope.lists.uploadJobList.length - c;
    $scope.totalNum.downDone = $scope.lists.downloadJobList.length - c2;

    $scope.totalNum.upFailed = cf;
    $scope.totalNum.downFailed = cf2;
    $scope.totalNum.upStopped = cs;
    $scope.totalNum.downStopped = cs2;

    $scope.totalNum.total = $scope.lists.uploadJobList.length + $scope.lists.downloadJobList.length;

    //safeApply($scope);
  }
}]);
'use strict';

angular.module('web').controller('transferUploadsCtrl', ['$scope', '$timeout', '$translate', '$interval', 'jobUtil', 'DelayDone', 'wosUploadManager', 'Toast', 'Dialog', function ($scope, $timeout, $translate, $interval, jobUtil, DelayDone, wosUploadManager, Toast, Dialog) {
  var T = $translate.instant;
  angular.extend($scope, {
    showRemoveItem: showRemoveItem,
    clearAllCompleted: clearAllCompleted,
    clearAll: clearAll,
    stopAll: stopAll,
    startAll: startAll,
    checkStartJob: checkStartJob,

    sch: {
      upname: null
    },
    schKeyFn: function (item) {
      return item.from.name + ' ' + item.status + ' ' + jobUtil.getStatusLabel(item.status);
    },
    limitToNum: 100,
    loadMoreUploadItems: loadMoreItems
  });

  function loadMoreItems() {
    var len = $scope.lists.uploadJobList.length;
    if ($scope.limitToNum < len) {
      $scope.limitToNum += Math.min(100, len - $scope.limitToNum);
    }
  }

  function checkStartJob(item) {
    item.wait();
    wosUploadManager.checkStart();
  }

  function showRemoveItem(item) {
    if (item.status == 'finished') {
      doRemove(item);
    } else {
      var title = T('remove.from.list.title'); //'从列表中移除'
      var message = T('remove.from.list.message'); //'确定移除该上传任务?'
      Dialog.confirm(title, message, function (btn) {
        if (btn) {
          doRemove(item);
        }
      }, 1);
    }
  }

  function doRemove(item) {
    var arr = $scope.lists.uploadJobList;
    for (var i = 0; i < arr.length; i++) {
      if (item === arr[i]) {
        arr.splice(i, 1);
        break;
      }
    }
    wosUploadManager.saveProg();
    $scope.calcTotalProg();
  }

  function clearAllCompleted() {
    var arr = $scope.lists.uploadJobList;
    for (var i = 0; i < arr.length; i++) {
      if ('finished' == arr[i].status) {
        arr.splice(i, 1);
        i--;
      }
    }
    $scope.calcTotalProg();
  }

  function clearAll() {
    if (!$scope.lists.uploadJobList || $scope.lists.uploadJobList.length == 0) {
      return;
    }
    var title = T('clear.all.title'); //清空所有
    var message = T('clear.all.upload.message'); //确定清空所有上传任务?
    Dialog.confirm(title, message, function (btn) {
      if (btn) {

        var arr = $scope.lists.uploadJobList;
        for (var i = 0; i < arr.length; i++) {
          var n = arr[i];
          if (n.status == 'running' || n.status == 'waiting' || n.status == 'verifying' || n.status == 'retrying') n.stop();
          arr.splice(i, 1);
          i--;
        }
        $scope.calcTotalProg();
        wosUploadManager.saveProg();
      }
    }, 1);
  }

  var stopFlag = false;
  function stopAll() {
    var arr = $scope.lists.uploadJobList;
    if (arr && arr.length > 0) {
      stopFlag = true;

      wosUploadManager.stopCreatingJobs();

      Toast.info(T('pause.on')); //'正在暂停...'
      $scope.allActionBtnDisabled = true;

      angular.forEach(arr, function (n) {
        if (n.status == 'running' || n.status == 'waiting' || n.status == 'verifying' || n.status == 'retrying') n.stop();
      });
      Toast.info(T('pause.success'));

      $timeout(function () {
        wosUploadManager.saveProg();
        $scope.allActionBtnDisabled = false;
      }, 100);
    }
  }

  function startAll() {
    var arr = $scope.lists.uploadJobList;
    stopFlag = false;
    //串行
    if (arr && arr.length > 0) {
      $scope.allActionBtnDisabled = true;
      DelayDone.seriesRun(arr, function (n, fn) {
        if (stopFlag) {
          return;
        }

        if (n && (n.status == 'stopped' || n.status == 'failed')) {
          n.wait();
        }

        wosUploadManager.checkStart();

        fn();
      }, function doneFn() {
        $scope.allActionBtnDisabled = false;
      });
    }
  }
}]);
'use strict';

angular.module('web').controller('codeModalCtrl', ['$scope', '$uibModalInstance', '$translate', '$timeout', '$uibModal', 'bucketInfo', 'objectInfo', 'fileType', 'showFn', 'Toast', 'DiffModal', 'wos', 'safeApply', function ($scope, $modalInstance, $translate, $timeout, $modal, bucketInfo, objectInfo, fileType, showFn, Toast, DiffModal, wos, safeApply) {
  var T = $translate.instant;
  angular.extend($scope, {
    bucketInfo: bucketInfo,
    objectInfo: objectInfo,
    fileType: fileType,
    afterCheckSuccess: afterCheckSuccess,
    afterRestoreSubmit: afterRestoreSubmit,

    previewBarVisible: false,
    showFn: showFn,

    cancel: cancel,
    getContent: getContent,
    saveContent: saveContent,
    //showDownload: showDownload,
    MAX_SIZE: 5 * 1024 * 1024
  });

  function afterCheckSuccess() {
    $scope.previewBarVisible = true;
    if (objectInfo.size < $scope.MAX_SIZE) {
      //修复ubuntu下无法获取的bug
      $timeout(function () {
        getContent();
      }, 100);
    }
  }

  function afterRestoreSubmit() {
    showFn.callback(true);
  }

  function saveContent() {

    var originalContent = $scope.originalContent;
    var v = editor.getValue();
    $scope.content = v;

    if (originalContent != v) {
      DiffModal.show('Diff', originalContent, v, function (v) {
        Toast.info(T('saving')); //'正在保存...'

        wos.saveContent(bucketInfo.region, bucketInfo.bucket, objectInfo.path, v).then(function (result) {
          Toast.success(T('save.successfully')); //'保存成功'
          cancel();
        });
      });
    } else {
      Toast.info(T('content.isnot.modified')); //内容没有修改
    }
  }

  function getContent() {
    $scope.isLoading = true;
    wos.getContent(bucketInfo.region, bucketInfo.bucket, objectInfo.path).then(function (result) {
      $scope.isLoading = false;

      var data = result.Body.toString();
      $scope.originalContent = data;
      $scope.content = data;
      editor.setValue(data);
    });
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  $scope.codeOptions = {
    lineNumbers: true,
    lineWrapping: true,
    autoFocus: true,
    readOnly: false,
    mode: fileType.mode
  };

  var editor;
  $scope.codemirrorLoaded = function (_editor) {
    editor = _editor;
    // Editor part
    var _doc = _editor.getDoc();
    _editor.focus();

    // Options
    _editor.setSize('100%', 500);

    _editor.refresh();

    _doc.markClean();
  };
}]);
'use strict';

angular.module('web').controller('docModalCtrl', ['$scope', '$uibModalInstance', 'Const', 'bucketInfo', 'objectInfo', 'showFn', 'wos', 'fileType', function ($scope, $modalInstance, Const, bucketInfo, objectInfo, showFn, wos, fileType) {

  angular.extend($scope, {
    bucketInfo: bucketInfo,
    objectInfo: objectInfo,
    fileType: fileType,
    afterCheckSuccess: afterCheckSuccess,
    afterRestoreSubmit: afterRestoreSubmit,

    openURL: openURL,

    previewBarVisible: false,
    showFn: showFn,
    cancel: cancel,

    MAX_SIZE: 50 * 1024 * 1024 //50MB
  });

  function afterRestoreSubmit() {
    showFn.callback(true);
  }

  function afterCheckSuccess() {
    $scope.previewBarVisible = true;
    getContent();
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function openURL(v) {
    openExternal(v);
  }

  function getContent() {

    if (fileType.ext[0] == 'pdf') {
      $scope.prevUrl = wos.signatureUrl2(bucketInfo.region, bucketInfo.bucket, objectInfo.path, 3600);
      return;
    }

    var process = 'imm/previewdoc,copy_1';
    var prevUrl = wos.signatureUrl2(bucketInfo.region, bucketInfo.bucket, objectInfo.path, 3600, process);
    //console.log(prevUrl)
    $.ajax({ url: prevUrl, success: function (data) {

        $scope.prevUrl = prevUrl;
      }, error: function (err) {
        if (err.responseJSON) {

          if (err.responseJSON.code == 'InvalidProject.NotFound') {
            $scope.error = err.responseText;
            $scope.doc_link = Const.IMM_DOC_PREVIEW_LINK;
          } else {
            $scope.error = err.responseText;
          }
        } else {
          $scope.error = err.responseText;
        }
      } });
  }
}]);
'use strict';

angular.module('web').controller('mediaModalCtrl', ['$scope', '$uibModalInstance', '$timeout', '$sce', '$uibModal', 'wos', 'safeApply', 'showFn', 'bucketInfo', 'objectInfo', 'fileType', function ($scope, $modalInstance, $timeout, $sce, $modal, wos, safeApply, showFn, bucketInfo, objectInfo, fileType) {

  angular.extend($scope, {
    bucketInfo: bucketInfo,
    objectInfo: objectInfo,
    fileType: fileType,
    afterCheckSuccess: afterCheckSuccess,
    afterRestoreSubmit: afterRestoreSubmit,

    previewBarVisible: false,
    showFn: showFn,
    cancel: cancel,

    MAX_SIZE: 5 * 1024 * 1024 //5MB
  });

  function afterRestoreSubmit() {
    showFn.callback(true);
  }

  function afterCheckSuccess() {
    $scope.previewBarVisible = true;
    genURL();
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function genURL() {
    var url = wos.signatureUrl2(bucketInfo.region, bucketInfo.bucket, objectInfo.path, 3600);
    $timeout(function () {

      $scope.src_origin = url;
      $scope.src = $sce.trustAsResourceUrl(url);

      $timeout(function () {
        var ele = $('#video-player');
        if (parseInt(ele.css('height')) > parseInt(ele.css('width'))) {
          ele.css('height', $(document).height() - 240);
          ele.css('width', 'auto');
        }
      }, 1000);
    }, 300);
  }
}]);
'use strict';

angular.module('web').controller('othersModalCtrl', ['$scope', '$uibModalInstance', '$uibModal', 'bucketInfo', 'objectInfo', 'fileType', 'showFn', 'safeApply', function ($scope, $modalInstance, $modal, bucketInfo, objectInfo, fileType, showFn, safeApply) {

  angular.extend($scope, {
    bucketInfo: bucketInfo,
    objectInfo: objectInfo,
    fileType: fileType,
    afterRestoreSubmit: afterRestoreSubmit,
    afterCheckSuccess: afterCheckSuccess,

    previewBarVisible: false,
    showFn: showFn,
    cancel: cancel,

    showAs: showAs,
    //showDownload: showDownload,

    showAsCodeBtn: shouldShowAsCodeBtn()
  });
  function afterRestoreSubmit() {
    showFn.callback(true);
  }
  function afterCheckSuccess() {
    $scope.previewBarVisible = true;
  }

  function shouldShowAsCodeBtn() {
    var name = objectInfo.name;

    if (endswith(name, '.tar.gz') || endswith(name, '.tar') || endswith(name, '.zip') || endswith(name, '.bz') || endswith(name, '.xz') || endswith(name, '.dmg') || endswith(name, '.pkg') || endswith(name, '.apk') || endswith(name, '.exe') || endswith(name, '.msi') || endswith(name, '.dll') || endswith(name, '.chm') || endswith(name, '.iso') || endswith(name, '.img') || endswith(name, '.img') || endswith(name, '.pdf') || endswith(name, '.doc') || endswith(name, '.docx')) {
      return false;
    }
    return true;
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function showAs(type) {
    showFn.preview(objectInfo, type);
    cancel();
  }

  // function showDownload(){
  //   showFn.download(bucketInfo, objectInfo);
  //   cancel();
  // }


  function endswith(s, ext) {
    return s.lastIndexOf(ext) == s.length - ext.length;
  }
}]);
'use strict';

angular.module('web').controller('pictureModalCtrl', ['$scope', '$uibModalInstance', '$timeout', '$uibModal', 'wos', 'safeApply', 'showFn', 'bucketInfo', 'objectInfo', 'AuthInfo', 'fileType', function ($scope, $modalInstance, $timeout, $modal, wos, safeApply, showFn, bucketInfo, objectInfo, AuthInfo, fileType) {

  angular.extend($scope, {
    bucketInfo: bucketInfo,
    objectInfo: objectInfo,
    fileType: fileType,
    afterCheckSuccess: afterCheckSuccess,
    afterRestoreSubmit: afterRestoreSubmit,

    previewBarVisible: false,
    showFn: showFn,
    cancel: cancel,

    MAX_SIZE: 5 * 1024 * 1024 //5MB
  });

  function afterRestoreSubmit() {
    showFn.callback(true);
  }

  function afterCheckSuccess() {
    $scope.previewBarVisible = true;
    getContent();
  }

  function cancel() {
    $modalInstance.dismiss('close');
  }

  function getContent() {
    var info = AuthInfo.get();
    if (info.id.indexOf('STS.') == 0) {
      wos.getImageBase64Url(bucketInfo.region, bucketInfo.bucket, objectInfo.path).then(function (data) {
        if (data.ContentType.indexOf('image/') == 0) {
          var base64str = new Buffer(data.Body).toString('base64');
          $scope.imgsrc = 'data:' + data.ContentType + ';base64,' + base64str;
        }
      });
    } else {
      var process = "image/quality,q_10";
      var url = wos.signatureUrl(bucketInfo.region, bucketInfo.bucket, objectInfo.path);
      var url5M = wos.signatureUrl2(bucketInfo.region, bucketInfo.bucket, objectInfo.path, 3600, process);
      $timeout(function () {
        if (objectInfo.size < $scope.MAX_SIZE) {
          $scope.imgsrc = url;
        } else {
          $scope.imgsrc = url5M;
        }
      }, 300);
    }
  }
}]);
'use strict';

angular.module('web').directive('restoreChecker', [function () {

  return {
    restrict: 'EA',
    templateUrl: 'main/files/modals/preview/restore-checker.html',
    transclude: true,
    scope: {
      bucketInfo: '=',
      objectInfo: '=',
      fileType: '=',
      afterCheckSuccess: '&',
      afterRestoreSubmit: '&'
    },
    controller: ['$scope', '$timeout', '$uibModal', 'wos', 'safeApply', ctrlFn]
  };

  function ctrlFn($scope, $timeout, $modal, wos, safeApply) {

    angular.extend($scope, {
      info: {
        msg: null,
        needRestore: false
      },
      _Loading: false,
      showRestore: showRestore
    });

    init();
    function init() {
      check(function () {
        if ($scope.afterCheckSuccess) $scope.afterCheckSuccess();
      });
    }
    function check(fn) {
      $scope._Loading = true;
      $scope.info.needRestore = false;

      wos.getFileInfo($scope.bucketInfo.region, $scope.bucketInfo.bucket, $scope.objectInfo.path).then(function (data) {

        if (data.Restore) {
          var info = wos.parseRestoreInfo(data.Restore);
          if (info['ongoing-request'] == 'true') {
            $scope.info.type = 2; // '归档文件正在恢复中，请耐心等待...';
            $scope.info.showContent = false;
          } else {
            $scope.info.expired_time = info['expiry-date'];
            $scope.info.type = 3; // '归档文件，已恢复，可读截止时间：'+ moment(new Date(info['expiry-date'])).format('YYYY-MM-DD HH:mm:ss');
            $scope.info.showContent = true;
            $scope.info.needRestore = true;
            if (fn) fn();
          }
        } else {

          if ($scope.objectInfo.storageClass == 'Archive') {
            $scope.info.type = 1; //归档文件，需要恢复才能预览或下载
            $scope.info.showContent = false;
            $scope.info.needRestore = true;
          } else {
            $scope.info.type = 0;
            $scope.info.showContent = true;
            if (fn) fn();
          }
        }
        $scope._Loading = false;
        safeApply($scope);
      });
    }

    function showRestore() {
      $modal.open({
        templateUrl: 'main/files/modals/restore-modal.html',
        controller: 'restoreModalCtrl',
        resolve: {
          item: function () {
            return angular.copy($scope.objectInfo);
          },
          currentInfo: function () {
            return angular.copy($scope.bucketInfo);
          },
          callback: function () {
            return function () {
              if ($scope.afterRestoreSubmit) {
                $scope.afterRestoreSubmit();
              }
              init();
            };
          }
        }
      });
    }
  }
}]);