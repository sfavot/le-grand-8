import Boom from '@hapi/boom'
import Joi from 'joi'
import { generateId, userIdSchema, groupIdSchema } from '../infra/utils.js'
import { cypher, cypherOne } from '../infra/neo4j.js'
import { emptyIfDeleted } from '../infra/replyUtils.js'
import { betterGroup } from '../services/groupService.js'
import { assertGameIsPredictable, fetchAllUserPredictions, groupPredictionsByPeriod } from '../services/predictionsService.js'
import { formatCurrentUser, fetchUserById, formatPublicUser, generateName, areActiveGroupMembers } from '../services/userService.js'

const httpsUri = Joi.string().uri({ scheme: [/https/] }).allow('', null)

export const plugin = {
    name: 'users-route',
    register: async (server) => {
        server.route([
        {
            method: 'POST',
            path: '/api/users/me',
            options: {
                auth: 'jwt-anonymous',
                validate: {
                    payload: Joi.object({
                        email: Joi.string().email().required(),
                        name: Joi.string(),
                        avatarUrl: httpsUri,
                        oAuthId: Joi.string(),
                        oAuthProvider: Joi.string(),
                    }).required(),
                },
                handler: async (request, _h) => {
                    const userId = generateId()
                    const anonymousName = generateName(userId)

                    return cypherOne(`
                        MERGE         (u:User { email: {email} })
                        ON CREATE SET u.createdAt        = timestamp(),
                                      u.updatedAt        = timestamp(),
                                      u.id               = {userId},
                                      u.name             = {name},
                                      u.anonymousName    = {anonymousName},
                                      u.email            = {email},
                                      u.avatarUrl        = {avatarUrl},
                                      u.oAuthAvatarUrl   = {oAuthAvatarUrl},
                                      u.oAuthId          = {oAuthId},
                                      u.oAuthProvider    = {oAuthProvider},
                                      u.lastConnectionAt = timestamp(),
                                      u.isAnonymous      = false
                        ON MATCH SET  u.lastConnectionAt = timestamp(),
                                      u.updatedAt        = timestamp(),
                                      u.oAuthAvatarUrl   = coalesce({oAuthAvatarUrl}, u.oAuthAvatarUrl)
                        RETURN        u.id            AS id,
                                      u.name          AS name,
                                      u.anonymousName AS anonymousName,
                                      u.avatarUrl     AS avatarUrl,
                                      u.oAuthAvatarUrl AS oAuthAvatarUrl,
                                      u.isAnonymous   AS isAnonymous`,
                        {
                            userId,
                            email: request.payload.email,
                            name: request.payload.name ?? null,
                            oAuthId: request.payload.oAuthId ?? null,
                            oAuthProvider: request.payload.oAuthProvider ?? null,
                            anonymousName,
                            avatarUrl: request.payload.avatarUrl || null,
                            oAuthAvatarUrl: request.payload.oAuthProvider && request.payload.avatarUrl
                                ? request.payload.avatarUrl
                                : null,
                        })
                },
            },
        },
        {
            method: 'GET',
            path: '/api/users/me',
            options: {
                description: 'Read user infos',
                tags: ['api'],
                handler: async (request, _h) => {
                    const user = await cypherOne(`
                        MATCH (u:User { id: {id} })
                        RETURN u.id            AS id,
                               u.name          AS name,
                               u.email         AS email,
                               u.anonymousName AS anonymousName,
                               u.avatarUrl     AS avatarUrl,
                               u.oAuthAvatarUrl AS oAuthAvatarUrl,
                               u.isAnonymous   AS isAnonymous`,
                        {
                            id: request.auth.credentials.id,
                        })
                    return formatCurrentUser(user)
                },
            },
        },
        {
            method: 'PUT',
            path: '/api/users/me',
            options: {
                description: 'Update user\'s infos',
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        name: Joi.string(),
                        avatarUrl: httpsUri,
                        isAnonymous: Joi.boolean(),
                    }),
                },
                handler: async (request, _h) => {
                    const user = await cypherOne(`
                        MATCH (u:User { id: {userId} })
                        SET u.updatedAt   = timestamp(),
                            u.name        = {userName},
                            u.avatarUrl   = {userAvatarUrl}, 
                            u.isAnonymous = {userIsAnonymous}
                        RETURN u.id            AS id,
                               u.name          AS name,
                               u.email         AS email,
                               u.anonymousName AS anonymousName,
                               u.avatarUrl     AS avatarUrl,
                               u.oAuthAvatarUrl AS oAuthAvatarUrl,
                               u.isAnonymous   AS isAnonymous`,
                        {
                            userId: request.auth.credentials.id,
                            userName: request.payload.name ?? null,
                            userAvatarUrl: request.payload.avatarUrl || null,
                            userIsAnonymous: request.payload.isAnonymous ?? null,
                        })
                    return formatCurrentUser(user)
                },
            },
        },
        {
            method: 'DELETE',
            path: '/api/users/me',
            options: {
                description: 'Delete current user account and related data',
                tags: ['api'],
                handler: async (request, h) => {
                    const result = await cypherOne(`
                        MATCH (u:User { id: {userId} })
                        WITH u, 1 AS deleteCount
                        OPTIONAL MATCH (u)<-[:CREATED_BY_USER]-(p:Pronostic)
                        DETACH DELETE p
                        WITH DISTINCT u, deleteCount
                        DETACH DELETE u
                        RETURN deleteCount`,
                        {
                            userId: request.auth.credentials.id,
                        })
                    return emptyIfDeleted(result, h)
                },
            },
        },
        {
            method: 'GET',
            path: '/api/users/me/groups',
            options: {
                description: 'Read user\'s groups',
                tags: ['api'],
                handler: async (request, _h) => {
                    const groups = await cypher(`
                        MATCH    (:User { id:{id} })-[imog:IS_MEMBER_OF_GROUP { isActive: true }]->(g:Group)
                        MATCH    (u:User)-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g)
                        RETURN   g.name               AS name,
                                 g.avatarUrl          AS avatarUrl,
                                 g.id                 AS id,
                                 imog.isAdmin         AS isAdmin,
                                 count(DISTINCT u.id) AS userCount
                        ORDER BY lower(g.name)`,
                        {
                            id: request.auth.credentials.id,
                        })
                    return groups.map(betterGroup)
                },
            },
        },
        {
            method: 'GET',
            path: '/api/users/me/groups/left',
            options: {
                description: 'Read groups the user has left',
                tags: ['api'],
                handler: async (request, _h) => {
                    const groups = await cypher(`
                        MATCH    (:User { id:{id} })-[imog:IS_MEMBER_OF_GROUP]->(g:Group)
                        WHERE    imog.isActive = false AND coalesce(imog.isExcluded, false) = false
                        MATCH    (u:User)-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g)
                        RETURN   g.name               AS name,
                                 g.avatarUrl          AS avatarUrl,
                                 g.id                 AS id,
                                 imog.isAdmin         AS isAdmin,
                                 count(DISTINCT u.id) AS userCount
                        ORDER BY lower(g.name)`,
                        {
                            id: request.auth.credentials.id,
                        })
                    return groups.map(betterGroup)
                },
            },
        },
        {
            method: 'GET',
            path: '/api/users/me/predictions/{period}',
            options: {
                description: 'List games',
                tags: ['api'],
                handler: async (request, _h) => {
                    const predictions = await fetchAllUserPredictions(request.auth.credentials.id)

                    return groupPredictionsByPeriod(predictions, request.params.period)
                },
            },
        },
        {
            method: 'GET',
            path: '/api/users/{userId}/predictions/{period}',
            options: {
                description: 'Read another user\'s past predictions',
                tags: ['api'],
                validate: {
                    params: Joi.object({
                        userId: userIdSchema,
                        period: Joi.string().valid('matchs-precedents', 'previous-days').required(),
                    }),
                    query: Joi.object({
                        groupId: groupIdSchema.optional(),
                    }).unknown(true),
                },
                handler: async (request, _h) => {
                    const user = await fetchUserById(request.params.userId)

                    if (user == null) {
                        throw Boom.notFound()
                    }

                    let transformAnonymous = true

                    if (request.query.groupId != null && request.query.groupId !== 'general') {
                        const viewerId = request.auth.credentials.id
                        const inSameGroup = await areActiveGroupMembers(
                            request.query.groupId,
                            [viewerId, request.params.userId],
                        )

                        if (inSameGroup) {
                            transformAnonymous = false
                        }
                    }

                    const predictions = await fetchAllUserPredictions(request.params.userId)

                    return {
                        user: formatPublicUser(user, { transformAnonymous }),
                        predictions: groupPredictionsByPeriod(predictions, request.params.period),
                    }
                },
            },
        },
        {
            method: 'POST',
            path: '/api/users/me/predictions',
            options: {
                description: 'Save a user\'s prediction about a game',
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        gameId: Joi.string(),
                        predictionScoreTeamA: Joi.number().integer().min(0).required(),
                        predictionScoreTeamB: Joi.number().integer().min(0).required(),
                        predictionRiskAnswer: Joi.boolean(),
                        predictionRiskAmount: Joi.number().integer().min(0).max(3).required(),
                    }),
                },
                handler: async (request, _h) => {
                    const userId = request.auth.credentials.id
                    const isPredictable = await assertGameIsPredictable(userId, request.payload.gameId)

                    if (!isPredictable) {
                        throw Boom.badRequest('Les protagonistes de ce match ne sont pas encore connus')
                    }

                    const pronosticId = generateId()

                    return cypherOne(`
                        MATCH (u:User { id: {userId} })
                        MATCH (g:Game { id: {gameId} })
                        WHERE g.startsAt > timestamp()

                        MATCH (ta:Team)-[:PLAYS_IN_GAME { order: 1 }]->(g)
                        MATCH (tb:Team)-[:PLAYS_IN_GAME { order: 2 }]->(g)
                        MATCH (r:Risk)-[:USED_FOR_GAME]->(g)
                        
                        MERGE (g)<-[:IS_ABOUT_GAME]-(p:Pronostic)-[:CREATED_BY_USER]->(u)
                        ON CREATE SET   p.createdAt = timestamp(),
                                        p.updatedAt = timestamp(),
                                        p.id        = {pronosticId}
                        ON MATCH SET    p.updatedAt = timestamp()
                        
                        MERGE (p)-[sa:PREDICT_SCORE]->(ta)
                        SET sa.goals = {predictionScoreTeamA}
                        
                        MERGE (p)-[sb:PREDICT_SCORE]->(tb)
                        SET sb.goals = {predictionScoreTeamB}
                        
                        MERGE (p)-[pr:PREDICT_RISK]->(r)
                        SET pr.willHappen = {predictionRiskAnswer}
                        SET pr.amount = {predictionRiskAmount}
                        
                        RETURN p
                        `,
                        {
                            userId,
                            gameId: request.payload.gameId,
                            predictionScoreTeamA: request.payload.predictionScoreTeamA,
                            predictionScoreTeamB: request.payload.predictionScoreTeamB,
                            predictionRiskAnswer: request.payload.predictionRiskAnswer != null
                                ? request.payload.predictionRiskAnswer : null,
                            predictionRiskAmount: request.payload.predictionRiskAmount,
                            pronosticId,
                        })
                },
            },
        },
        ])
    },
}
