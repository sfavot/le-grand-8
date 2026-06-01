import JWT from 'jsonwebtoken'
import { loadJwtPrivateKey } from './jwt-keys.js'

let jwtPrivateKey

function getPrivateKey() {
    if (!jwtPrivateKey) {
        jwtPrivateKey = loadJwtPrivateKey()
    }

    return jwtPrivateKey
}

export function sign(object, expiresIn = '1d') {
    return JWT.sign(object, getPrivateKey(), {
        expiresIn,
        algorithm: 'RS256',
    })
}
