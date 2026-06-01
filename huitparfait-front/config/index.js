// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path')

module.exports = {
  build: {
    env: require('./prod.env'),
    index: path.resolve(__dirname, '../dist/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    productionSourceMap: true
  },
  dev: {
    env: require('./dev.env'),
    port: Number(process.env.FRONT_DEV_PORT) || 8081,
    // Sans proxy, :8081/auth/google sert le SPA (200) au lieu d’OAuth → pas de cookie
    proxyTable: {
      '/auth': {
        target: process.env.SERVER_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.SERVER_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  }
}
