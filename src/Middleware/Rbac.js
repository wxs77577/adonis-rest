'use strict'

class Authenticator {
  async handle (ctx, next, param) {
    // Config.set('auth.authenticator', param)
    const { auth } = ctx
    ctx.auth = auth.authenticator(param)
    try {
      await auth.check()
    } catch (e) {
      console.log(this.constructor.name, e.name)
    }
    await next()
  }
}

module.exports = Authenticator
