import Config from './config.js'

/** Railway et autres PaaS injectent PORT. */
export function getServerPort(configKey = 'server.port') {
    if (process.env.PORT != null && String(process.env.PORT).trim() !== '') {
        const port = Number(process.env.PORT)
        if (!Number.isNaN(port) && port > 0) {
            return port
        }
    }

    return Config.get(configKey)
}
