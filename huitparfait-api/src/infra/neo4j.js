import neo4j from 'neo4j-driver'
import _ from 'lodash'
import Boom from '@hapi/boom'
import Config from './config.js'

let driver

function getDriver() {
    if (driver == null) {
        const uri = Config.get('neo4j.uri')
        const username = Config.get('neo4j.username')
        const password = Config.get('neo4j.password')

        const auth = username != null && username !== ''
            ? neo4j.auth.basic(username, password)
            : neo4j.auth.basic('neo4j', password || 'neo4j')

        driver = neo4j.driver(uri, auth)
    }

    return driver
}

function recordToObject(record) {
    const item = {}

    record.keys.forEach((key) => {
        let value = record.get(key)

        if (neo4j.isInt(value)) {
            value = value.toNumber()
        }

        item[key] = value
    })

    return omitNull(item)
}

/** Ancien client Neo4j 2.x : `{email}` / `{ email }` → driver Neo4j 5 : `$email` */
export function toDriverCypher(fatQuery) {
    return fatQuery
        .replace(/\s+/g, ' ')
        .replace(/\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}/g, '$$$1')
}

/** Le driver Neo4j 5 refuse les paramètres `undefined` (seul `null` est accepté). */
export function sanitizeParams(params = {}) {
    return _.mapValues(params, (value) => (value === undefined ? null : value))
}

export async function cypher(fatQuery, params = {}) {
    const query = toDriverCypher(fatQuery)
    const session = getDriver().session()

    try {
        const result = await session.run(query, sanitizeParams(params))

        return result.records.map(recordToObject)
    } finally {
        await session.close()
    }
}

export async function cypherOne(fatQuery, params = {}) {
    const results = await cypher(fatQuery, params)

    if (results != null && results.length === 1) {
        return results[0]
    }

    throw Boom.notFound('Not unique result')
}

export async function closeDriver() {
    if (driver != null) {
        await driver.close()
        driver = null
    }
}

function omitNull(item) {
    return _.omitBy(item, _.isNil)
}
