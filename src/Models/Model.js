'use strict'

const BaseModel = use('Model')
const _ = require('lodash')
const inflection = require('inflection')
// const Config = use('Config')
const Validator = use('Validator')
const Antl = use('Antl')

const arrayToTree = require('array-to-tree')
const { HttpException } = require('@adonisjs/generic-exceptions')

module.exports = class Model extends BaseModel {

  static get collection() {
    if (this._collection) {
      return this._collection
    }
    return super.collection
  }

  static get name() {
    return this._name ? this._name : this.name
  }
  static set name(name) {
    this._name = name
    return this
  }
  static setName(name) {
    this.name = name
    return this
  }

  static setCollection(name) {
    this._collection = name
    return this
  }

  static get fillable () {
    return _.reject(_.keys(this.fields), v => {
      return ['_id'].includes(v) || v.includes('.')
    })
  }
  // static get iocHooks () {
  //   return ['_bootIfNotBooted']
  //   // return ['_bootIfNotBooted', 'buildOptions']
  // }

  static get computed () {
    return []
  }

  static get objectIDs () {
    return ['_id']
  }

  async load (name) {
    if (this.getRelated(name)) {
      return
    }
    await super.load(name)
  }

  // getId(){
  //   return this._id
  // }

  static async fetchOptions (lhs, rhs, where = {}, limit = 0) {
    const textFields = rhs.split(' ')
    let data = await this.select([lhs].concat(textFields)).where(where).limit(limit).fetch()
    data = _.map(data.toJSON(), v => {
      const text = []
      textFields.forEach(field => text.push(v[field]))
      return {
        text: text.join(' '),
        value: v[lhs]
      }
    })
    data.unshift({
      text: '请选择...',
      value: null
    })
    return data
  }

  async fetchOptionData (fieldName) {
    const { resource, text, value = '_id' } = this.constructor.fields[fieldName].ajaxOptions
    const modelName = inflection.classify(resource)
    const ret = await use(`App/Models/${modelName}`).fetchOptions(value, text, {
      _id: { $in: this[fieldName] }
    }, 1000)
    return ret
  }

  static async buildOptions () {
    this.options = {
      // course_id: await Course.fetchOptions('_id', 'title'),
      // post_id: await Course.fetchOptions('_id', 'title'),
      // user_id: await Course.fetchOptions('_id', 'username'),
      // category_ids: await Course.fetchOptions('_id', 'name'),
    }
  }

  static getOptions (key) {
    return _.get(this.options, key, [])
  }

  static async treeOptions (lhs = '_id', rhs = 'name', topName = null, parentField = 'parent_id', parentValue = null) {
    let data = await this.select([lhs, rhs, parentField]).fetch()

    const tree = arrayToTree(data.toJSON(), {
      customID: '_id'
    })

    const flatten = (items = [], level = topName ? -1 : 0) => {
      let ret = []
      level++
      items.forEach(item => {
        const option = {
          value: item[lhs],
          text: _.repeat('　', level) + item[rhs]
        }

        ret.push(option)
        ret = ret.concat(flatten(item.children, level))
      })
      return ret
    }
    const topNode = _.find(tree, { [rhs]: topName })
    const top = topName && topNode ? topNode.children : tree
    const options = [
      {
        text: '请选择...',
        value: null
      }
    ].concat(flatten(top))

    return options
  }

  static parseObjectID (key, value) {
    return this.formatObjectID(key, value)
  }

  async validate (data, rules = {}, messages = {}) {
    rules = Object.assign({}, this.rules() || {}, rules)
    let labels = await this.constructor.labels()
    messages = Object.assign({}, Antl.list('validations'), messages)
    labels = Object.assign({}, Antl.list('labels'), labels)
    const validation = await Validator.validate(data, rules, messages)
    if (validation.fails()) {
      let errorMessages = _.each(validation.messages(), v => {
        v.message = String(v.message).replace(v.field, labels[v.field] || v.field)
        return v
      })
      throw new HttpException(errorMessages, 422)
    }
    return true
  }

  static async labels () {
    return _.mapValues(this.fields, 'label')
  }

  static getLabel (key) {
    return this.labels[key] || inflection.titleize(key).replace(/(^\s+|\s+$)/, '')
  }

  static getValue (model, key) {
    const field = this.fields[key]
    let value = _.get(model, field.ref || key)
    const initValue = value
    if (value) {
      try {
        if ((field.type === 'date' || key.match(/_at$/)) && value.indexOf('T') > -1) {
          value = new Date(value).toLocaleString()
        } else if (field.options) {
          value = _.find(field.options, v => v.value === value).text
        }
      } catch (e) {
        value = initValue
      }
    }
    return value
  }

  rules () {
    return {}
  }

  merge (data) {
    const newData = _.pickBy(data, (v, k) => this.constructor.fillable.includes(k))
    return super.merge.call(this, newData)
  }

  uploadUri (val) {
    if (!val || typeof val !== 'string') {
      return ''
    }
    if (val.match(/^http/i)) {
      return val
    }
    return use('Drive').getUrl(val)
  }

  static scopeListFields (query) {
    query.select(this.listFields || [])
  }

  static get listFields () {
    let fields = _.pickBy(this.fields, v => ['html'].includes(v.type))
    fields = _.map(_.keys(fields), v => '-' + v)
    fields.concat(['deleted_at'])
    return fields
  }

  user () {
    return this.belongsTo('App/Models/User', 'user_id', '_id')
  }

  async fetchAppends (ctx, appends) {
    for (let key of appends) {
      const getter = 'append' + inflection.camelize(key)
      if (this[getter]) {
        this[key] = await this[getter](ctx)
      }
    }
  }
}
