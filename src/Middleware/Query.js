'use strict'

const _ = require('lodash')
const { HttpException } = require('@adonisjs/generic-exceptions')
const Config = use('Config')
const toNumber = (val, defaultValue = 0) => Number(val) || defaultValue

class Query {
  async handle (ctx, next, param) {
    const [configKey = 'api'] = param

    const { request, params, auth } = ctx

    const resource = params.resource

    let query = request.input('query', {})
    if (typeof query === 'string') {
      query = JSON.parse(query)
    }
    if (!query.where) {
      query.where = {}
    }

    let page = toNumber(request.input('page', 1))
    if (!query.page) {
      query.page = page
    }

    if (query.where && query.where.perPage) {
      query.perPage = toNumber(query.where.perPage) || 10
    }
    delete query.where.perPage

    // if (_.isString(query.perPage)) {
    //   const pagesize = await Option.get('pagesize', 'name', 'value')
    //   query.perPage = parseInt(pagesize[query.perPage]) || 10
    // }

    query.page = Math.max(toNumber(query.page, 1), 1)
    query.perPage = Math.min(Math.max(toNumber(query.perPage, 10), 1), 100000)

    _.mapValues(query.where, (v, k) => {
      if (v === '' || v === null || _.isEqual(v, []) || _.isEqual(v, [null])) {
        return delete query.where[k]
      }
      const isDate = ['created_at', 'updated_at'].includes(k)
      if (isDate) {
        // v = _.map(v, d => d.replace(/(\d{4}-\d{2}-\d{2})/, '$1'))
        let [begin, end] = v
        if (!end) {
          end = begin + 1
        }
        const endDate = new Date(end)
        end = endDate.setDate(endDate.getDate() + 1)
        query.where[k] = { $gte: begin, $lte: end }
        return
      }
      if (_.isString(v) && v.includes('*')) {
        query.where[k] = new RegExp(v.replace('*', ''), 'i')
      }
      if (_.isArray(v) && !_.isObject(v[0])) {
        query.where[k] = { $in: v }
      }
    })

    if (params.id) {
      let where = {
        _id: params.id
      }
      if (params.id.length !== 24) {
        where = {
          $or: [{ name: params.id }, { key: params.id }]
        }
        if (!isNaN(params.id)) {
          where.$or.push({ id: parseInt(params.id) })
        }
      }
      query.where = _.defaultsDeep({}, query.where, where)
    }

    if (configKey) {
      const resourceConfig = Config.get(`rest.${configKey}.resources.${resource}`, {})

      if (resourceConfig.auth) {
        if (!auth.user) {
          throw new HttpException('Login required', 401)
        }
        if (!query.where) {
          query.where = {}
        }
      }

      // const AdminUser = use('Rest/Models/AdminUser')
      // if (auth.user instanceof AdminUser) {
      //   try {
      //     await auth.user.load('roles')
      //   } catch (e) { }
      //   // Allow access my resource only
      //   if (resourceConfig.restrictOwner && !auth.user.isSystemAdmin()) {
      //     const { field, isArray } = resourceConfig.restrictOwner
      //     query.where[field] = auth.user._id
      //   }
      // }

      if (params.id) {
        // show
        const defaultQuery = _.get(resourceConfig, `query.show`, {})
        query = _.defaultsDeep({}, query, defaultQuery)
      } else {
        // index
        const defaultQuery = _.get(resourceConfig, `query.index`, {})
        query = _.defaultsDeep({}, query, defaultQuery)
      }
    }
    ctx.query = query
    await next()
  }
}

module.exports = Query
