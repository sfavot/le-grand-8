import Joi from 'joi'
import { calculateGroupsRanking, calculateRanking, fetchCommonRankingWithPaginate } from '../services/rankingService.js'

export const plugin = {
    name: 'ranking-route',
    register: async (server) => {
        server.route([
            {
                method: 'GET',
                path: '/api/ranking/general',
                options: {
                    description: 'Fetch common ranking',
                    tags: ['api'],
                    validate: {
                        query: Joi.object({
                            page: Joi.number().integer().min(0),
                            pageSize: Joi.number().integer().min(0).max(100),
                        }),
                    },
                    handler: async (request, _h) => fetchCommonRankingWithPaginate(request.query),
                },
            },
            {
                method: 'GET',
                path: '/api/ranking/groups',
                options: {
                    description: 'Fetch groups ranking (average member score)',
                    tags: ['api'],
                    validate: {
                        query: Joi.object({
                            page: Joi.number().integer().min(0),
                            pageSize: Joi.number().integer().min(0).max(100),
                        }),
                    },
                    handler: async (request, _h) => calculateGroupsRanking({
                        ...request.query,
                        userId: request.auth.credentials.id,
                    }),
                },
            },
            {
                method: 'GET',
                path: '/api/ranking/{groupId}',
                options: {
                    description: 'Fetch ranking',
                    tags: ['api'],
                    validate: {
                        query: Joi.object({
                            page: Joi.number().integer().min(0),
                            pageSize: Joi.number().integer().min(0),
                        }),
                    },
                    handler: async (request, _h) => calculateRanking({
                        ...request.query,
                        userId: request.auth.credentials.id,
                        groupId: request.params.groupId,
                    }),
                },
            },
        ])
    },
}
