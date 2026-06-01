import _ from 'lodash'
import Joi from 'joi'
import Bell from '@hapi/bell'
import Config from '../infra/config.js'
import { findOrCreateUserByProfile } from '../user-service.js'
import { jwtCookieStateOptions } from '../infra/cookie-state.js'

const optionsSchema = Joi.object({
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
}).required()

/** Bell (Google) expose email sur profile.email, pas emails[0] (ancien format). */
function emailFromGoogleProfile(creds) {
    return creds.email
        ?? _.get(creds, 'emails[0].value')
        ?? _.get(creds, 'raw.email')
}

async function fetchGoogleEmailFromUserinfo(accessToken) {
    if (!accessToken) {
        return undefined
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
        return undefined
    }

    const data = await response.json()
    return data.email
}

export const plugin = {
    name: 'google',
    register: async (server, options) => {
        Joi.assert(options, optionsSchema)

        await server.register(Bell)

        server.auth.strategy('google', 'bell', {
            provider: 'google',
            password: Config.get('cookie.secret'),
            isSecure: Config.get('cookie.isSecure'),
            location: Config.get('server.url'),
            clientId: options.clientId,
            clientSecret: options.clientSecret,
        })

        server.route({
            method: 'GET',
            path: '/auth/google',
            options: {
                auth: {
                    strategy: 'google',
                    mode: 'try',
                },
                handler: async (request, h) => {
                    if (!request.auth.isAuthenticated) {
                        console.error('Google OAuth: not authenticated', request.auth.error)
                        return h.redirect('/')
                    }

                    const creds = request.auth.credentials.profile
                    const accessToken = request.auth.credentials.token
                    let email = emailFromGoogleProfile(creds)

                    if (!email) {
                        email = await fetchGoogleEmailFromUserinfo(accessToken)
                    }

                    if (!email) {
                        console.error('Google OAuth: email missing from profile', {
                            bellEmail: creds.email,
                            rawEmail: _.get(creds, 'raw.email'),
                        })
                        return h.redirect('/')
                    }

                    const rawPicture = _.get(creds, 'raw.picture') ?? _.get(creds, 'raw.image.url', '')
                    const avatarUrl = rawPicture
                        ? String(rawPicture).replace(/sz=50$/, 'sz=250')
                        : undefined
                    const profile = {
                        name: creds.displayName,
                        email,
                        oAuthId: creds.id,
                        oAuthProvider: 'google',
                    }
                    if (avatarUrl) {
                        profile.avatarUrl = avatarUrl
                    }

                    try {
                        const token = await findOrCreateUserByProfile(profile)
                        return h
                            .redirect('/')
                            .state('token', token, jwtCookieStateOptions())
                    } catch (err) {
                        console.error('Google OAuth: findOrCreateUserByProfile failed', err)
                        return h
                            .redirect('/')
                            .unstate('token', jwtCookieStateOptions())
                    }
                },
            },
        })
    },
}
