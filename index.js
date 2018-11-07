const jsonfile = require('jsonfile')
const fs = require('fs')
const getVmessList = require('./getVmessList')
const baseConfig = require('./src/baseConfig.json')
const config = require('./config.json');

(async() => {
  const vmessList = await getVmessList.getVmessList(config.subscribe)

  for (const vmess of vmessList) {
    const vmessConfig = baseConfig
    vmessConfig.outbound.settings.vnext[0].address = vmess.add
    vmessConfig.outbound.settings.vnext[0].port = vmess.port
    vmessConfig.outbound.settings.vnext[0].users[0].id = vmess.id
    try {
      fs.unlinkSync('./temp/config.json')
    } catch (e) {
      /* handle error */
    }
    jsonfile.writeFile('./temp/config.json', vmessConfig,{ spaces: 2 } , (err) => {

    })
  }
})()

