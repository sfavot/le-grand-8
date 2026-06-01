import path from 'path'
import { fileURLToPath } from 'url'
import Inert from '@hapi/inert'
import Config from '../infra/config.js'

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

export const plugin = {
    name: 'static-front',
    register: async (server) => {
        if (!Config.get('proxy.serveStaticFront')) {
            return
        }

        const publicDir = path.join(packageRoot, 'public')
        const indexHtml = path.join(publicDir, 'index.html')

        await server.register(Inert)

        server.route({
            method: 'GET',
            path: '/{path*}',
            options: { auth: false },
            handler: {
                directory: {
                    path: publicDir,
                    redirectToSlash: true,
                    index: ['index.html'],
                },
            },
        })

        server.ext('onPreResponse', (request, h) => {
            const response = request.response
            const path = request.path

            if (
                response.isBoom
                && response.output.statusCode === 404
                && request.method === 'get'
                && !path.startsWith('/api/')
                && !path.startsWith('/auth/')
            ) {
                // Chemin absolu requis : h.file('index.html', { root }) résout mal le fichier avec Inert 7.
                return h.file(indexHtml).takeover()
            }

            return h.continue
        })
    },
}
