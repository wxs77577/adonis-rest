'use strict'

const inflect = require('i')()

// class RestfulController {
class RestController {

  // create - POST /api/:resource
  * store(request, response) {
    const model = this.resource(request.param('resource'))
    const data = request.all()
    let result
    try {
      result = yield model.create(data)
    } catch (e) {
      return response.status(400).send({
        code: e.code,
        message: e.message
      })
    }
    response.json(result)
  }

  // readMany - GET /api/:resource
  * index(request, response) {
    const model = this.resource(request.param('resource'))
    const query = model.query()
    const where = JSON.parse(request.input('query'))
    let conditions = []
    for (let k in where) {
      const v = where[k]
      if (v === '') {
        continue
      }
      if (typeof v === 'string') {
        query.where(k, 'like', `%${v}%`)
      }
      console.log(k, v)
    }

    //    if (where) {
    //      query.where(where)
    //    }
    const results = yield query.paginate(request.input('page', 1), request.input('per_page', 10))
    response.json(results)
  }

  // query - POST /api/:resource/query
  * query(request, response) {
    console.log('query():request', request.params(), request.get())

    const model = this.resource(request.param('resource'))
    const query = model.query()

    const where = request.input('where')
    console.log('query():where', where, typeof where)
    if (where) {
      query.where(where)
    }

    const related = request.input('related')
    console.log('query():related', related)
    if (related) {
      query.with(related)
    }

    const orderBy = request.input('orderBy')
    console.log('query():orderBy', orderBy)
    if (orderBy) {
      query.orderBy(orderBy.column, orderBy.direction)
    }

    const limit = request.input('limit')
    console.log('query():limit', limit)
    if (limit) {
      query.limit(limit)
    }

    const offset = request.input('offset')
    console.log('query():offset', offset)
    if (offset) {
      query.offset(offset)
    }

    const results = yield query.fetch()
    // console.log('index():results', results)
    response.json(results)
  }

  // readOne - GET /api/:resource/:id
  * show(request, response) {
    console.log('show()', request.all())
    const model = this.resource(request.param('resource'))
    const query = model.query().where({ id: request.param('id') })

    const related = request.input('related')
    console.log('show():related', related)
    if (related) {
      query.with(related)
    }

    const result = yield query.first()
    console.log('show():result', result)
    response.json(result)
  }

  // update - PATCH /api/:resource/:id
  * update(request, response) {
    const model = this.resource(request.param('resource'))
    const data = request.input('model')
    const instance = yield model.find(request.param('id'))
    const result = yield instance.update(data)
    response.json(result)
  }

  // delete - DELETE /api/:resource/:id
  * destroy(request, response) {
    const model = this.resource(request.param('resource'))
    const record = yield model.find(request.param('id'))
    const result = yield record.delete()
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
}

// module.exports = RestfulController
module.exports = RestController
