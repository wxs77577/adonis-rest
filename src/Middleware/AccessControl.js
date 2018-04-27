'use strict'

class AccessControl {
  async handle ({ request, auth }, next, param) {
    const AdminUser = use('App/Models/AdminUser')
    /**
     * 对已登录用户进行判断
     */
    if (auth.user) {
      if (auth.user instanceof AdminUser) {
        /**
         * 1. 系统管理员不受限制 system
         * 2. 允许所有角色访问的路由不受限制 resource:,allowAll
         */
        await auth.user.load('roles')
        // if (!allowAll) {
        //   if (!auth.user.canAccess('/rest/' + resource)) {
        //     // throw new HttpException('没有权限', 403)
        //   }
        // }
      }
    }
  }
}

module.exports = AccessControl
