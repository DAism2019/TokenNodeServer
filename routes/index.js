const router = require('koa-router')()

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Welcome to NaturalDAO!'
  })
})

router.get('/string', async (ctx, next) => {
  ctx.body = 'Welcome to NaturalDAO!'
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'Welcome to NaturalDAO!'
  }
})

module.exports = router
