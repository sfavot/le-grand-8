const MIN_SECRET_LENGTH = 32

const REQUIRED_IN_PRODUCTION = [
    'cookie.secret',
    'httpSecret',
    'adminPassword',
    'neo4j.uri',
    'neo4j.password',
]

export function validateProductionConfig(conf) {
    if (conf.get('env') !== 'production') {
        return
    }

    const missing = REQUIRED_IN_PRODUCTION.filter((key) => {
        const value = conf.get(key)
        return value == null || String(value).trim() === ''
    })

    if (missing.length > 0) {
        throw new Error(
            `Missing required configuration in production: ${missing.join(', ')}`
        )
    }

    const httpSecret = conf.get('httpSecret')
    if (String(httpSecret).length < MIN_SECRET_LENGTH) {
        throw new Error(
            `HTTP_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production`
        )
    }

    if (!conf.get('cookie.isSecure')) {
        throw new Error('COOKIE_IS_SECURE must be true in production')
    }

    const jwtPublic = process.env.JWT_PUBLIC_KEY
    if (jwtPublic == null || String(jwtPublic).trim() === '') {
        throw new Error(
            'Missing JWT_PUBLIC_KEY in production: paste the PEM content in Railway (not JWT_PUBLIC_KEY_PATH)'
        )
    }
}
