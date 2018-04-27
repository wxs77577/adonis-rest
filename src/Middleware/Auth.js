'use strict'

/**
 * Auth middleware
 *
 * @param string  Authenticator name
 * @param boolean AllowGuest ?
 *
 * rest-auth:jwt        must login
 * rest-auth:jwt,true   allow guest
 *
 * @author JohnnyWu <wu-xuesong@qq.com>
 *
 */

const { HttpException } = require('@adonisjs/generic-exceptions')

class Auth {
  async handle ({ request, auth }, next, param) {
    const [authKey, allowGuest = false] = param
    // Config.set('auth.authenticator', authKey)
    const authenticator = auth.authenticator(authKey)
    try {
      await authenticator.check()
    } catch (e) {
      if (allowGuest !== 'true') {
        throw new HttpException('Login required', 401)
      }
    }
    auth.authenticatorInstance = authenticator
    await next()
  }
}

module.exports = Auth
