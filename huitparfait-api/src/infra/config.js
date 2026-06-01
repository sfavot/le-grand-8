import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import convict from 'convict'
import schema from '../../config/default-config.json' with { type: 'json' }
import { validateProductionConfig } from './validate-production-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

/** En prod (Railway), les variables viennent de la plateforme, pas de .env sur disque. */
if (process.env.NODE_ENV !== 'production') {
    const loadEnvCandidates = [
        path.join(__dirname, '../../../scripts/load-env.js'),
        path.join(__dirname, '../../scripts/load-env.js'),
    ]

    for (const loadEnvPath of loadEnvCandidates) {
        if (fs.existsSync(loadEnvPath)) {
            require(loadEnvPath).loadEnv()
            break
        }
    }
}

const conf = convict(schema)

conf.validate({ strict: true })
validateProductionConfig(conf)

export default conf
