'use strict'

const _ = require('lodash')
const inflection = require('inflection')
const Helpers = use('Helpers')
// const Drive = use('Drive')
const { HttpException } = require('@adonisjs/generic-exceptions')

module.exports = class ResourceController {
  async processData (ctx, query, data) {
    if (query.appends) {
      for (let row of data.rows) {
        await row.fetchAppends(ctx, query.appends)
      }
    }
    return data
  }

  async index (ctx) {
    const { Model, query } = ctx
    const fields = _.omitBy(Model.fields, (v, k) => v.listable === false)
    const { page, perPage = 20 } = query
    const offset = (page - 1) * perPage
    const limit = perPage
    const modelQuery = Model.query(query).select(Object.keys(fields)).skip(offset).limit(limit)
    if (query.withTrash) {
      modelQuery.ignoreScopes(['softDeletes'])._applyScopes()
    }
    let data = await modelQuery.fetch()
    const total = await Model.query(query).count()
    const lastPage = Math.ceil(total / perPage)
    data = await this.processData(ctx, query, data)

    return {
      page,
      perPage,
      total,
      lastPage,
      data
    }
  }

  async import (ctx) {
    throw new HttpException('Not implemented.', 400)
  }

  async export (ctx) {
    const { response, Model, query } = ctx
    await Model.buildOptions()
    const fields = _.omitBy(Model.fields, (v, k) => v.listable === false || ['_actions'].includes(k))
    const { page, perPage = 20 } = query
    const offset = (page - 1) * perPage
    const limit = perPage
    const modelQuery = Model.query(query).select(Object.keys(fields)).skip(offset).limit(limit)
    if (query.withTrash) {
      modelQuery.ignoreScopes(['softDeletes'])._applyScopes()
    }
    let data = await modelQuery.fetch()
    data = await this.processData(ctx, query, data)
    const ret = [[]]
    for (let key in fields) {
      const field = fields[key]
      ret[0].push(field.label || inflection.titleize(key))
    }
    data.toJSON().forEach(row => {
      const line = []
      for (let k in fields) {
        line.push(Model.getValue(row, k))
      }
      ret.push(line)
    })
    // debug generated result
    // return ret
    const xlsx = require('node-xlsx')
    const buffer = xlsx.build([{ name: 'Sheet1', data: ret }])
    const fs = require('fs')
    const path = Helpers.tmpPath(`export-${Math.random()}.xlsx`)
    try {
      fs.mkdirSync(Helpers.tmpPath())
    } catch (e) { }
    fs.writeFileSync(path, buffer)
    return response.attachment(path, `${Model.label}-${new Date().toLocaleString()}.xlsx`)
  }

  async grid ({ request, Model }) {
    await Model.buildOptions()
    const searchFields = _.pickBy(Model.fields, 'searchable')
    _.mapValues(searchFields, v => {
      if (v.selectSize) {
        v.selectSize = 5
      }
    })
    const fields = _.omitBy(Model.fields, (v, k) => v.listable === false)
    return {
      searchFields: searchFields,
      searchModel: _.mapValues(searchFields, v => null),
      fields: fields
    }
  }

  async form ({ request, Model, model, auth }) {
    await Model.buildOptions()
    const fields = _.omitBy(Model.fields, (v, k) => {
      const ignoredFields = [
        '_id', 'created_at', 'updated_at', '_actions'
      ]
      return v.editable === false || ignoredFields.includes(k) || !auth.user.isRole(v.role)
    })
    return {
      labels: await Model.labels(),
      fields: fields,
      model: model
    }
  }
  async view ({ request, Model, model }) {
    await Model.buildOptions()
    return {
      labels: await Model.labels(),
      fields: _.omitBy(Model.fields, (v, k) => v.viewable === false || ['_actions'].includes(k)),
      model: model
    }
  }

  async store ({ request, auth, Model, model }) {
    const fields = Model.fields
    const data = _.omitBy(request.all(), (v, k) => !auth.user.isRole(fields[k].role))

    await model.validate(data)

    model.fill(data)
    await model.save()
    return model
  }

  async show ({ request, auth, Model, model }) {
    return model
  }

  async update ({ request, auth, Model, model, validate }) {
    let data = request.all()
    await model.validate(data)
    model.merge(data)
    await model.save()
    return model
  }

  async destroy ({ request, auth, Model, model, validate }) {
    await model.delete()
    return {
      success: true
    }
  }

  async destroyAll ({ request, auth, Model, validate }) {
    await Model.query().delete()
    return {
      success: true
    }
  }

  async options ({ request, Model }) {
    let { text = 'name', value = '_id', where = '{}', limit = 10 } = request.all()
    where = JSON.parse(where)
    if (where[text]) {
      const orWhere = []
      if (text.includes(' ')) {
        String(text).split(' ').forEach(v => {
          orWhere.push({ [v]: new RegExp(where[text], 'i') })
        })
        delete where[text]
      }
      where['$or'] = orWhere
    }
    const ret = await Model.fetchOptions(value, text, where, limit)
    return ret
  }

  async stat ({ request, auth, Model }) {
    const group = request.input('group', 'os')
    const data = _.mapValues(_.keyBy(await Model.count(group), '_id'), 'count')

    return {
      labels: _.keys(data),
      datasets: [
        {
          backgroundColor: [
            '#41B883',
            '#E46651',
            '#00D8FF',
            '#DD1B16'
          ],
          data: _.values(data)
        }
      ]
    }
  }
}
