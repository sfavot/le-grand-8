import Boom from '@hapi/boom'
import Config from '../infra/config.js'

const DEFAULT_WINDOW_MS = 60 * 1000
const DEFAULT_MAX_REQUESTS = 200
const ADMIN_MAX_REQUESTS = 40

const buckets = new Map()

function maxRequestsForPath(path) {
    if (path.startsWith('/api/admin')) {
        return ADMIN_MAX_REQUESTS
    }

    return DEFAULT_MAX_REQUESTS
}

export const plugin = {
    name: 'rate-limit',
    register: async (server, options) => {
        const windowMs = options.windowMs || DEFAULT_WINDOW_MS
        const isDevelopment = Config.get('env') === 'development'

        server.ext('onPreAuth', (request, h) => {
            if (isDevelopment) {
                return h.continue
            }

            const maxRequests = maxRequestsForPath(request.path)
            const key = `${request.info.remoteAddress || 'unknown'}:${maxRequests}`
            const now = Date.now()
            let bucket = buckets.get(key)

            if (bucket == null || now - bucket.startedAt > windowMs) {
                bucket = { startedAt: now, count: 0 }
                buckets.set(key, bucket)
            }

            bucket.count += 1

            if (bucket.count > maxRequests) {
                throw Boom.tooManyRequests('Too many requests')
            }

            return h.continue
        })
    },
}
