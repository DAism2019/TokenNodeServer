/**
**配置mongodb数据库连接
* 
*/
const auth = true;
const username = "your username";
const password = "your password";
const port = '27017';
const serverHost = 'localhost';
const dbName = 'your dbName';
const authUrl = username + ":" + password + "@";
const dataUrl = serverHost + ":" + port + "/" + dbName;
const connectURL = 'mongodb://' + (auth ? authUrl : "") + dataUrl;

module.exports = connectURL
