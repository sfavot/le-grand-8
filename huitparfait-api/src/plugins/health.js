export const plugin = {
    name: 'health',
    register: async (server) => {
        server.route({
            method: 'GET',
            path: '/health',
            options: { auth: false },
            handler: () => ({ status: 'ok', service: 'huitparfait-api' }),
        })
    },
}
