const atob = require('atob')
const https = require('https')
//const baseConfig = require('./src/baseConfig.json')
//const config = require('./config.json')

exports.getVmessList = function (subscribe) {
  return new Promise((reslove) => {

    const vmessList = []
    subscribe.map((subscribe, i) => {
      if (subscribe.type === 'vmess') {

        // Get subscribe
        https.get(subscribe.url, (resp) => {
          let data = ''
          resp.on('data', (chunk) => {
            data += chunk
          })

          resp.on('end', () => {
            let list = atob(data)
            list.split('\r\n').map(item => {
              if (item) {
                const server = JSON.parse(atob(item.substring(8)))
                console.log(server);
                vmessList.push(server)
              }
            })
            reslove(vmessList)
          })
        })
      }
    })
  })
}
