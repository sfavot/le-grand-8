import { generateSVGDataURIString } from 'identicons'
import { cypher, cypherOne } from '../infra/neo4j.js'
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
    const userId = user.userId ?? user.id

    if (user.isAnonymous && transformAnonymous) {
        return {
            id: userId,
            name: user.anonymousName,
            avatarUrl: defaultAvatarUrl(userId),
        }
    }

    return {
        id: userId,
        name: user.userName ?? user.name,
        avatarUrl: user.avatarUrl ?? defaultAvatarUrl(userId),
    }
}

/** Profil visible par les autres joueurs : jamais d’email ni de nom réel si anonyme. */
export function formatPublicUser(user = {}, { transformAnonymous = true } = {}) {
    return betterUser(user, transformAnonymous)
}

export function fetchUserById(userId) {
    return cypherOne(`
        MATCH (u:User { id: { userId } })
        RETURN
                u.id            AS userId,
                u.name          AS userName,
                u.anonymousName AS anonymousName,
                u.avatarUrl     AS avatarUrl,
                u.isAnonymous   AS isAnonymous`, {
        userId,
    })
}

export function areActiveGroupMembers(groupId, userIds) {
    return cypherOne(`
        MATCH (g:Group { id: { groupId } })
        MATCH (u:User)-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g)
        WHERE u.id IN { userIds }
        RETURN count(DISTINCT u.id) AS memberCount`, {
        groupId,
        userIds,
    }).then((result) => result != null && result.memberCount === userIds.length)
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
