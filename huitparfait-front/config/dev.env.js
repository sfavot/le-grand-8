// URL relative : même origine sur :3000 (recommandé) ou :8081 (avec proxyTable)
var apiUrl = process.env.API_URL || '/api'

module.exports = {
  NODE_ENV: '"development"',
  API_URL: JSON.stringify(apiUrl),
}
