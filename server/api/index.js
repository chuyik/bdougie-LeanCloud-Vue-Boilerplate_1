const express = require('express')
const validate = require('express-validation')
const Joi = require('joi')

const auth = require('../auth')
const newsList = require('./newsList')
const user = require('./user')

const router = express.Router()

// 免权限接口
router.post('/login', validate({
    body: {
        username: Joi.string().required(),
        password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/).required()
    }
}), user.login)
router.post('/logout', user.logout)

// 校验权限
router.use(auth.member)

// 权限接口
router.get('/me', user.me)

router.get('/newsList', newsList.find)
router.get('/newsList/count', newsList.count)
router.get('/newsList/search', newsList.search)
router.post('/newsList', newsList.post)
router.get('/newsList/:_id', newsList.get)
router.put('/newsList/:_id', newsList.put)

module.exports = router