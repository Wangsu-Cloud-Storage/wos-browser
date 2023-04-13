angular.module('web')
  .factory('Const', [function () {

    function getStorageClasses(f) {
      var storageClasses = [{
          value: 'Standard',
          name: '标准类型'
        }, //标准类型
        {
          value: 'IA',
          name: '低频访问类型'
        } //低频访问类型
      ];
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
        'pdf',
        //'lrc','c','cpp','h','asm','s','java','asp','bat','bas','prg','cmd','rtf','txt','log','xml','htm','html',
      ],

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
        }, //公共读写
      ],

      //https://help.aliyun.com/document_detail/31837.html
      regions: [
      ],

      countryNum: [{
          "label": "中国大陆(+86)",
          "value": "86"
        },
        {
          "label": "香港(+852)",
          "value": "852"
        },
        {
          "label": "澳门(+853)",
          "value": "853"
        },
        {
          "label": "台湾(+886)",
          "value": "886"
        },
        {
          "label": "韩国(+82)",
          "value": "82"
        },
        {
          "label": "日本(+81)",
          "value": "81"
        },
        {
          "label": "美国(+1)",
          "value": "1"
        },
        {
          "label": "加拿大(+1)",
          "value": "1"
        },
        {
          "label": "英国(+44)",
          "value": "44"
        },
        {
          "label": "澳大利亚(+61)",
          "value": "61"
        },
        {
          "label": "新加坡(+65)",
          "value": "65"
        },
        {
          "label": "马来西亚(+60)",
          "value": "60"
        },
        {
          "label": "泰国(+66)",
          "value": "66"
        },
        {
          "label": "越南(+84)",
          "value": "84"
        },
        {
          "label": "菲律宾(+63)",
          "value": "63"
        },
        {
          "label": "印度尼西亚(+62)",
          "value": "62"
        },
        {
          "label": "德国(+49)",
          "value": "49"
        },
        {
          "label": "意大利(+39)",
          "value": "39"
        },
        {
          "label": "法国(+33)",
          "value": "33"
        },
        {
          "label": "俄罗斯(+7)",
          "value": "7"
        },
        {
          "label": "新西兰(+64)",
          "value": "64"
        },
        {
          "label": "荷兰(+31)",
          "value": "31"
        },
        {
          "label": "瑞典(+46)",
          "value": "46"
        },
        {
          "label": "乌克兰(+380)",
          "value": "380"
        }
      ]
    }
  }]);