import { expect } from 'chai'
import {
    bracketTeamLabel,
    buildKnockoutBracketData,
    formatBracketMatchDate,
    scoreWinnerSide,
    splitRoundOf16MatchesByBracket,
    verticalBottomStageBridgePairStyle,
    verticalBottomStageSlotStyle,
    verticalBridgeGridStyle,
    verticalBridgePairStyle,
    verticalRoundGridStyle,
    verticalTopStageBridgePairStyle,
} from 'src/knockoutBracketLayout'

function makeKnockoutGame(n, phase, slotA, slotB, overrides = {}) {
    return Object.assign({
        gameId: `game-${n}`,
        gameName: `Match ${n}`,
        phase,
        startsAt: 1783000000000 + n * 86400000,
        countryCodeTeamA: null,
        countryCodeTeamB: null,
        countryNameTeamA: slotA,
        countryNameTeamB: slotB,
        goalsTeamA: null,
        goalsTeamB: null,
        penaltiesTeamA: null,
        penaltiesTeamB: null,
        predictionScoreTeamA: null,
        predictionScoreTeamB: null,
    }, overrides)
}

function wc2026KnockoutGames() {
    const json = [
        [73, '16èmes de finale', '2e du Groupe A', '2e du Groupe B'],
        [74, '16èmes de finale', '1er du Groupe E', '3e du Groupe A, B, C, D, F'],
        [75, '16èmes de finale', '1er du Groupe F', '2e du Groupe C'],
        [76, '16èmes de finale', '1er du Groupe C', '2e du Groupe F'],
        [77, '16èmes de finale', '1er du Groupe I', '3e du Groupe C, D, F, G, H'],
        [78, '16èmes de finale', '2e du Groupe E', '2e du Groupe I'],
        [79, '16èmes de finale', '1er du Groupe A', '3e du Groupe C, E, F, H, I'],
        [80, '16èmes de finale', '1er du Groupe L', '3e du Groupe E, H, I, J, K'],
        [81, '16èmes de finale', '1er du Groupe D', '3e du Groupe B, E, F, I, J'],
        [82, '16èmes de finale', '1er du Groupe G', '3e du Groupe A, E, H, I, J'],
        [83, '16èmes de finale', '2e du Groupe K', '2e du Groupe L'],
        [84, '16èmes de finale', '1er du Groupe H', '2e du Groupe J'],
        [85, '16èmes de finale', '1er du Groupe B', '3e du Groupe E, F, G, I, J'],
        [86, '16èmes de finale', '1er du Groupe J', '2e du Groupe H'],
        [87, '16èmes de finale', '1er du Groupe K', '3e du Groupe D, E, I, J, L'],
        [88, '16èmes de finale', '2e du Groupe D', '2e du Groupe G'],
        [89, '8èmes de finale', 'Vainqueur du Match 74', 'Vainqueur du Match 77'],
        [90, '8èmes de finale', 'Vainqueur du Match 73', 'Vainqueur du Match 75'],
        [91, '8èmes de finale', 'Vainqueur du Match 76', 'Vainqueur du Match 78'],
        [92, '8èmes de finale', 'Vainqueur du Match 79', 'Vainqueur du Match 80'],
        [93, '8èmes de finale', 'Vainqueur du Match 83', 'Vainqueur du Match 84'],
        [94, '8èmes de finale', 'Vainqueur du Match 81', 'Vainqueur du Match 82'],
        [95, '8èmes de finale', 'Vainqueur du Match 86', 'Vainqueur du Match 88'],
        [96, '8èmes de finale', 'Vainqueur du Match 85', 'Vainqueur du Match 87'],
        [97, 'Quart de finale', 'Vainqueur du Match 89', 'Vainqueur du Match 90'],
        [98, 'Quart de finale', 'Vainqueur du Match 93', 'Vainqueur du Match 94'],
        [99, 'Quart de finale', 'Vainqueur du Match 91', 'Vainqueur du Match 92'],
        [100, 'Quart de finale', 'Vainqueur du Match 95', 'Vainqueur du Match 96'],
        [101, 'Demi-finale', 'Vainqueur du Match 97', 'Vainqueur du Match 98'],
        [102, 'Demi-finale', 'Vainqueur du Match 99', 'Vainqueur du Match 100'],
        [103, 'Petite finale', 'Perdant du Match 101', 'Perdant du Match 102'],
        [104, 'Finale', 'Vainqueur du Match 101', 'Vainqueur du Match 102'],
    ]

    return json.map(([n, phase, slotA, slotB]) => makeKnockoutGame(n, phase, slotA, slotB))
}

describe('buildKnockoutBracketData', () => {
    it('ordonne les matchs du tableau CDM 2026', () => {
        const data = buildKnockoutBracketData(wc2026KnockoutGames(), null)

        expect(data).to.not.equal(null)
        expect(data.leafCount).to.equal(8)
        expect(data.leftRounds[0].matches.map((m) => m.matchNumber)).to.deep.equal([
            74, 77, 73, 75, 83, 84, 81, 82,
        ])
        expect(data.rightRounds[3].matches.map((m) => m.matchNumber)).to.deep.equal([
            76, 78, 79, 80, 86, 88, 85, 87,
        ])
        expect(data.final.matchNumber).to.equal(104)
        expect(data.thirdPlace.matchNumber).to.equal(103)
    })
})

describe('bracketTeamLabel', () => {
    it('affiche des libellés lisibles pour équipes et slots', () => {
        expect(bracketTeamLabel({ type: 'team', countryCode: 'fr', countryName: 'France' })).to.equal('France')
        expect(bracketTeamLabel({ type: 'slot', label: '2e du Groupe A' })).to.equal('2e G.A')
        expect(bracketTeamLabel({ type: 'slot', label: 'Vainqueur du Match 89' })).to.equal('Vainq. M89')
        expect(bracketTeamLabel({ type: 'slot', label: 'Perdant du Match 101' })).to.equal('Perd. M101')
    })
})

describe('enrichBracketFromTree', () => {
    it('propage le vainqueur d\'un match joué vers les slots suivants', () => {
        const games = wc2026KnockoutGames()
        const match74 = games.find((game) => game.gameName === 'Match 74')
        match74.countryCodeTeamA = 'ma'
        match74.countryNameTeamA = 'Maroc'
        match74.goalsTeamA = 2
        match74.goalsTeamB = 1

        const data = buildKnockoutBracketData(games, null)
        const roundOf16 = data.leftRounds[0].matches.find((match) => match.matchNumber === 74)
        const roundOf32 = data.leftRounds[1].matches.find((match) => match.matchNumber === 89)

        expect(roundOf16.live.teamA.type).to.equal('team')
        expect(roundOf16.live.teamA.countryName).to.equal('Maroc')
        expect(roundOf32.live.teamA.type).to.equal('team')
        expect(roundOf32.live.teamA.countryName).to.equal('Maroc')
    })

    it('propage le vainqueur prédit vers les slots suivants', () => {
        const games = wc2026KnockoutGames()
        const match89 = games.find((game) => game.gameName === 'Match 89')
        match89.predictionScoreTeamA = 2
        match89.predictionScoreTeamB = 1
        match89.countryCodeTeamA = 'de'
        match89.countryNameTeamA = 'Allemagne'
        match89.countryCodeTeamB = 'fr'
        match89.countryNameTeamB = 'France'

        const match90 = games.find((game) => game.gameName === 'Match 90')
        match90.predictionScoreTeamA = 2
        match90.predictionScoreTeamB = 1
        match90.countryCodeTeamA = 'ca'
        match90.countryNameTeamA = 'Canada'
        match90.countryCodeTeamB = 'nl'
        match90.countryNameTeamB = 'Pays-Bas'

        const data = buildKnockoutBracketData(games, null)
        const quarterFinal = data.leftRounds[2].matches.find((match) => match.matchNumber === 97)

        expect(quarterFinal.predictive.teamA.type).to.equal('team')
        expect(quarterFinal.predictive.teamA.countryName).to.equal('Allemagne')
        expect(bracketTeamLabel(quarterFinal.predictive.teamA)).to.equal('Allemagne')
        expect(quarterFinal.predictive.teamB.countryName).to.equal('Canada')
        expect(bracketTeamLabel(quarterFinal.predictive.teamB)).to.equal('Canada')
    })
})

describe('verticalRoundGridStyle', () => {
    it('adapte la grille au nombre de matchs', () => {
        expect(verticalRoundGridStyle(8).gridTemplateColumns).to.equal('repeat(4, minmax(0, 1fr))')
        expect(verticalRoundGridStyle(4).gridTemplateColumns).to.equal('repeat(4, minmax(0, 1fr))')
        expect(verticalRoundGridStyle(2).gridTemplateColumns).to.equal('repeat(2, minmax(0, 1fr))')
        expect(verticalRoundGridStyle(1).gridTemplateColumns).to.equal('repeat(1, minmax(0, 1fr))')
    })
})

describe('verticalBridgeGridStyle', () => {
    it('aligne les barres de liaison sur la grille des matchs', () => {
        expect(verticalBridgeGridStyle(4).gridTemplateColumns).to.equal('repeat(4, minmax(0, 1fr))')
        expect(verticalBridgeGridStyle(4).gridTemplateRows).to.equal('repeat(1, 1fr)')
        expect(verticalBridgeGridStyle(4).height).to.equal('24px')

        expect(verticalBridgeGridStyle(8).gridTemplateColumns).to.equal('repeat(4, minmax(0, 1fr))')
        expect(verticalBridgeGridStyle(8).gridTemplateRows).to.equal('repeat(2, 1fr)')
        expect(verticalBridgeGridStyle(8).height).to.equal('48px')
    })
})

describe('verticalBridgePairStyle', () => {
    it('positionne chaque paire sur la bonne ligne de grille', () => {
        expect(verticalBridgePairStyle(0, 4)).to.deep.equal({
            gridColumn: '1 / span 2',
            gridRow: '1',
        })
        expect(verticalBridgePairStyle(1, 4)).to.deep.equal({
            gridColumn: '3 / span 2',
            gridRow: '1',
        })
        expect(verticalBridgePairStyle(2, 8)).to.deep.equal({
            gridColumn: '1 / span 2',
            gridRow: '2',
        })
        expect(verticalBridgePairStyle(3, 8)).to.deep.equal({
            gridColumn: '3 / span 2',
            gridRow: '2',
        })
    })
})

describe('scoreWinnerSide', () => {
    it('départage aux tirs au but en direct', () => {
        expect(scoreWinnerSide({
            goalsA: 1,
            goalsB: 1,
            penaltiesA: 4,
            penaltiesB: 5,
        }, 'live')).to.equal('B')
    })

    it('ignore les tirs au but en mode prédictif', () => {
        expect(scoreWinnerSide({
            goalsA: 1,
            goalsB: 1,
            penaltiesA: 4,
            penaltiesB: 5,
        }, 'predictive')).to.equal(null)
    })
})

describe('verticalTopStageBridgePairStyle', () => {
    it('place les barres sous les matchs dans la même grille', () => {
        expect(verticalTopStageBridgePairStyle(0, 4)).to.deep.equal({
            gridColumn: '1 / span 2',
            gridRow: '2',
        })
        expect(verticalTopStageBridgePairStyle(1, 4)).to.deep.equal({
            gridColumn: '3 / span 2',
            gridRow: '2',
        })
    })
})

describe('verticalBottomStageBridgePairStyle', () => {
    it('place les barres au-dessus des matchs dans la même grille', () => {
        expect(verticalBottomStageBridgePairStyle(0, 4)).to.deep.equal({
            gridColumn: '1 / span 2',
            gridRow: '1',
        })
        expect(verticalBottomStageSlotStyle(0, 4, true)).to.deep.equal({
            gridColumn: '1',
            gridRow: '2',
        })
    })
})

describe('splitRoundOf16MatchesByBracket', () => {
    it('répartit les 16èmes selon le tableau global', () => {
        const games = wc2026KnockoutGames()
        const data = buildKnockoutBracketData(games, null)
        const phaseMatches = games
            .filter((game) => game.phase === '16èmes de finale')
            .map((game) => ({
                gameId: game.gameId,
                gameName: game.gameName,
            }))

        const sides = splitRoundOf16MatchesByBracket(phaseMatches, data)

        expect(sides.left.map((match) => match.gameName)).to.deep.equal([
            'Match 74', 'Match 77', 'Match 73', 'Match 75',
            'Match 83', 'Match 84', 'Match 81', 'Match 82',
        ])
        expect(sides.right.map((match) => match.gameName)).to.deep.equal([
            'Match 76', 'Match 78', 'Match 79', 'Match 80',
            'Match 86', 'Match 88', 'Match 85', 'Match 87',
        ])
    })
})

describe('formatBracketMatchDate', () => {
    it('formate une date courte avec l\'heure', () => {
        const label = formatBracketMatchDate(Date.UTC(2026, 5, 30, 10, 0, 0))
        expect(label).to.match(/30 juin - 12h/)
    })
})
