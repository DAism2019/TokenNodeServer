const router = require('koa-router')()
const ethers = require('ethers')
const Global = require("../custom/Global")

router.prefix('/token')

//opensea获取token信息使用
router.get('/:tokenId', (ctx, next) => {
  let typeId;
  let token_str;
  try {
    let tokenId = ethers.utils.bigNumberify(ctx.params.tokenId)
    token_str = tokenId.toHexString()
    let type_str = token_str.substring(0, token_str.length - 32)
    typeId = +ethers.utils.bigNumberify(type_str)
  } catch (err) {
    typeId = ''
  }
  if (!typeId) {
    return ctx.body = {
      msg: 'not a valid tokenId'
    }
  }
  let info = Global.getInfoByType(typeId)
  if (!info) {
    return ctx.body = {
      msg: 'not a valid tokenId'
    }
  } else {
    ctx.body = info
  }
})

//手动更新未获取的类型
router.get('/update/:typeId', (ctx, next) => {
  let typeId = ""
  try {
    typeId = ctx.params.typeId
    typeId = parseInt(typeId)
    if (Number.isNaN(typeId)) {
      typeId = ''
    }
  } catch (err) {
    typeId = ''
  }
  if (!typeId || typeId <= 0 || typeId >= 10000) {
    return ctx.body = {
      msg: 'not a valid typeId'
    }
  }
  let info = Global.getInfoByType(typeId)
  if (!info) {
    Global.updateFromChain([typeId])
    ctx.body = {
      msg: 'TypeInfo will be updated a little later'
    }
  } else {
    ctx.body = {
      msg: 'typeId has been existed'
    }
  }
})



module.exports = router