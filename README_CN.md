# adonis-rest
基于AdonisJs的Restful API基础构件， AdonisJs中文网： [https://adonis-china.org](https://adonis-china.org)

## 安装

1. `cnpm install --save adonis-rest`


## 准备
Tips: 请确保你的`/app/Model/`目录里有一些模型文件.  如果没有的话可以用 `./ace make:model News` 来创建一个新闻模型

> /app/Http/routes.js
``` javascript
Route.put('/api/:resource', 'RestController.update') //可选
Route.resource('/api/:resource', 'RestController')
```

> Create `/app/Http/Controllers/RestController.js`

``` javascript
'use strict'

const BaseRestController = require('adonis-rest')

class RestController  extends BaseRestController{

}

module.exports = RestController
```

就这样，所有模型的Restful接口就可以访问了。

## 文档
> Base uri: `http://localhost:3333/api`

| 请求方法 | URL | 描述 |
| --- | --- | --- |
| GET | /news | 获取新闻列表 |
| POST | /news | 获取一条新闻 |
| PUT/PATCH | /news/:id | 修改一条新闻 |
| DELETE | /news/:id | 删除一条新闻 |

### GET `/news`
获取所有新闻

#### URL查询参数

| 参数名 | 示例值 | 描述 |
| --- | --- | --- |
| pagination | 1 | 获取包含分页信息的数据，否则获取扁平数组，不过你仍然可以通过`headers`来获取分页信息 |
| query | {"user_id": 1} | 查询条件，也可以用 `filter` 或 `where` |
| page | 1 |当前页 |
| perPage | 10 | 每页显示数量，也可以用 `limit` |
| offset | 10 | 跳过数量，也可以用 `skip` |
| fields | id,title,created_at | `select`的字段 |
| orderBy | id | 排序，可以用`-id`表示`desc`（降序） |

### Headers中的分页信息字段
- `X-Pagination-Total-Count`
- `X-Pagination-Page-Count`
- `X-Pagination-Current-Page`
- `X-Pagination-Per-Page`

### `query`字段的格式
- `query={"created_at": "2017-07-07"}`
- `query={"created_at": [">", "2017-07-07"]}` 或 `<`,`<>` 等等
- `query={"created_at": ["between", ["2017-07-01", "2017-07-31"]]}` 或 `notBetween`
- `query={"user_id": ["in", [1,2,3] ]}` 或 `notIn`
- `query={"user_id": ["raw", 'user_id IS NULL' ]}`


## 有问题?
在`Issues`里面告诉我
