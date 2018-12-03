const ON_DEATH = require('death')
const child_process = require('child_process')
const request = require('request-promise')
const jsonfile = require('jsonfile')
const fs = require('fs')
const getVmessList = require('./getVmessList')
const baseConfig = require('./src/baseConfig.json')
const config = require('./config.json');
const kill = require('kill-port')

const checkV2rayStarted = /(V2Ray )\d.\d( started)/;

global.timeHandler = 0
kill(config.httpPort).then(data => {
  console.log('Find port in use,try to kill process');
}).catch(e => {
  console.log('Port is able to use');
})

// keep process handler
let v2rayProcess
//let  = child_process.spawn('/usr/bin/v2ray/v2ray', [], { cwd: './temp' })
//v2rayPrcess.stderr.on('data', (data) => {
//console.error(data.toString('utf8'), 'stderr');
//})
//v2rayPrcess.kill('SIGHUP')
//stop v2ray when exit

//check port in use

ON_DEATH((singal, err) => {
  if (err) {
    console.log(err);
  }
  clearTimeout(timeHandler)
  try {
    v2rayPrcess.kill('SIGHUP')
  } catch (e) {
    /* handle error */
  }
  return console.log(`\nCleaning and stop v2ray`);
})

function reloadV2rayAndTest(v2rayProcessHandler) {
  try {
    v2rayProcessHandler.kill('SIGHUP')
  } catch (e) {
    /* handle error */
  }
  v2rayProcessHandler = child_process.spawn('/usr/bin/v2ray/v2ray', [], { cwd: './temp' })
  v2rayProcessHandler.on('close', (data) => {
    console.log('v2ray Closed with code: ', data);
  })
  return new Promise((reslove) => {
    v2rayProcessHandler.stdout.on('data', (data) => {
      console.log(data.toString('utf8'));
      if (checkV2rayStarted.test(data.toString('utf8'))) {
        testConnection(reslove)
      }
    })
  })
}

//test if connection is OK
function testConnection(cb) {
  let connectionSuccess = true
  const UrlToTest = [
    'https://www.google.com.hk',
    'https://twitter.com'
  ]

  for (const url of UrlToTest) {
    request({
      url: url,
      proxy: 'http://localhost:8002'
    }).then((res) => {
      cb(true)
    }).catch(e => {
      connectionSuccess = false
    })
    if (connectionSuccess) {
      break
    }
  }
  if (!connectionSuccess) {
    cb(false)
    return false
  }
}

const generateConfig = async(cb, cbParams) => {
  const vmessList = await getVmessList.getVmessList(config.subscribe)

  for (const vmess of vmessList) {
    const vmessConfig = baseConfig
    vmessConfig.outbound.settings.vnext[0].address = vmess.add
    vmessConfig.outbound.settings.vnext[0].port = parseInt(vmess.port)
    vmessConfig.outbound.settings.vnext[0].users[0].id = vmess.id
    vmessConfig.inbound.port = parseInt(config.socks5Port)
    vmessConfig.inbound.port = parseInt(config.socks5Port)
    vmessConfig.inboundDetour[0].port = parseInt(config.httpPort)
    if (vmess.tls === 'tls') {
      vmessConfig.outbound.streamSettings.security = 'tls'
      vmessConfig.outbound.streamSettings.tlsSettings.serverName = vmess.add
      //vmessConfig.outbound.settings.streamSettings.tlsSettings.allowInsecure = true
    }
    try {
      fs.unlinkSync('./temp/config.json')
    } catch (e) {
      /* handle error */
    }
    await jsonfile.writeFile('./temp/config.json', vmessConfig,{ spaces: 2 })
    const result = await cb(cbParams)
    if (result) {
      console.log('find usable server:' + vmess.add);
      return
    } else {
      console.log('server not useable, searching');
    }
  }
}

//start up
generateConfig((processHandler) => {
  return reloadV2rayAndTest(processHandler)
}, v2rayProcess)

//check every 5min
function continusTest() {
  clearTimeout(timeHandler)
  timeHandler = setTimeout(() => {
    testConnection((r) => {
      console.log(r);
      if (r) {
        console.log('server is useable')
        continusTest(th)
      } else {
        console.log('server is down, choose a new server');
        generateConfig((processHandler) => {
          return reloadV2rayAndTest(processHandler)
        }, v2rayProcess)
        continusTest(th)
      }
    })
  }, 1000*60*5)
}

continusTest()
//(async() => {
//const result = await reloadV2rayAndTest(v2rayProcess)
//console.log(result, 'koko');
//})()
