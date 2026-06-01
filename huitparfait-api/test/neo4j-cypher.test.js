import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeParams, toDriverCypher } from '../src/infra/neo4j.js'

describe('toDriverCypher', () => {
    it('convertit les paramètres avec ou sans espaces', () => {
        assert.equal(
            toDriverCypher('WHERE u.id IN { userIds }'),
            'WHERE u.id IN $userIds',
        )
        assert.equal(
            toDriverCypher('MERGE (u:User { email: {email} })'),
            'MERGE (u:User { email: $email })',
        )
        assert.equal(
            toDriverCypher('MATCH (:User { id:{id} })'),
            'MATCH (:User { id:$id })',
        )
    })

    it('ne modifie pas les littéraux de propriétés', () => {
        assert.equal(
            toDriverCypher('[:IS_MEMBER_OF_GROUP { isActive: true }]'),
            '[:IS_MEMBER_OF_GROUP { isActive: true }]',
        )
        assert.equal(
            toDriverCypher('[:PLAYS_IN_GAME { order: 1 }]'),
            '[:PLAYS_IN_GAME { order: 1 }]',
        )
    })

    it('convertit les listes en paramètre (FOREACH, IN)', () => {
        assert.equal(
            toDriverCypher('FOREACH (pronostic in {pronostics} | MERGE (p:Pronostic { id: pronostic.pronosticId }))'),
            'FOREACH (pronostic in $pronostics | MERGE (p:Pronostic { id: pronostic.pronosticId }))',
        )
    })
})

describe('sanitizeParams', () => {
    it('remplace undefined par null', () => {
        assert.deepEqual(sanitizeParams({ a: 1, b: undefined, c: null }), { a: 1, b: null, c: null })
    })
})
