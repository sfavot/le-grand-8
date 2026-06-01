import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const repoRoot = path.join(packageRoot, '..')

export function resolveFromRepo(relativePath) {
    if (path.isAbsolute(relativePath)) {
        return relativePath
    }

    const normalized = relativePath.replace(/^\.\//, '')
    const fromPackage = path.resolve(packageRoot, normalized)

    if (fs.existsSync(fromPackage)) {
        return fromPackage
    }

    if (normalized.startsWith('../')) {
        return path.resolve(repoRoot, normalized.replace(/^\.\.\//, ''))
    }

    return fromPackage
}
