/**
 * 自动回复
 */
var Log = require('log');
var log = new Log('debug');
var qqapi = require('./../src/qqapi');
var config = require('./config');
var http = require('http');
var minimist = require('minimist');
var querystring = require('querystring');
var qqConfig = require('./../config');

var qqbot_host = 'localhost';
var qqbot_port = qqConfig.api_port;


var superString = config.keyWords.superString;
var startString = config.keyWords.startString;

function api_post(hostname, port, path, form, callback) {
  var postData = querystring.stringify(form);
  var options = {
    hostname: hostname,
    port: port,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'Content-Length': postData.length
    }
  };
  var req = http.request(options, function(resp) {
    var res = resp;
    var body = '';
    resp.on('data', function(chunk) {
      return body += chunk;
    });
    return resp.on('end', function() {
      return callback(null, res, body);
    });
  }).on("error", function(e) {
    return callback(e, null, null);
  });
  req.write(postData);
  return req.end();
}


/**
 * 返回一个随机消息
 * @returns {string}
 */
function getRandomAnswer() {
  var message = config.RandomAnswer;
  return message[rnd(0, message.length)];
}


/**
 * 获取自定义的回复
 * @param string
 * @returns {string}
 */
function getCustomAnswer(string) {
  console.log('getCustomAnswer....');
  var answer = null;
  if (string.indexOf('绩点') !== -1) {
    answer = 'http://g.fyscu.com';
    console.log('绩点: ', answer)
  }
  return answer;
}


/**
 * 剪切消息，判断是否符合规范
 */
function spliteMessage(message) {
  if (startString.indexOf(message[0]) !== -1) {
    return message.substring(1);
  } else {
    return null;
  }
}


/**
 * 生成随机数
 * @param start
 * @param end
 * @returns {number}
 */
function rnd(start, end){
  return Math.floor(Math.random() * (end - start) + start);
}


/**
 * 回复消息
 * @param {array} args
 */
function sendMessage(args) {
  console.log('sendMessage: ', args)
  var options = {
    hostname: qqbot_host,
    port: qqbot_port,
    path: '/send'
  };
  return api_post(options.hostname, options.port, options.path, {
    type: args[0],
    to: args[1],
    msg: args[2]
  }, function(err,resp,body){
    if(! body) return console.log('qqbot not started.\n');
    console.log( body + '\n' );
  });
}

/**
 * 获取回复消息
 * 并调用回复函数
 * @param msg
 */
function chatGroup(msg) {
  log.debug('chatGroup...');
  log.debug('origin message: ', msg);
  var answer, args;

  if (!msg) {
    // 没有消息，直接返回
    return null;
  }

  var content = msg.content;
  if (spliteMessage(content) === null) {
    // 没有唤醒机器人
    // return null;
  }
  // content = spliteMessage(content);

  // 判断是否等于某个关键词
  if (content.indexOf(superString[0]) !== -1 ||
    content.indexOf(superString[1]) !== -1 ) {
    answer = getRandomAnswer();
    console.log('answer: ', answer);
    args = ['group', msg.from_group.account, answer];
    return sendMessage(args);
  }

  // 判断是否为特定消息
  if (getCustomAnswer(content)) {
    answer = getCustomAnswer(content);
    args = ['group', msg.from_group.account, answer];
    console.log('为特定消息')
    return sendMessage(args);
  }

  var data = {
    key : config.APIkey,
    userid: config.UserId,
    info: content
  };

  api_post(config.HOSTNAME, config.PORT, config.PATH, data, function(err, resp, body){
    if(! body) return log.debug('获取回复内容失败 .\n');
    console.log('回复：', body + '\n' );
    body = JSON.parse(body);
    var answer = '';
    switch (body.code) {
      case 100000:
        answer = body.text;
        break;
      case 200000:
        answer = body.text + '\n' + body.url;
        break;
      case 302000:
        answer = body.text + '\n' + JSON.stringify(body.list);
        break;
      case 308000:
        answer = body.text + '\n' + JSON.stringify(body.list);
        break;
      default:
        answer += '';
    }
    console.log('answer: ', answer);
    var args = ['group', msg.from_group.account, answer];
    return sendMessage(args);
  });
}

// chatGroup();

module.exports = {
  chatGroup: chatGroup
};




