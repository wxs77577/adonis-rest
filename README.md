# AdonisJs Restful API

> **Not ready for production**
  Currently support [AdonisJs v4](https://adonisjs.com/)+[MongoDB](https://github.com/duyluonglc/lucid-mongo) only.
  Also check [REST-ADMIN](https://github.com/wxs77577/rest-admin) - An awesome admin dashboard based on vue 2 and bootstrap v4

## Setup
> Install [lucid-mongo](https://github.com/duyluonglc/lucid-mongo) first.

1.  ```bash
    # install adonis-rest, also you can add `--yarn`
    adonis install adonis-rest
    ```
1. `/start/app.js`
    ```js
    const providers = [
      /* import Rest Provider */
      'adonis-rest/providers/RestProvider',
    ]
    ```

1. `/start/routes.js`
    ```js
    `Route.rest('/rest/api', 'api')`
    ```
1. Request `http://localhost:3333/rest/api/users` (or another port) should return paginated user list.

## Documentation 

### Config
The config file of `adonis-rest` is `/config/rest.js`,you can define any number of **modules** of adonis-rest routes. e.g. For **frontend api** and **backend api**, we call them `api` and `admin`
```js
module.exports = {
  //route module name
  api: {
    //authenticator name
    auth: 'jwt',

    // which means there are only `index` and `show` routes
    isAdmin: false,

    //all of your resources config
    resources: {
      
      // for `/products`
      products: {
        // must access with a valid token
        auth: true,

        // all of your default query config for `/products`
        query: {

          // when list all products
          index: {
            // fetch appends, please refer to **Appends**
            append: ['is_buy'],

            // fetch related data
            with: ['categories'],

            // also you can define default sorting
            sort: { _id: -1 },
          },

          // when show a product
          show: {
            append: ['is_buy'],
          }
        }
      },
      
    }
  },
  admin: {
    //maybe `adminJwt`
    auth: 'jwt',

    //allow C(create)/U(update)D/(delete) routes
    isAdmin: true,

    //allow destroy all routes
    allowDestroyAll: true,


    resources: {
      // ...
    }
  }
}
```

And then, you can add routes easily:
`/start/routes.js`
```js
/**
 * @param String base url
 * @param string key of route module in `/config/rest.js`
 **/
Route.rest('/rest/api', 'api')
Route.rest('/rest/admin', 'admin')
```
Now, You can check the followed links: (if your port of server is `3333`)

- http://localhost:3333/rest/api/product
- http://localhost:3333/rest/admin/products


### Base Model
There is a more powerful base model `Rest/Models/Model`

You can define a `Product` model like this:

```js
const Model = use('Rest/Models/Model')

module.exports = class Product extends Model {

}
```