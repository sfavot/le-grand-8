import Config from './infra/config.js'
import { sign } from './infra/jwt.js'

const API_BASE = Config.get('proxy.apiUrl')

export async function findOrCreateUserByProfile(profile) {
    const anonymousJwt = sign({ anonymous: true }, '5s')

    const payload = { ...profile }
    if (payload.avatarUrl === '' || payload.avatarUrl == null) {
        delete payload.avatarUrl
    }

    const response = await fetch(`${API_BASE}/api/users/me`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonymousJwt}`,
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`API error ${response.status}: ${text}`)
    }

    const result = await response.json()

    return sign({
        id: result.id,
        name: result.name,
        anonymousName: result.anonymousName,
        avatarUrl: result.avatarUrl,
        isAnonymous: result.isAnonymous,
    })
}
