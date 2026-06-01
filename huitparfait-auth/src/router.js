import Config from './infra/config.js'
import { sign } from './infra/jwt.js'
import { jwtCookieStateOptions } from './infra/cookie-state.js'

const PROXY_CONFIG = Config.get('proxy')
const SERVE_STATIC_FRONT = Config.get('proxy.serveStaticFront')

export const plugin = {
    name: 'router',
    register: async (server) => {
        const routes = [
            {
                method: 'GET',
                path: '/auth/logout',
                options: {
                    auth: false,
                },
                handler: async (request, h) => h
                    .redirect('/')
                    .unstate('token', jwtCookieStateOptions()),
            },
            {
                method: 'PUT',
                path: '/api/users/me',
                options: {
                    handler: async (request, h) => {
                        const token = request.auth.token

                        const response = await fetch(`${PROXY_CONFIG.apiUrl}${request.path}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(request.payload),
                        })

                        if (!response.ok) {
                            const text = await response.text()
                            throw new Error(`API error ${response.status}: ${text}`)
                        }

                        const user = await response.json()
                        const newToken = sign(user)

                        return h
                            .response(user)
                            .state('token', newToken, jwtCookieStateOptions())
                    },
                },
            },
            {
                // Admin : session Google (JWT) + mot de passe admin (X-Admin-Password).
                method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                path: '/api/admin/{apiPath*}',
                options: {
                    auth: 'jwt',
                },
                handler: {
                    proxy: {
                        passThrough: true,
                        mapUri: (request) => {
                            const uri = `${PROXY_CONFIG.apiUrl}${request.path}${request.url.search || ''}`
                            const headers = {
                                authorization: `Bearer ${request.auth.token}`,
                            }

                            const adminPassword = request.headers['x-admin-password']
                            if (adminPassword) {
                                headers['x-admin-password'] = adminPassword
                            }

                            return { uri, headers }
                        },
                    },
                },
            },
            {
                // En Hapi, method: '*' ne matche pas GET si une route GET /{path*} existe (front statique).
                method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                path: '/api/{apiPath*}',
                options: {
                    auth: 'jwt',
                },
                handler: {
                    proxy: {
                        passThrough: true,
                        mapUri: (request) => {
                            const uri = `${PROXY_CONFIG.apiUrl}${request.path}${request.url.search || ''}`
                            const headers = {}

                            if (request.auth.isAuthenticated && request.auth.token) {
                                headers.authorization = `Bearer ${request.auth.token}`
                            }

                            return { uri, headers }
                        },
                    },
                },
            },
        ]

        if (!SERVE_STATIC_FRONT) {
            routes.push({
                method: '*',
                path: '/{frontPath*}',
                options: {
                    auth: false,
                },
                handler: {
                    proxy: {
                        passThrough: true,
                        mapUri: (request) => ({
                            uri: `${PROXY_CONFIG.frontUrl}${request.path}${request.url.search || ''}`,
                        }),
                    },
                },
            })
        }

        server.route(routes)
    },
}
