import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hasGameScore, isGameFinishedForPeriod } from '../src/infra/gameFinishedUtils.js'

describe('hasGameScore', () => {
    it('accepte un score à 0', () => {
        assert.equal(hasGameScore({ goalsTeamA: 0, goalsTeamB: 1 }), true)
    })

    it('refuse un score partiel', () => {
        assert.equal(hasGameScore({ goalsTeamA: 1, goalsTeamB: null }), false)
    })
})

describe('isGameFinishedForPeriod', () => {
    const startsAt = Date.UTC(2026, 5, 13, 18, 0, 0)

    it('retourne false sans score', () => {
        const now = startsAt + 3 * 60 * 60 * 1000

        assert.equal(isGameFinishedForPeriod({ startsAt, goalsTeamA: null, goalsTeamB: null }, now), false)
    })

    it('retourne false avec score mais moins de 2 h après le match', () => {
        const now = startsAt + 90 * 60 * 1000

        assert.equal(isGameFinishedForPeriod({ startsAt, goalsTeamA: 2, goalsTeamB: 1 }, now), false)
    })

    it('retourne true avec score et plus de 2 h après le match', () => {
        const now = startsAt + 2 * 60 * 60 * 1000 + 1

        assert.equal(isGameFinishedForPeriod({ startsAt, goalsTeamA: 2, goalsTeamB: 1 }, now), true)
    })
})
