import { expect } from 'chai'
import { buildScoreDisplay, buildTeamDisplay, isPhaseResultsComplete } from 'src/resultsUtils'

describe('isPhaseResultsComplete', () => {
    it('est vrai quand tous les matchs sont joués', () => {
        expect(isPhaseResultsComplete(6, 6)).to.equal(true)
    })

    it('est faux tant que la phase n\'est pas terminée', () => {
        expect(isPhaseResultsComplete(3, 6)).to.equal(false)
        expect(isPhaseResultsComplete(0, 0)).to.equal(false)
    })
})

describe('buildTeamDisplay', () => {
    const slottedGame = {
        countryCodeTeamA: null,
        countryNameTeamA: '2e du Groupe A',
        countryCodeTeamB: null,
        countryNameTeamB: '2e du Groupe B',
        bracketResolvedTeamA: {
            countryCode: 'za',
            countryName: 'Afrique du Sud',
        },
        bracketResolvedSourceA: 'partialResult',
        bracketResolvedTeamB: {
            countryCode: 'ca',
            countryName: 'Canada',
        },
        bracketResolvedSourceB: 'prediction',
    }

    it('affiche les équipes connues en direct sans source prono', () => {
        expect(buildTeamDisplay(slottedGame, 'A', 'live')).to.deep.equal({
            type: 'team',
            countryCode: 'za',
            countryName: 'Afrique du Sud',
        })
    })

    it('garde le slot en direct si seule la résolution prono existe', () => {
        expect(buildTeamDisplay(slottedGame, 'B', 'live')).to.deep.equal({
            type: 'slot',
            label: '2e du Groupe B',
        })
    })

    it('utilise la résolution prono dans la colonne predictive', () => {
        expect(buildTeamDisplay(slottedGame, 'B', 'predictive')).to.deep.equal({
            type: 'team',
            countryCode: 'ca',
            countryName: 'Canada',
        })
    })

    it('affiche le drapeau en predictive quand seul le candidat résultat existe', () => {
        const game = {
            countryCodeTeamA: null,
            countryNameTeamA: '1er du Groupe A',
            bracketResolvedTeamA: {
                countryCode: 'mx',
                countryName: 'Mexique',
            },
            bracketResolvedSourceA: 'result',
            bracketCandidatesTeamA: [
                {
                    source: 'result',
                    team: { countryCode: 'mx', countryName: 'Mexique' },
                },
            ],
        }

        expect(buildTeamDisplay(game, 'A', 'predictive')).to.deep.equal({
            type: 'team',
            countryCode: 'mx',
            countryName: 'Mexique',
        })
    })

    it('privilégie le candidat live en predictive quand les deux existent', () => {
        const game = {
            countryCodeTeamA: null,
            countryNameTeamA: '2e du Groupe A',
            bracketResolvedTeamA: {
                countryCode: 'de',
                countryName: 'Allemagne',
            },
            bracketResolvedSourceA: 'partialResult',
            bracketCandidatesTeamA: [
                {
                    source: 'partialResult',
                    team: { countryCode: 'de', countryName: 'Allemagne' },
                },
                {
                    source: 'prediction',
                    team: { countryCode: 'za', countryName: 'Afrique du Sud' },
                },
            ],
        }

        expect(buildTeamDisplay(game, 'A', 'predictive')).to.deep.equal({
            type: 'team',
            countryCode: 'de',
            countryName: 'Allemagne',
        })
    })

    it('privilégie le candidat live en direct', () => {
        const game = {
            countryCodeTeamA: null,
            countryNameTeamA: '2e du Groupe A',
            bracketResolvedTeamA: {
                countryCode: 'za',
                countryName: 'Afrique du Sud',
            },
            bracketResolvedSourceA: 'prediction',
            bracketCandidatesTeamA: [
                {
                    source: 'partialResult',
                    team: { countryCode: 'de', countryName: 'Allemagne' },
                },
                {
                    source: 'prediction',
                    team: { countryCode: 'za', countryName: 'Afrique du Sud' },
                },
            ],
        }

        expect(buildTeamDisplay(game, 'A', 'live')).to.deep.equal({
            type: 'team',
            countryCode: 'de',
            countryName: 'Allemagne',
        })
    })
})

describe('buildScoreDisplay', () => {
    it('affiche le résultat réel en direct', () => {
        expect(buildScoreDisplay({
            goalsTeamA: 2,
            goalsTeamB: 1,
            predictionScoreTeamA: 3,
            predictionScoreTeamB: 0,
        }, 'live')).to.deep.equal({
            goalsA: 2,
            goalsB: 1,
            penaltiesA: undefined,
            penaltiesB: undefined,
        })
    })

    it('affiche le résultat réel en predictive quand le match est joué', () => {
        expect(buildScoreDisplay({
            goalsTeamA: 2,
            goalsTeamB: 1,
            predictionScoreTeamA: 3,
            predictionScoreTeamB: 0,
        }, 'predictive')).to.deep.equal({
            goalsA: 2,
            goalsB: 1,
            penaltiesA: undefined,
            penaltiesB: undefined,
        })
    })

    it('affiche le prono en predictive quand le match n\'est pas joué', () => {
        expect(buildScoreDisplay({
            predictionScoreTeamA: 3,
            predictionScoreTeamB: 0,
        }, 'predictive')).to.deep.equal({
            goalsA: 3,
            goalsB: 0,
            penaltiesA: null,
            penaltiesB: null,
            isPrediction: true,
        })
    })
})
