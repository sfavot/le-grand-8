import Boom from '@hapi/boom'

export function emptyResponse(h) {
    return h.response().code(204)
}

export async function emptyIfDeleted(result, h) {
    if (result.deleteCount === 1) {
        return h.response().code(204)
    }

    throw Boom.notFound()
}
