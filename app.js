const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
// const logger = require('koa-logger')

const index = require('./routes/index')
const token = require('./routes/token')
const DBService = require('./service/dbService');
const Global = require('./custom/Global');
const schemas = require("./config/schema");
const connectURL = require("./config/config");

Global.setDBService(new DBService());
Global.dbService.connect(connectURL, schemas,Global.init,Global);

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
// app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))


app.use(async (ctx, next) => {
  let path = ctx.path;
  if(path.charAt(1) == "/"){
    const clientIP = ctx.request.ip;
    ctx.body = "WRONG URL! " + clientIP ;
    let str = ' \x1b[31m';
    console.log(`${ctx.method} ${ctx.url}` + ' - 1ms ' + ' \x1b[32m' + `${ctx.status}` +  str + 'WRONG URL \x1b[0m');
    return;
  }
  await next();
});

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  var str = ctx.status == 200
    ? ' \x1b[32m'
    : ' \x1b[31m';
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms` + str + `${ctx.status}` + ' \x1b[0m');
});

// routes
app.use(index.routes(), index.allowedMethods())
app.use(token.routes(), token.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
