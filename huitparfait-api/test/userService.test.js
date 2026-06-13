import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { betterUser, formatPublicUser } from '../src/services/userService.js'

describe('formatPublicUser', () => {
    it('masque le nom réel d’un joueur anonyme', () => {
        assert.deepEqual(formatPublicUser({
            userId: 'abc1234',
            userName: 'Jean Dupont',
            anonymousName: 'Loutre agile',
            isAnonymous: true,
        }), {
            id: 'abc1234',
            name: 'Loutre agile',
            avatarUrl: expectIdenticon('abc1234'),
        })
    })

    it('n’expose jamais l’email', () => {
        const publicUser = formatPublicUser({
            userId: 'abc1234',
            userName: 'Jean Dupont',
            email: 'jean@example.com',
            isAnonymous: false,
        })

        assert.equal(publicUser.email, undefined)
        assert.equal(publicUser.name, 'Jean Dupont')
    })
})

describe('betterUser', () => {
    it('conserve le nom réel dans un classement de groupe si demandé', () => {
        assert.deepEqual(betterUser({
            userId: 'abc1234',
            userName: 'Jean Dupont',
            anonymousName: 'Loutre agile',
            isAnonymous: true,
        }, false), {
            id: 'abc1234',
            name: 'Jean Dupont',
            avatarUrl: expectIdenticon('abc1234'),
        })
    })
})

function expectIdenticon(userId) {
    return betterUser({ userId, userName: 'x', isAnonymous: false }).avatarUrl
}
