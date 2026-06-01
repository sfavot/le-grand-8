import Hapi from '@hapi/hapi'
import H2o2 from '@hapi/h2o2'
import Config, { getCorsOrigins } from './infra/config.js'
import { loadJwtPublicKey } from './infra/jwt-keys.js'
import { getServerPort } from './infra/server-port.js'
import { plugin as authPlugin } from './plugins/auth.js'
import { plugin as healthPlugin } from './plugins/health.js'
import { plugin as rateLimitPlugin } from './plugins/rate-limit.js'
import { plugin as googlePlugin } from './providers/google.js'
import { plugin as routerPlugin } from './router.js'
import { plugin as staticFrontPlugin } from './plugins/static-front.js'
import { plugin as groupInvitePagePlugin } from './plugins/group-invite-page.js'

const JWT_PUBLIC_KEY = loadJwtPublicKey()

const init = async () => {
    const server = Hapi.server({
        port: getServerPort(),
        host: '0.0.0.0',
        router: {
            stripTrailingSlash: true,
        },
        routes: {
            cors: {
                credentials: true,
                origin: getCorsOrigins(),
            },
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
    })

    await server.register([
        H2o2,
        { plugin: healthPlugin },
        { plugin: rateLimitPlugin },
        {
            plugin: authPlugin,
            options: { jwtPublicKey: JWT_PUBLIC_KEY },
        },
        {
            plugin: googlePlugin,
            options: Config.get('google'),
        },
        { plugin: routerPlugin },
        { plugin: groupInvitePagePlugin },
        { plugin: staticFrontPlugin },
    ])

    await server.start()
    console.log('Server started at', server.info.uri)
}

init().catch((err) => {
    console.error(err)
    process.exit(1)
})
