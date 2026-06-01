import Joi from 'joi'
import shortid from 'shortid'
import HapiJwt from 'hapi-auth-jwt2'
import Basic from '@hapi/basic'

const optionsSchema = Joi.object({
    jwtPublicKey: Joi.string().required(),
    httpSecret: Joi.string().allow(''),
}).required()

export const plugin = {
    name: 'auth',
    register: async (server, options) => {
        Joi.assert(options, optionsSchema)

        await server.register([HapiJwt, Basic])

        server.auth.strategy('jwt', 'jwt', {
            key: options.jwtPublicKey,
            validate: async (decoded) => {
                const isValid = shortid.isValid(decoded.id)
                return { isValid, credentials: decoded }
            },
            verifyOptions: { algorithms: ['RS256'] },
        })

        server.auth.default('jwt')

        server.auth.strategy('jwt-anonymous', 'jwt', {
            key: options.jwtPublicKey,
            validate: async (decoded) => {
                const isValid = decoded.anonymous === true
                return { isValid, credentials: decoded }
            },
            verifyOptions: { algorithms: ['RS256'] },
        })

        server.auth.strategy('http-basic', 'basic', {
            validate: async (request, username, password) => {
                const isValid = username === '8p'
                    && options.httpSecret != null
                    && options.httpSecret !== ''
                    && password === options.httpSecret

                return { isValid, credentials: {} }
            },
        })

    },
}
