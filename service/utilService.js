/*************************************************
 *Copyright (C),2018-2022
 *Filename:  utilService.js
 *Author: radarzhhua     Version:   1.0     Date: 2018.10.20
 *Description:   此JS是常用工具方法的封装
 *               需要node.js 7.6 以上,
 *               此为js版本
 *email:radarzhhua@gmail.com
 *************************************************/

const ethers = require('ethers');
let Util = {
    /**
    * 数组排序，适合数字和字符串数组
    * 前提：如果是字符串比较大小，有两种方式：
    * 方式一、 是直接按位比较unicode码，直接使用 > 即可 这样升充的顺序为A -Za-z  其中A为65 ，a为97
    * 方式二，使用本地比较方式 localeCompare()，这样a总是在b前面无论大小写
    * 本方法采用第一种方式
    * @param
    * args 待排序的数组
    * asc 是否升序，默认为升序，false为降序
    * @return
    * 返回对排序后的原数组的引用，也就是并不会产生一个新的数组
    **/
    sortArray: (args, asc = true) => {
        if (asc)
            return args.sort((a, b) => a > b);
        else
            return args.sort((a, b) => a < b);
    },

    /**
    * 将一个对象的属性按升序或者降序排列起来并按照key=value的样式使用&连接起来
    * 一般配合加密生成sign时使用
    * 这里对要处理的对象使用JSON作了一次转化，防止对象属性中出现函数的情况
    * 需要使用上面的sortStringArray方法
    * @param
    * obj 要处理的对象
    * asc 是否升序，默认为升序
    * @return
    * 返回连接后的字符串
    **/
    concatKeys:(obj,asc = true)=>{
        let keys = [];
        let result = '';
        let _newObj = JSON.parse(JSON.stringify(obj));
        for (let key in _newObj)
            keys.push(key);
        Util.sortArray(keys,asc);
        for (let i = 0; i < keys.length; i++) {
            let _key = keys[i];
            result += _key + '=' + _newObj[_key];
            if (i !== keys.length - 1)
                result += '&';
            }
        return result;
    },

    /**
    * 将时间转化成对应的年月日
    * @param
    * _times 时间对象或者时间戳
    * @return
    * 转化后的字符串
    **/
    convertTimeToDateString:(_times)=>{
      let flag = 'number' === typeof _times;
      let _date = flag ? new Date(_times) : _times;
      let y,m,d;
      y = _date.getFullYear();
      m = _date.getMonth() + 1;
      if(m<10)
        m = "0" + m.toString();
      d = _date.getDate();
      if(d<10)
        d = "0" + d.toString();
      return y + "-" + m + "-" + d;
    },

    /**
    * 将时间转化成对应的年月日小时分秒
    * @param
    * _times 时间对象或者时间戳
    * @return
    * 转化后的字符串
    **/
    convertTimetoTimeString:(_times)=>{
      let flag = 'number' === typeof _times;
      let _date = flag ? new Date(_times) : _times;
      let _dataStr = Util.convertTimeToDateString(_date);
      let _timeStr = _date.toTimeString().substr(0, 8);
      return _dataStr + " " + _timeStr;
    },

    /**
    * 设置小数位数
    * @param
    * num 要设置的数字
    * fixed 小位数位数，如果输入为负就是代表整数位最后有几个0并且无小数位
    * isCompleted 小数位不足是否用0补全，如果有小数位并且最后补0了，输出的是一个字符串,默认为false
    * @return
    * 转化后的数字或者字符串
    **/
    fixNumber:(num,fixed,isCompleted = false)=>{
      let _rate = 10 ** fixed;
      let _num = Math.floor(_rate * num) / _rate;
      if(isCompleted && fixed > 0){
          let result;
          let _str = ("" + _num).split('.');
          let _strF = _str.length > 1 ? _str[1] : "";
          while (_strF.length < fixed)
                _strF = _strF + "0";
          result = _str[0] + "." + _strF;
          _num = result;
      }
      return _num;
    },
    getFirstContextByLabel:(source,label)=>{
      let label_start = '<' + label
      let label_end = '</' + label + '>'
      let start = source.indexOf(label_start) 
      if (start === -1) {
        return ""
      }
      let startIndex = start + label_start.length
      let start_close = source.indexOf(">",startIndex)
      let end = source.indexOf(label_end)
      if( end !== -1){
          return source.substring(start_close + 1,end)
      }else{
          return ''
      }
    },
    convertTypeIdToBase:(typeId) => {
      let result = typeId.toHexString()
      result = result.substring(0,result.length - 32)
      return + ethers.utils.bigNumberify(result)
    }
}
module.exports = Util;
