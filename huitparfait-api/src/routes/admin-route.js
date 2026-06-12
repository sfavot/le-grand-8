import Joi from 'joi'
import { createAssertAdminPre } from '../infra/admin-auth.js'
import { fetchAdminGames, updateGameResults } from '../services/adminService.js'
import { calculatePronostic } from '../services/pronosticService.js'

const assertAdmin = createAssertAdminPre()

const adminRouteOptions = {
    auth: 'jwt',
    pre: [assertAdmin],
}

export const plugin = {
    name: 'admin-route',
    register: async (server) => {
        server.route([
            {
                method: 'GET',
                path: '/api/admin/games',
                options: {
                    ...adminRouteOptions,
                    description: 'Past games for admin result entry (pending or filled)',
                    tags: ['api', 'admin'],
                    validate: {
                        query: Joi.object({
                            filled: Joi.boolean().default(false),
                        }),
                    },
                    handler: async (request, _h) => fetchAdminGames({ filled: request.query.filled }),
                },
            },
            {
                method: 'PUT',
                path: '/api/admin/games/{gameId}',
                options: {
                    ...adminRouteOptions,
                    description: 'Set final score and risk outcome for a game',
                    tags: ['api', 'admin'],
                    validate: {
                        params: Joi.object({
                            gameId: Joi.string().required(),
                        }),
                        payload: Joi.object({
                            goalsTeamA: Joi.number().integer().min(0).max(99).required(),
                            goalsTeamB: Joi.number().integer().min(0).max(99).required(),
                            riskHappened: Joi.boolean().required(),
                        }),
                    },
                    handler: async (request, _h) => {
                        const updated = await updateGameResults({
                            gameId: request.params.gameId,
                            ...request.payload,
                        })
                        const pronostics = await calculatePronostic()

                        return {
                            ok: true,
                            gameId: updated.gameId,
                            pronosticsUpdated: pronostics?.length ?? 0,
                        }
                    },
                },
            },
            {
                method: 'POST',
                path: '/api/admin/calculate',
                options: {
                    ...adminRouteOptions,
                    description: 'Calculate points for eligible predictions',
                    tags: ['api', 'admin'],
                    handler: async (_request, _h) => {
                        const pronostics = await calculatePronostic()
                        return {
                            ok: true,
                            pronosticsUpdated: pronostics?.length ?? 0,
                        }
                    },
                },
            },
        ])
    },
}
