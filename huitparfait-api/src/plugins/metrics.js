import moment from 'moment'
import { cypherOne } from '../infra/neo4j.js'

const NODE_NAMES = ['Game', 'Group', 'Pronostic', 'Risk', 'Team', 'User']

export const plugin = {
    name: 'metrics',
    register: async (server) => {
        server.route({
            method: 'GET',
            path: '/api/metrics',
            options: {
                auth: 'http-basic',
                handler: async (_request, _h) => {
                    const dbMetrics = {}

                    for (const nodeName of NODE_NAMES) {
                        const metric = await cypherOne(
                            `MATCH (n:${nodeName}) RETURN "${nodeName}" AS name, COUNT(n) AS count`
                        )
                        dbMetrics[metric.name] = metric.count
                    }

                    return {
                        startedAt: moment(server.info.started).format(),
                        data: dbMetrics,
                    }
                },
            },
        })
    },
}
