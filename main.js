#!/usr/bin/env node

'use strict';

(function() {
  var log = new (require('log'))('debug');
  var auth = require("./src/qqauth-qrcode");
  var api = require("./src/qqapi");
  var QQBot = require("./src/qqbot");
  var defaults = require('./src/defaults');
  var config = require('./config');
  var KEY_COOKIES = 'qq-cookies';
  var KEY_AUTH = 'qq-auth';

  /*
   * 获取接口需要的cookie和token
   * @param isneedlogin : 是否需要登录，or本地获取
   * @param options     : 配置文件涉及的内容
   * @callback (cookies,auth_info)
   */

  var get_tokens = function(isneedlogin, options, callback) {
    var auth_info, cookies;
    if (isneedlogin) {
      return auth.login(options, function(cookies, auth_info) {
        defaults.data(KEY_COOKIES, cookies);
        defaults.data(KEY_AUTH, auth_info);
        defaults.save();
        return callback(cookies, auth_info);
      });
    } else {
      cookies = defaults.data(KEY_COOKIES);
      auth_info = defaults.data(KEY_AUTH);
      log.info("skip login");
      return callback(cookies, auth_info);
    }
  };

  var run = function() {
    "starting qqbot ...";
    var isneedlogin, params;
    params = process.argv.slice(-1)[0] || '';
    isneedlogin = params.trim() !== 'nologin';
    return get_tokens(isneedlogin, config, function(cookies, auth_info) {
      var bot;
      bot = new QQBot(cookies, auth_info, config);
      bot.on_die(function() {
        if (isneedlogin) {
          return run();
        }
      });
      return bot.update_all_members(function(ret) {
        if(ret) {
          log.info("Entering runloop, Enjoy!");
          return bot.runloop();
        } else {
          log.error("获取信息失败，再次尝试");
          return bot.update_all_members(function(ret) {
            if(ret) {
              log.info("Entering runloop, Enjoy!");
              return bot.runloop();
            } else {
              log.error("获取信息失败，请重新运行");
              process.exit(1);
            }
          });
        }
      });
    });
  };

  run();

}).call(this);
