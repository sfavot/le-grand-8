const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

function findRepoRoot(startDir) {
    let dir = path.resolve(startDir)

    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, '.env'))) {
            return dir
        }
        if (fs.existsSync(path.join(dir, 'docker-compose.yml'))) {
            return dir
        }
        dir = path.dirname(dir)
    }

    return path.resolve(startDir)
}

/**
 * Charge .env puis .env.local (surcharge) depuis la racine du dépôt.
 * @param {object} [options]
 * @param {string} [options.root] : racine explicite
 * @returns {string} chemin de la racine utilisée
 */
function loadEnv(options = {}) {
    const root = options.root || findRepoRoot(path.join(__dirname, '..'))
    const envPath = path.join(root, '.env')
    const localPath = path.join(root, '.env.local')

    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath })
    }

    if (fs.existsSync(localPath)) {
        dotenv.config({ path: localPath, override: true })
    }

    return root
}

module.exports = { loadEnv, findRepoRoot }
