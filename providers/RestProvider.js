const { ServiceProvider } = require('@adonisjs/fold')

class RestProvider extends ServiceProvider {
  register () {
    // register bindings
    this.app.bind('Rest/Controllers/ResourceController', app => {
      const ResourceController = require('../src/controllers/ResourceController')
      return ResourceController
    })

    this._registerMiddleware()
    this._registerModels()
  }

  _registerModels () {
    this.app.bind('Rest/Models/Model', () => {
      return require('../src/Models/Model')
    })
    // this.app.bind('Rest/Models/AdminUser', () => {
    //   return require('../src/Models/AdminUser')
    // })
  }

  _registerMiddleware () {
    this.app.bind('Rest/Middleware/Resource', () => {
      const Middleware = require('../src/Middleware/Resource')
      return new Middleware()
    })
    this.app.bind('Rest/Middleware/Query', () => {
      const Middleware = require('../src/Middleware/Query')
      return new Middleware()
    })
    this.app.bind('Rest/Middleware/Auth', () => {
      const Middleware = require('../src/Middleware/Auth')
      return new Middleware()
    })

    const Server = this.app.use('Server')

    Server.registerNamed({
      'rest-resource': 'Rest/Middleware/Resource',
      'rest-query': 'Rest/Middleware/Query',
      'rest-auth': 'Rest/Middleware/Auth'
    })
  }

  boot () {
    const Route = this.app.use('Route')
    Route.rest = (prefix, configKey) => {
      const config = this.app.use('Config').get(`rest.${configKey}`)
      const controller = '@provider:Rest/Controllers/ResourceController'
      Route.group(() => {
        Route.get(':resource/grid', `${controller}.grid`)
        Route.get(':resource/form', `${controller}.form`)
        Route.get(':resource/view', `${controller}.view`)
        Route.get(':resource/stat', `${controller}.stat`)
        Route.get(':resource/export', `${controller}.export`)
        Route.delete(':resource', `${controller}.destroyAll`)
        Route.resource('/:resource', controller)
      }).prefix(prefix).middleware([
        `rest-auth:${config.auth || 'jwt'}`,
        `rest-query:${configKey}`,
        `rest-resource`
      ])
    }
  }
}

module.exports = RestProvider
