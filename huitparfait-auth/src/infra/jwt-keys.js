import fs from 'fs'
import Config from './config.js'
import { resolveFromRepo } from './paths.js'

function normalizePem(value) {
    return String(value).trim().replace(/\\n/g, '\n')
}

function loadFromEnvOrFile(envName, pathConfigKey) {
    const inline = process.env[envName]
    if (inline != null && String(inline).trim() !== '') {
        return normalizePem(inline)
    }

    const keyPath = resolveFromRepo(Config.get(pathConfigKey))
    if (!fs.existsSync(keyPath)) {
        const pathEnv = `${envName}_PATH`
        const hint = process.env[pathEnv]
            ? ` (${pathEnv} is set but the file is missing; use ${envName} with the PEM content on Railway)`
            : ` (set ${envName} with the PEM content on Railway)`

        throw new Error(`JWT key missing${hint}`)
    }

    return fs.readFileSync(keyPath, 'utf8')
}

export function loadJwtPublicKey() {
    return loadFromEnvOrFile('JWT_PUBLIC_KEY', 'jwt.publicKeyPath')
}

export function loadJwtPrivateKey() {
    return loadFromEnvOrFile('JWT_PRIVATE_KEY', 'jwt.privateKeyPath')
}
