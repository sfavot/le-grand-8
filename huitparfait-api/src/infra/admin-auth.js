import { timingSafeEqual } from 'crypto'
import Boom from '@hapi/boom'
import Config from './config.js'

export function getAdminPassword() {
    const adminPassword = Config.get('adminPassword')
    if (adminPassword == null || String(adminPassword).trim() === '') {
        return null
    }

    return String(adminPassword)
}

function passwordsMatch(provided, expected) {
    if (provided == null || expected == null) {
        return false
    }

    const providedBuf = Buffer.from(provided)
    const expectedBuf = Buffer.from(expected)

    if (providedBuf.length !== expectedBuf.length) {
        return false
    }

    return timingSafeEqual(providedBuf, expectedBuf)
}

export function createAssertAdminPre() {
    return {
        method: (request, h) => {
            const provided = request.headers['x-admin-password']
            const expected = getAdminPassword()

            if (expected == null) {
                throw Boom.internal('ADMIN_PASSWORD non configuré')
            }

            if (!passwordsMatch(provided, expected)) {
                throw Boom.unauthorized('Mot de passe admin invalide')
            }

            return h.continue
        },
    }
}
