// require('babel-core/register')

// use logger globally
global.Logger = require('./lib/logger')

/* eslint-disable */
if (!process.env.NODE_ENV)
  throw "NODE_ENV is required."
/* eslint-enable */

const config = require('./lib/config')
const app = require('./lib/app')
const PORT = parseInt(config.port, 0)

// initialize leanengine
const AV = require('leanengine')
AV.init({
  appId: config.leancloud.APP_ID, 
  appKey: config.leancloud.APP_KEY, 
  masterKey: config.leancloud.MASTER_KEY
})
AV.Cloud.useMasterKey()

app.listen(PORT, function () {
  console.log('\n----------------------------')
  console.log('Node app is running!')
  console.log('\tENV: \t%s', config.env)
  console.log('\tPORT: \t%s', PORT)
  console.log('\tPORTAL PREFIX: \t%s', config.portalPrefix)
  console.log('\tNODE VERSION: \t%s', process.version)
  console.log('----------------------------\n')
})