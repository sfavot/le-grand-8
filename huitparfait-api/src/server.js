import Hapi from '@hapi/hapi'
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import HapiSwagger from 'hapi-swagger'
import Config from './infra/config.js'
import { loadJwtPublicKey } from './infra/jwt-keys.js'
import { getServerPort } from './infra/server-port.js'
import { plugin as authPlugin } from './plugins/auth.js'
import { plugin as healthPlugin } from './plugins/health.js'
import { plugin as rateLimitPlugin } from './plugins/rate-limit.js'
import { plugin as metricsPlugin } from './plugins/metrics.js'
import { plugin as usersRoutePlugin } from './routes/users-route.js'
import { plugin as groupesRoutePlugin } from './routes/groupes-route.js'
import { plugin as rankingRoutePlugin } from './routes/ranking-route.js'
import { plugin as adminRoutePlugin } from './routes/admin-route.js'
import { closeDriver } from './infra/neo4j.js'

const JWT_PUBLIC_KEY = loadJwtPublicKey()
const isDevelopment = Config.get('env') === 'development'

const plugins = [
    { plugin: healthPlugin },
    { plugin: rateLimitPlugin },
    {
        plugin: authPlugin,
        options: {
            jwtPublicKey: JWT_PUBLIC_KEY,
            httpSecret: Config.get('httpSecret'),
        },
    },
    { plugin: metricsPlugin },
    { plugin: usersRoutePlugin },
    { plugin: groupesRoutePlugin },
    { plugin: rankingRoutePlugin },
    { plugin: adminRoutePlugin },
]

if (isDevelopment) {
    plugins.push(
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: {
                routes: {
                    prefix: '/api',
                },
                documentationPath: '/console',
                jsonPath: '/swagger.json',
                info: {
                    title: 'Le Grand 8 API Documentation',
                },
            },
        }
    )
}

const init = async () => {
    const server = Hapi.server({
        port: getServerPort(),
        host: '0.0.0.0',
        router: {
            stripTrailingSlash: true,
        },
        routes: {
            security: {
                hsts: {
                    includeSubdomains: true,
                    maxAge: 31536000,
                },
            },
        },
        state: {
            strictHeader: false,
            isSecure: Config.get('cookie.isSecure'),
            isHttpOnly: true,
            password: Config.get('cookie.secret'),
            ttl: Config.get('cookie.ttl'),
        },
        debug: isDevelopment ? { request: ['error', 'uncaught'] } : false,
    })

    await server.register(plugins)
    await server.start()

    console.log('Server started at', server.info.uri)

    return server
}

init().catch((err) => {
    console.error(err)
    process.exit(1)
})

process.on('SIGTERM', async () => {
    await closeDriver()
    process.exit(0)
})
