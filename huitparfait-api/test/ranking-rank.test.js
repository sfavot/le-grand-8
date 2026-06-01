import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateRank } from '../src/services/ranking-rank.js'

describe('calculateRank', () => {
    it('classement simple', () => {
        const ranking = [
            { totalScore: 3 },
            { totalScore: 2 },
            { totalScore: 1 },
        ]

        assert.deepEqual(calculateRank(ranking), [
            { totalScore: 3, rank: 1 },
            { totalScore: 2, rank: 2 },
            { totalScore: 1, rank: 3 },
        ])
    })

    it('ex æquo au même rang, saut du rang suivant', () => {
        const ranking = [
            { totalScore: 3 },
            { totalScore: 3 },
            { totalScore: 1 },
        ]

        assert.deepEqual(calculateRank(ranking), [
            { totalScore: 3, rank: 1 },
            { totalScore: 3, rank: 1 },
            { totalScore: 1, rank: 3 },
        ])
    })

    it('trois ex æquo en tête', () => {
        const ranking = [
            { totalScore: 10 },
            { totalScore: 10 },
            { totalScore: 10 },
            { totalScore: 5 },
        ]

        const result = calculateRank(ranking)

        assert.equal(result[0].rank, 1)
        assert.equal(result[1].rank, 1)
        assert.equal(result[2].rank, 1)
        assert.equal(result[3].rank, 4)
    })
})
