import { expect } from 'chai'
import {
    computePreviousMatchesStats,
    formatAvgRiskedPoints,
    formatOneDecimal,
    formatSuccessRate,
} from 'src/previousMatchesStats'

describe('computePreviousMatchesStats', () => {
    it('agrège score, risquettes et issues', () => {
        const stats = computePreviousMatchesStats([
            {
                points: 8,
                classicPoints: 5,
                riskPoints: 3,
                predictionRiskAnswer: true,
                predictionRiskAmount: 3,
            },
            {
                points: 2,
                classicPoints: 2,
                riskPoints: -2,
                predictionRiskAnswer: false,
                predictionRiskAmount: 2,
            },
            {
                points: 3,
                classicPoints: 3,
                riskPoints: 0,
                predictionRiskAnswer: null,
                predictionRiskAmount: 0,
            },
        ])

        expect(stats).to.deep.equal({
            totalScore: 13,
            nbPredictions: 3,
            nbPerfects: 1,
            nbRisquettesWon: 1,
            nbRisquettesLost: 1,
            nbRisquettesNotPlayed: 1,
            avgRiskedPoints: 2.5,
            risquetteSuccessRate: 50,
            nbOutcomesWon: 2,
            nbOutcomesLost: 1,
            outcomeSuccessRate: (2 / 3) * 100,
            avgPointsPerMatch: 13 / 3,
        })
    })

    it('retourne null pour la moyenne sans risquette jouée', () => {
        const stats = computePreviousMatchesStats([
            {
                points: 3,
                classicPoints: 3,
                riskPoints: 0,
                predictionRiskAnswer: null,
            },
        ])

        expect(stats.avgRiskedPoints).to.equal(null)
        expect(stats.risquetteSuccessRate).to.equal(null)
        expect(stats.outcomeSuccessRate).to.equal(100)
        expect(stats.avgPointsPerMatch).to.equal(3)
    })
})

describe('formatAvgRiskedPoints', () => {
    it('formate avec une virgule', () => {
        expect(formatAvgRiskedPoints(2.5)).to.equal('2,5')
    })
})

describe('formatOneDecimal', () => {
    it('formate avec une virgule', () => {
        expect(formatOneDecimal(4.333)).to.equal('4,3')
    })
})

describe('formatSuccessRate', () => {
    it('arrondit au pourcentage entier', () => {
        expect(formatSuccessRate(66.666)).to.equal('67')
    })
})
