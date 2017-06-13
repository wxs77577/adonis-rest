'use strict'

const inflect = require('i')()
const Validator = use('Adonis/Addons/Validator')

// class RestfulController {
class RestController {

  // create - POST /api/:resource
  * store(request, response) {
    const Model = this.resource(request.param('resource'))
    const model = new Model()
    yield this.save(model, request, response)
  }

  * save(model, request, response) {
    const data = request.all()
    let result
    model.fill(data)
    if (model.rules) {
      let rules = typeof model.rules === 'function' ? model.rules() : model.rules
      let messages = typeof model.messages === 'function' ? model.messages() : model.messages
      const validation = yield Validator.validateAll(data, rules, messages)
      if (validation.fails()) {
        return response.status(422).json(validation.messages())
      }
    }
    try {
      result = yield model.save()
    } catch (e) {
      return response.status(400).send({
        code: e.code,
        message: e.message
      })
    }
    response.json(model.toJSON())
  }

  // readMany - GET /api/:resource
  * index(request, response) {
    const model = this.resource(request.param('resource'))
    const query = model.query()

    let filter = JSON.parse(request.input('query', request.input('filter', request.input('where'))))
    let offset = request.input('offset', request.input('skip', 0))
    let limit =  request.input('perPage', request.input('limit', this.params.defaultPerPage))   
    
    let page = Math.max(1, request.input('page', Math.floor(offset / limit) + 1))
    
    let fields = request.input('fields')
    let expand = request.input('related', request.input('expand'))
    let groupBy = request.input('groupBy')
    let orderBy = request.input('orderBy')
    let pagination = request.input('pagination')
    fields && query.select(fields.split(/\s*,\s*/))
    expand && query.with(expand)
    // groupBy && query.groupBy(groupBy)    
    if (orderBy) {
      let dir = 'asc'
      if (orderBy.substr(0, 1) === '-') {
        orderBy = orderBy.substr(1)
        dir = 'desc'
      }
      query.orderBy(orderBy, dir)
    }
    
    let conditions = []
    const requestData = request.all()
    const keys = 'page query filter per_page perPage limit offset skip where expand fields groupBy orderBy pagination'.split(' ')
    // deal with fields filters
    for (let name in requestData) {
      if (keys.indexOf(name) < 0) {
        query.where(name, requestData[name])
      }
    }
    for (let field in filter) {
      let condition = filter[field]
      if (condition === '') {
        continue
      }
      if (typeof condition === 'string') {
        //query={"title": "a"}
        query.where(field, 'like', `%${condition}%`)
      } else if (Array.isArray(condition)) {
        /**
         * query={"created_at": [">", "2017-07-07"]}
         * query={"created_at": ["between", ["2017-07-01", "2017-07-31"]]}
         * query={"user_id": ["in", [1,2,3] ]}
         * query={"user_id": ["raw", 'user_id = 10' ]}
         */
        let [operator, value] = condition
        let Operator = operator[0].toUpperCase() + operator.slice(1)
        if ([
          'Not',
          'In', 'NotIn',
          'Null', 'NotNull',
          'Exists', 'NotExists',
          'Between', 'NotBetween',
          'Raw'
        ].indexOf(Operator) > -1) {
          query['where' + Operator](field, value)
        } else {
          query.where(field, operator, value)
        }
      } else {
        query.where(field, condition)
      }
    }
    let countQuery = query.clone()
    const count = yield countQuery.count('id as total').first()
    const total = count.total
    response.header('X-Pagination-Total-Count', total)
    response.header('X-Pagination-Page-Count', Math.ceil(total / limit))
    response.header('X-Pagination-Current-Page', page)
    response.header('X-Pagination-Per-Page', limit)
    // console.log(total)
    let results
    if (pagination) {
      results = yield query.paginate(page, limit)
    } else {
      results = yield query.offset(offset).limit(limit).fetch()
    }
    response.json(results)
  }

  // readOne - GET /api/:resource/:id
  * show(request, response) {
    const Model = this.resource(request.param('resource'))
    const query = Model.query().where({ id: request.param('id') })
    const expand = request.input('related', request.input('expand'))
    expand && query.with(expand)
    const result = yield query.first()
    response.json(result)
  }

  // update - PATCH /api/:resource/:id
  * update(request, response) {
    const instance = yield this.getInstance(request)
    yield this.save(instance, request, response)
  }

  // delete - DELETE /api/:resource/:id
  * destroy(request, response) {
    const instance = yield this.getInstance(request)
    const result = yield instance.delete()
    response.json(result)
  }

  // return model instance from :resource
  resource(resource) {
    if (this.model) {
      return this.model
    }
    return use('App/Model/' + inflect.classify(resource))
  }

  get model() {

  }

  get params(){
    return {
      defaultPerPage: 10
    }
  }

  * getInstance(request) {
    const Model = this.resource(request.param('resource'))
    const instance = yield Model.findOrFail(request.param('id'))
    return instance
  }
}

// module.exports = RestfulController
module.exports = RestController
