const { ServiceProvider } = require('@adonisjs/fold')

class RestProvider extends ServiceProvider {
  register () {
    // register bindings
    this.app.bind('Rest/Controllers/ResourceController', app => {
      const ResourceController = require('../src/Controllers/ResourceController')
      return ResourceController
    })
    this.app.bind('Rest/Controllers/ResourceControllerInstance', app => {
      const ResourceController = require('../src/Controllers/ResourceController')
      return new ResourceController
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
      const controller = config.controller || '@provider:Rest/Controllers/ResourceControllerInstance'
      Route.group(() => {
        
        if (config.isAdmin) {
          for (let path of ['grid', 'form', 'view', 'stat', 'export', 'options', 'stat']) {
            Route.get(`:resource/${path}`, `${controller}.${path}`).as(`${configKey}.resource.${path}`)
          }
          
          
          Route.post(':resource', `${controller}.store`).as(`${configKey}.resource.store`)
          Route.route(':resource/:id', `${controller}.update`, ['POST', 'PUT', 'PATCH']).as(`${configKey}.resource.update`)
          Route.delete(':resource', `${controller}.destroy`).as(`${configKey}.resource.destroy`)
        }
        
        if (config.allowDestroyAll) {
          Route.delete(':resource', `${controller}.destroyAll`).as(`${configKey}.resource.destroyAll`)
        }

        Route.get(':resource', `${controller}.index`).as(`${configKey}.resource.index`)
        Route.get(':resource/:id', `${controller}.show`).as(`${configKey}.resource.show`)

      }).prefix(prefix).middleware([
        `rest-auth:${config.auth || 'jwt'}`,
        `rest-query:${configKey}`,
        `rest-resource`
      ])

      Route.get(':resource/options', `${controller}.options`).middleware([
        `rest-auth:${config.auth || 'jwt'}`,
        'rest-resource:,allowAll'
      ]).as(`${configKey}.resource.options`)
    }
  }
}

module.exports = RestProvider
