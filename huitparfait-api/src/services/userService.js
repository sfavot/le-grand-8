import { generateSVGDataURIString } from 'identicons'
import { cypher } from '../infra/neo4j.js'
import initAnimalAdj from '../infra/animal-adj/animal-adj.js'

const animalAdj = initAnimalAdj('fr')

const identiconOptions = { width: 70, size: 3 }

export function generateName(id) {
    return animalAdj(id)
}

export function defaultAvatarUrl(userId) {
    return generateSVGDataURIString(userId, identiconOptions)
}

export function formatCurrentUser(user = {}) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        anonymousName: user.anonymousName,
        isAnonymous: user.isAnonymous,
        avatarUrl: user.avatarUrl ?? null,
        defaultAvatarUrl: defaultAvatarUrl(user.id),
        oAuthAvatarUrl: user.oAuthAvatarUrl ?? null,
    }
}

export function betterUser(user = {}, transformAnonymous = false) {

    if (user.isAnonymous && transformAnonymous) {
        return {
            id: user.userId,
            name: user.anonymousName,
            avatarUrl: defaultAvatarUrl(user.userId),
        }
    }

    return {
        id: user.userId,
        name: user.userName,
        avatarUrl: user.avatarUrl ?? defaultAvatarUrl(user.userId),
    }
}

export function fetchUsersWithIds(userIds = []) {
    return cypher(`
        MATCH (u:User)
        WHERE u.id IN { userIds } 
        RETURN
                u.id            AS userId,
                u.name          AS userName,
                u.anonymousName AS anonymousName,
                u.avatarUrl     AS avatarUrl,
                u.isAnonymous   AS isAnonymous`, {
        userIds,
    })
}
