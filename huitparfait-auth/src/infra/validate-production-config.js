const MIN_SECRET_LENGTH = 32

const REQUIRED_IN_PRODUCTION = [
    'cookie.secret',
    'google.clientId',
    'google.clientSecret',
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

    const cookieSecret = conf.get('cookie.secret')
    if (String(cookieSecret).length < MIN_SECRET_LENGTH) {
        throw new Error(
            `COOKIE_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production`
        )
    }

    if (!conf.get('cookie.isSecure')) {
        throw new Error('COOKIE_IS_SECURE must be true in production')
    }

    const proxyApiUrl = String(conf.get('proxy.apiUrl')).trim()
    let parsed
    try {
        parsed = new URL(proxyApiUrl)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error('unsupported protocol')
        }
    } catch {
        throw new Error(
            'PROXY_API_URL must be a full URL with scheme and port, e.g. '
            + 'http://${{huitparfait-api.RAILWAY_PRIVATE_DOMAIN}}:${{huitparfait-api.PORT}} '
            + `(got: ${proxyApiUrl})`
        )
    }

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        throw new Error(
            'PROXY_API_URL must target the Railway API service (réseau privé), not localhost. '
            + 'Ex. http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}} '
            + `(got: ${proxyApiUrl})`
        )
    }

    if (!parsed.port) {
        throw new Error(
            'PROXY_API_URL has no port (ex. http://….railway.internal: sans numéro). '
            + 'Sur Railway, ${{api.PORT}} est vide tant que le service api n’a pas une variable '
            + 'PORT définie manuellement (voir deploy/railway/DEPLOY.adoc). '
            + `(got: ${proxyApiUrl})`
        )
    }

    for (const envName of ['JWT_PUBLIC_KEY', 'JWT_PRIVATE_KEY']) {
        const value = process.env[envName]
        if (value == null || String(value).trim() === '') {
            throw new Error(
                `Missing ${envName} in production: paste the PEM content in Railway (not ${envName}_PATH)`
            )
        }
    }
}
