import Joi from 'joi'
import HapiJwt from 'hapi-auth-jwt2'

const optionsSchema = Joi.object({
    jwtPublicKey: Joi.string().required(),
}).required()

export const plugin = {
    name: 'auth',
    register: async (server, options) => {
        Joi.assert(options, optionsSchema)

        await server.register(HapiJwt)

        server.auth.strategy('jwt', 'jwt', {
            key: options.jwtPublicKey,
            // Le cookie est posé via h.state() : Hapi le chiffre (Iron). hapi-auth-jwt2
            // lit sinon la valeur brute du header Cookie, ce qui invalide le JWT.
            cookieKey: false,
            customExtractionFunc: (request) => request.state.token,
            validate: async (decoded) => {
                const isValid = decoded.id != null
                return { isValid, credentials: decoded }
            },
            verifyOptions: { algorithms: ['RS256'] },
        })

        server.auth.default('jwt')
    },
}
