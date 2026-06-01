import Joi from 'joi'
import _ from 'lodash'
import moment from 'moment'
import { generateId } from '../infra/utils.js'
import { cypher, cypherOne } from '../infra/neo4j.js'
import { emptyIfDeleted } from '../infra/replyUtils.js'
import { betterGroup } from '../services/groupService.js'
import { generateName } from '../services/userService.js'

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
                                      u.oAuthId          = {oAuthId},
                                      u.oAuthProvider    = {oAuthProvider},
                                      u.lastConnectionAt = timestamp(),
                                      u.isAnonymous      = false
                        ON MATCH SET  u.lastConnectionAt = timestamp(),
                                      u.updatedAt        = timestamp(),
                                      u.name             = coalesce({name}, u.name),
                                      u.avatarUrl        = coalesce({avatarUrl}, u.avatarUrl)
                        RETURN        u.id            AS id,
                                      u.name          AS name,
                                      u.anonymousName AS anonymousName,
                                      u.avatarUrl     AS avatarUrl,
                                      u.isAnonymous   AS isAnonymous`,
                        {
                            userId,
                            email: request.payload.email,
                            name: request.payload.name ?? null,
                            oAuthId: request.payload.oAuthId ?? null,
                            oAuthProvider: request.payload.oAuthProvider ?? null,
                            anonymousName,
                            avatarUrl: request.payload.avatarUrl || null,
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
                handler: async (request, _h) => cypherOne(`
                        MATCH (u:User { id: {id} })
                        RETURN u.id            AS id,
                               u.name          AS name,
                               u.email         AS email,
                               u.anonymousName AS anonymousName,
                               u.avatarUrl     AS avatarUrl,
                               u.isAnonymous   AS isAnonymous`,
                        {
                            id: request.auth.credentials.id,
                        }),
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
                handler: async (request, _h) => cypherOne(`
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
                               u.isAnonymous   AS isAnonymous`,
                        {
                            userId: request.auth.credentials.id,
                            userName: request.payload.name ?? null,
                            userAvatarUrl: request.payload.avatarUrl || null,
                            userIsAnonymous: request.payload.isAnonymous ?? null,
                        })
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
                    const predictions = await cypher(`
                        MATCH          (g:Game)
                        MATCH          (ta:Team)-[piga:PLAYS_IN_GAME {order: 1}]->(g)
                        MATCH          (tb:Team)-[pigb:PLAYS_IN_GAME {order: 2}]->(g)
                        MATCH          (r:Risk)-[ufg:USED_FOR_GAME]->(g)
                        OPTIONAL MATCH (g)<-[:IS_ABOUT_GAME]-(p:Pronostic)-[:CREATED_BY_USER]->(u:User { id: {userId} })
                        OPTIONAL MATCH (p)-[sa:PREDICT_SCORE]->(ta)
                        OPTIONAL MATCH (p)-[sb:PREDICT_SCORE]->(tb)
                        OPTIONAL MATCH (p)-[pr:PREDICT_RISK]->(r:Risk)
                        RETURN   g.id            AS gameId,
                                 g.phase         AS phase,
                                 g.city          AS city,
                                 g.name          AS gameName,
                                 g.stadium       AS stadium,
                                 g.startsAt      AS startsAt,
                                 ta.id           AS idTeamA,
                                 ta.countryCode  AS countryCodeTeamA,
                                 ta.countryName  AS countryNameTeamA,
                                 ta.group        AS group,
                                 tb.id           AS idTeamB,
                                 tb.countryCode  AS countryCodeTeamB,
                                 tb.countryName  AS countryNameTeamB,
                                 piga.goals      AS goalsTeamA,
                                 pigb.goals      AS goalsTeamB,
                                 piga.penalties  AS penaltiesTeamA,
                                 pigb.penalties  AS penaltiesTeamB,
                                 r.id            AS riskId,
                                 r.text          AS riskTitle,
                                 sa.goals        AS predictionScoreTeamA,
                                 sb.goals        AS predictionScoreTeamB,
                                 pr.willHappen   AS predictionRiskAnswer,
                                 pr.amount       AS predictionRiskAmount,
                                 p.classicPoints AS classicPoints,
                                 p.riskPoints    AS riskPoints,
                                 ufg.happened    AS riskHappened
                        ORDER BY g.startsAt
                        `,
                        {
                            userId: request.auth.credentials.id,
                        })

                    const allDates = _(predictions)
                        .map((game) => moment(game.startsAt).startOf('day').valueOf())
                        .uniq()
                        .value()

                    const today = moment().startOf('day').valueOf()
                    const nextDay = _(allDates).find((day) => day >= today)
                    const previousDay = _(allDates).slice().reverse().find((day) => day < today)

                    return _(predictions)
                        .filter((game) => {
                            const dayOfGame = moment(game.startsAt).startOf('day').valueOf()

                            if (request.params.period === 'previous-days'
                                || request.params.period === 'matchs-precedents') {
                                return dayOfGame <= previousDay
                            }

                            if (request.params.period === 'next-days'
                                || request.params.period === 'prochains-matchs') {
                                return dayOfGame >= nextDay
                            }

                            return true
                        })
                        .thru((allPredictions) => {
                            if (request.params.period === 'previous-days'
                                || request.params.period === 'matchs-precedents') {
                                return _(allPredictions).slice().reverse().value()
                            }

                            return allPredictions
                        })
                        .map((game) => {
                            game.predictionRiskAmount = game.predictionRiskAmount || 3

                            if (game.classicPoints != null) {
                                game.points = game.classicPoints + (game.riskPoints || 0)
                            }

                            return game
                        })
                        .groupBy((game) => moment(game.startsAt).startOf('day').valueOf())
                        .value()
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
                            userId: request.auth.credentials.id,
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
