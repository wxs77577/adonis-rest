'use strict'
/**
 * Resource Middleware for Rest Server
 *
 * @author JohnnyWu <wu-xuesong@qq.com>
 */
const inflection = require('inflection')
const { HttpException } = require('@adonisjs/generic-exceptions')

/**
 * Restful resource middleware
 *
 *
 */
class Resource {
  /**
   *
   * @param {*} ctx
   * @param {*} next
   * @param {*} param Parameters, e.g: resource:<resourceName>,allowAll
   */
  async handle (ctx, next, param) {
    const { params, query } = ctx
    let resource = params.resource
    // let allowAll = false

    if (Array.isArray(param) && param.length > 0) {
      if (!resource) {
        resource = param[0] ? param[0] : resource
      }

      // if (param[1] == 'allowAll') {
      //   allowAll = true
      // }
    }

    if (resource) {
      let className = inflection.classify(resource)
      if (['sms'].includes(resource)) {
        // no need to singularize
        className = inflection.camelize(resource)
      }

      try {
        ctx.Model = use('App/Models/' + className)
      } catch (e) {
        throw new HttpException(`Bad Resource ${className}`, 404)
      }
      const Model = ctx.Model

      ctx.model = new Model()

      if (params.id) {
        // 因.firstOrFail()方法不支持morphTo关联，故用fetch和row[0]代替
        const ret = await Model.query(query).limit(1).fetch()
        if (ret.rows.length < 1) {
          throw new HttpException(`${Model.name}(${params.id}) is Missing.`, 404)
        }
        ctx.model = ret.rows[0]

        if (query.appends) {
          await ctx.model.fetchAppends(ctx, query.appends)
        }
      }

      Model.getChoices = async () => {
        if (Model.choices) {
          let choices = await Model.choices()
          return choices.map(field => field.map((text, value) => ({ text, value })))
        }
        return {}
      }
      ctx.resource = resource
      ctx.Model = Model
    }

    await next()
  }
}

module.exports = Resource
