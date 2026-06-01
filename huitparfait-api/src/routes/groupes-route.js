import Joi from 'joi'
import { cypher, cypherOne } from '../infra/neo4j.js'
import { shortIdSchema } from '../infra/utils.js'
import { emptyResponse, emptyIfDeleted } from '../infra/replyUtils.js'
import { betterGroup } from '../services/groupService.js'

const httpsUri = Joi.string().uri({ scheme: [/https/] })

export const plugin = {
    name: 'groupes-route',
    register: async (server) => {
        server.route([
            {
                method: 'GET',
                path: '/api/groups/{groupId}/invite',
                options: {
                    auth: false,
                    description: 'Public group summary for invite link previews',
                    tags: ['api'],
                    validate: {
                        params: Joi.object({
                            groupId: shortIdSchema,
                        }),
                    },
                    handler: async (request, _h) => {
                        const result = await cypherOne(`
                        MATCH (g:Group { id: {groupId} })
                        OPTIONAL MATCH (u:User)-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g)
                        RETURN g.id        AS id,
                               g.name      AS name,
                               g.avatarUrl AS avatarUrl,
                               count(DISTINCT u.id) AS userCount`,
                        {
                            groupId: request.params.groupId,
                        })

                        const group = betterGroup(result)

                        return {
                            id: group.id,
                            name: group.name,
                            slug: group.slug,
                            avatarUrl: group.avatarUrl,
                            userCount: group.userCount,
                        }
                    },
                },
            },
            {
                method: 'GET',
                path: '/api/groups/{groupId}',
                options: {
                    description: 'Read group',
                    tags: ['api'],
                    validate: {
                        params: Joi.object({
                            groupId: shortIdSchema,
                        }),
                    },
                    handler: async (request, _h) => {
                        const result = await cypherOne(`
                        MATCH  (me:User { id: {userId} })-[imog:IS_MEMBER_OF_GROUP { isActive: true }]->(g:Group { id: {groupId} })
                        MATCH  (u:User)-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g)
                        RETURN g.id        AS id, 
                               g.name      AS name, 
                               g.avatarUrl AS avatarUrl, 
                               imog.isAdmin AS isAdmin,
                               coalesce(g.excludeFromGroupsRanking, false) AS excludeFromGroupsRanking,
                               count(DISTINCT u.id) AS userCount`,
                        {
                            userId: request.auth.credentials.id,
                            groupId: request.params.groupId,
                        })
                        return betterGroup(result)
                    },
                },
            },
            {
                method: 'PUT',
                path: '/api/groups/{groupId}',
                options: {
                    description: 'Update group',
                    tags: ['api'],
                    validate: {
                        params: Joi.object({
                            groupId: shortIdSchema,
                        }),
                        payload: Joi.object({
                            name: Joi.string().required(),
                            avatarUrl: httpsUri,
                            excludeFromGroupsRanking: Joi.boolean(),
                        }).required(),
                    },
                    handler: async (request, _h) => {
                        const result = await cypherOne(`
                        MATCH (u:User { id: {userId} })
                        MERGE (u)-[imog:IS_MEMBER_OF_GROUP { isAdmin: true }]->(g:Group { id: {groupId} })
                        ON CREATE SET imog.createdAt = timestamp(),
                                      imog.updatedAt = timestamp(),
                                      imog.isAdmin   = true,
                                      imog.isActive  = true,
                                      g.createdAt    = timestamp(),
                                      g.updatedAt    = timestamp(),
                                      g.id           = {groupId},
                                      g.name         = {groupName},
                                      g.avatarUrl    = {groupAvatarUrl},
                                      g.excludeFromGroupsRanking = coalesce({excludeFromGroupsRanking}, false)
                        ON MATCH SET  imog.updatedAt = timestamp(),
                                      g.updatedAt    = timestamp(),
                                      g.name         = {groupName},
                                      g.avatarUrl    = {groupAvatarUrl},
                                      g.excludeFromGroupsRanking = coalesce({excludeFromGroupsRanking}, g.excludeFromGroupsRanking)
                        RETURN        g.id AS id,
                                      g.name AS name,
                                      g.avatarUrl AS avatarUrl,
                                      coalesce(g.excludeFromGroupsRanking, false) AS excludeFromGroupsRanking,
                                      1 AS userCount`,
                        {
                            userId: request.auth.credentials.id,
                            groupId: request.params.groupId,
                            groupName: request.payload.name,
                            groupAvatarUrl: request.payload.avatarUrl || null,
                            excludeFromGroupsRanking: request.payload.excludeFromGroupsRanking ?? false,
                        })
                        return betterGroup(result)
                    },
                },
            },
            {
                method: 'DELETE',
                path: '/api/groups/{groupId}',
                options: {
                    description: 'Delete group',
                    tags: ['api'],
                    validate: {
                        params: Joi.object({
                            groupId: shortIdSchema,
                        }),
                    },
                    handler: async (request, h) => {
                        const result = await cypherOne(`
                        MATCH  (:User { id: {userId} })-[:IS_MEMBER_OF_GROUP { isAdmin: true }]->(g:Group { id: {groupId} })
                        MATCH  (u:User)-[m:IS_MEMBER_OF_GROUP]->(g)
                        DELETE g, m
                        RETURN count(g) AS deleteCount`,
                        {
                            userId: request.auth.credentials.id,
                            groupId: request.params.groupId,
                        })
                        return emptyIfDeleted(result, h)
                    },
                },
            },
            {
                method: 'GET',
                path: '/api/groups/{groupId}/users',
                options: {
                    description: 'Read group\'s users',
                    tags: ['api'],
                    validate: {
                        params: Joi.object({
                            groupId: shortIdSchema,
                        }),
                    },
                    handler: async (request, _h) => cypher(`
                        MATCH (:User { id: {userId} })-[:IS_MEMBER_OF_GROUP { isAdmin: true }]->(g:Group { id: {groupId} })
                        MATCH    (u:User)-[m:IS_MEMBER_OF_GROUP]->(g)
                        WHERE    m.isActive OR coalesce(m.isExcluded, true)
                        RETURN   u.id        AS id, 
                                 u.name      AS name, 
                                 u.avatarUrl AS avatarUrl, 
                                 m.isAdmin   AS isAdmin, 
                                 m.isActive  AS isActive,
                                 m.createdAt AS memberSince
                        ORDER BY isAdmin,
                                 memberSince DESC`,
                    {
                        userId: request.auth.credentials.id,
                        groupId: request.params.groupId,
                    }),
                },
            },
            {
                method: 'POST',
                path: '/api/groups/{groupId}/users',
                options: {
                    description: 'Create link between the user and a group',
                    tags: ['api'],
                    validate: {
                        params: Joi.object({
                            groupId: shortIdSchema,
                        }),
                    },
                    handler: async (request, h) => {
                        await cypherOne(`
                        MATCH (u:User { id: {userId} }), (g:Group { id: {groupId} })
                        MERGE (u)-[m:IS_MEMBER_OF_GROUP]->(g)
                        ON CREATE SET 
                            m.createdAt = timestamp(), 
                            m.updatedAt = timestamp(), 
                            m.isActive  = true,
                            m.isExcluded = false
                        ON MATCH SET
                            m.updatedAt = timestamp(),
                            m.isActive  = true,
                            m.isExcluded = false
                        RETURN m.createdAt AS unique`,
                        {
                            userId: request.auth.credentials.id,
                            groupId: request.params.groupId,
                        })
                        return emptyResponse(h)
                    },
                },
            },
            {
                method: 'DELETE',
                path: '/api/groups/{groupId}/users/me',
                options: {
                    description: 'Leave a group',
                    tags: ['api'],
                    validate: {
                        params: Joi.object({
                            groupId: shortIdSchema,
                        }),
                    },
                    handler: async (request, h) => {
                        await cypherOne(`
                        MATCH (u:User { id: {userId} })-[m:IS_MEMBER_OF_GROUP]->(g:Group { id: {groupId} })
                        SET m.updatedAt = timestamp(),
                            m.isActive  = false,
                            m.isExcluded = false
                        RETURN u.id AS id`,
                        {
                            userId: request.auth.credentials.id,
                            groupId: request.params.groupId,
                        })
                        return emptyResponse(h)
                    },
                },
            },
            {
                method: 'PUT',
                path: '/api/groups/{groupId}/users/{userId}',
                options: {
                    description: 'Update a user\'s active in a group',
                    tags: ['api'],
                    validate: {
                        params: Joi.object({
                            groupId: shortIdSchema,
                            userId: shortIdSchema,
                        }),
                        payload: Joi.object({
                            isActive: Joi.boolean().required(),
                        }),
                    },
                    handler: async (request, h) => {
                        await cypherOne(`
                        MATCH (:User { id: {adminId} })-[:IS_MEMBER_OF_GROUP { isAdmin: true }]->(g:Group { id: {groupId} })
                        MATCH (u:User { id: {userId} })-[m:IS_MEMBER_OF_GROUP]->(g)
                        SET m.updatedAt = timestamp(),
                            m.isActive  = {isActive},
                            m.isExcluded = {isExcluded}
                        RETURN u.id AS id`,
                        {
                            adminId: request.auth.credentials.id,
                            groupId: request.params.groupId,
                            userId: request.params.userId,
                            isActive: request.payload.isActive,
                            isExcluded: !request.payload.isActive,
                        })
                        return emptyResponse(h)
                    },
                },
            },
        ])
    },
}
