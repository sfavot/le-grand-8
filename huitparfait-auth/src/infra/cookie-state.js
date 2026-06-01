import Config from './config.js'

export function jwtCookieStateOptions() {
    return {
        path: '/',
        isSecure: Config.get('cookie.isSecure'),
        isHttpOnly: true,
        sameSite: Config.get('cookie.isSameSite'),
    }
}
