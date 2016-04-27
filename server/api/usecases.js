var AV = require('leanengine')
var _ = require('lodash')
var push = require('../common/push')

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var UseCase = AV.Object.extend('UseCase')

exports.find = function(req, res, next) {

  var pageLimit = req.query.pageLimit || 10
  var pageIndex = req.query.pageIndex || 0

  var query = new AV.Query(UseCase)
  query.descending('createdAt')
  query.skip(pageIndex * pageLimit)
  query.limit(pageLimit)
  query.include('categories')
  query.include('screenshots')

  query.find()
    .then(function(results) {
      // 主动序列化 json 列
      // 见：https://github.com/leancloud/docs/blob/master/md/cloud_code_faq.md#为什么查询-include-没有生效
      results.forEach(function (result) {
        populateObject(result, 'categories')
      })
      res.json(results)
    })
    .catch(next)
}

exports.count = function(req, res, next) {
  var query = new AV.Query(UseCase)

  query.count()
    .then(function(number) {
      res.send({
        count: number
      })
    })
    .catch(next)
}

exports.get = function(req, res, next) {
  var _id = req.params._id

  getUseCase(_id, true)
    .then(function(result) {
      res.json(result)
    })
    .catch(next)
}

/**
 * Search params:
 *   queryString
 *   limit
 *   sid
 */
exports.search = function(req, res, next) {
  var query = new AV.SearchQuery('UseCase')
  var queryString = req.query.queryString || '*'
  var sid = req.query.sid || ''
  var limit = req.query.limit || 10

  // Search Order
  var builder = new AV.SearchSortBuilder()
  builder.descending('createdAt')
  query.sortBy(builder)

  query.sid(sid)
  query.queryString(queryString)
  query.limit(limit)

  query.find().then(function(results) {
    res.json({
      data: results,
      total: query.hits(),
      hasMore: query.hasMore(),
      sid: query._sid
    })
    //处理 results 结果
  }).catch(next)
}

exports.put = function (req, res, next) {
  var _id = req.params._id
  var title = req.body.title
  var desc = req.body.desc
  /**
   * 已提交：submitted
   * 已通过：passed
   * 已拒绝：rejected
   */
  var status = req.body.status || ''

  // 查询
  getUseCase(_id)
    // 保存
    .then(function(result) {
      return result.save({
        title: title,
        desc: desc,
        status: status,
        featured: status === 'passed'
      })
    })
    // 再查询，同时推送通知
    .then(function(result) {
      
      if (status === 'passed') {
        var user = result.get('atUser')
        push.msgByUser({
          user: user,
          message: '恭喜，您提交的H5案例「' + result.get("title") + '」已被设为精选！'
        })
      }

      return getUseCase(_id, true)
    })
    // 返回
    .then(function(result) {
      populateUseCase(result)
      res.json(result)
    })
    .catch(next)
}


// 新增 Todo 项目
// router.post('/', function(req, res, next) {
//   var content = req.body.content
//   var todo = new Todo()
//   todo.set('content', content)
//   todo.save(null, {
//     success: function(todo) {
//       res.redirect('/todos')
//     },
//     error: function(err) {
//       next(err)
//     }
//   })
// })

function getUseCase (_id, isPopulateAll) {  // jshint ignore:line
  var query = new AV.Query(UseCase)
  if (isPopulateAll) {
    query.include('screenshots')
    query.include('categories')
    query.include('likes')
  }

  return new AV.Promise(function(resolve, reject) {
    query.get(_id, {
      success: function(result) {
        if (isPopulateAll)
          populateUseCase(result)

        resolve(result)
      },
      error: reject
    })
  });
}

function populateUseCase (result) {  // jshint ignore:line
  populateObject(result, 'categories')
  populateObject(result, 'likes')
  return result
}

function populateObject (result, key) {  // jshint ignore:line
  var arr = _.map(result.get(key), function(val) {
    return val.toJSON ? val.toJSON() : val
  })
  result.set(key, arr)
}

