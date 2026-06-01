import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    calculateClassicPoints,
    calculateRiskPoints,
} from '../src/services/calculatePoints.js'

describe('calculateClassicPoints', () => {
    it('issue + deux scores exacts (5 pts)', () => {
        const pronostic = { goalsTeamA: 2, goalsTeamB: 1 }
        const game = { goalsTeamA: 2, goalsTeamB: 1 }

        assert.equal(calculateClassicPoints(pronostic, game), 5)
    })

    it('victoire équipe B + scores exacts', () => {
        const pronostic = { goalsTeamA: 1, goalsTeamB: 2 }
        const game = { goalsTeamA: 1, goalsTeamB: 2 }

        assert.equal(calculateClassicPoints(pronostic, game), 5)
    })

    it('match nul + scores exacts', () => {
        const pronostic = { goalsTeamA: 1, goalsTeamB: 1 }
        const game = { goalsTeamA: 1, goalsTeamB: 1 }

        assert.equal(calculateClassicPoints(pronostic, game), 5)
    })

    it('bonne issue mais mauvais scores (3 pts)', () => {
        const pronostic = { goalsTeamA: 2, goalsTeamB: 2 }
        const game = { goalsTeamA: 1, goalsTeamB: 1 }

        assert.equal(calculateClassicPoints(pronostic, game), 3)
    })

    it('bonne issue vainqueur A, scores incorrects', () => {
        const pronostic = { goalsTeamA: 2, goalsTeamB: 1 }
        const game = { goalsTeamA: 3, goalsTeamB: 0 }

        assert.equal(calculateClassicPoints(pronostic, game), 3)
    })

    it('mauvaise issue, seul le score A est bon (1 pt)', () => {
        const pronostic = { goalsTeamA: 1, goalsTeamB: 0 }
        const game = { goalsTeamA: 1, goalsTeamB: 1 }

        assert.equal(calculateClassicPoints(pronostic, game), 1)
    })

    it('mauvaise issue, seul le score B est bon (1 pt)', () => {
        const pronostic = { goalsTeamA: 1, goalsTeamB: 0 }
        const game = { goalsTeamA: 0, goalsTeamB: 0 }

        assert.equal(calculateClassicPoints(pronostic, game), 1)
    })

    it('tout faux (0 pt)', () => {
        const pronostic = { goalsTeamA: 3, goalsTeamB: 0 }
        const game = { goalsTeamA: 0, goalsTeamB: 2 }

        assert.equal(calculateClassicPoints(pronostic, game), 0)
    })
})

describe('calculateRiskPoints', () => {
    it('risquette gagnée (+3)', () => {
        const predictRisk = { willHappen: true, amount: 3, happened: true }

        assert.equal(calculateRiskPoints(predictRisk), 3)
    })

    it('pas de réponse risquette (0 pt)', () => {
        const predictRisk = { willHappen: null, amount: 0, happened: true }

        assert.equal(calculateRiskPoints(predictRisk), 0)
    })

    it('willHappen null ignore amount (0 pt)', () => {
        const predictRisk = { willHappen: null, amount: 3, happened: true }

        assert.equal(calculateRiskPoints(predictRisk), 0)
    })

    it('risquette perdue (-3)', () => {
        const predictRisk = { willHappen: true, amount: 3, happened: false }

        assert.equal(calculateRiskPoints(predictRisk), -3)
    })

    it('grand 8 : classique 5 + risquette 3', () => {
        const pronostic = { goalsTeamA: 2, goalsTeamB: 1 }
        const game = { goalsTeamA: 2, goalsTeamB: 1 }
        const risk = { willHappen: true, amount: 3, happened: true }

        assert.equal(
            calculateClassicPoints(pronostic, game) + calculateRiskPoints(risk),
            8
        )
    })
})
