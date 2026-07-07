import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseSlotLabel } from '../src/bracketSlotParser.js'
import { getMatchWinner } from '../src/knockoutWinner.js'
import {
    computeGroupStandings,
    computeLiveGroupStandings,
    computePredictiveGroupStandings,
    rankLiveThirdPlacedTeams,
    resolveGroupRank,
    resolveGroupRankCandidates,
    areAllGroupStagesOfficiallyComplete,
} from '../src/groupStandings.js'
import {
    enrichGamesWithBracket,
    isGamePredictable,
    areProtagonistsConfirmed,
} from '../src/bracketResolver.js'
import {
    getAssignedThirdGroupForMatch,
    getThirdPlaceScenarioNumber,
    lookupThirdPlaceScenario,
} from '../src/thirdPlaceScenarios.js'

function makeGroupGame({
    gameId,
    gameName,
    group,
    teamA,
    teamB,
    predictionA,
    predictionB,
    goalsA = null,
    goalsB = null,
}) {
    return {
        gameId,
        gameName,
        phase: 'Groupes',
        group,
        startsAt: 1000,
        countryCodeTeamA: teamA.code,
        countryNameTeamA: teamA.name,
        idTeamA: teamA.id,
        countryCodeTeamB: teamB.code,
        countryNameTeamB: teamB.name,
        idTeamB: teamB.id,
        predictionScoreTeamA: predictionA,
        predictionScoreTeamB: predictionB,
        goalsTeamA: goalsA,
        goalsTeamB: goalsB,
    }
}

function makeTwelveGroupGames() {
    const teamsByGroup = {
        A: ['fr', 'ch', 'ro', 'pl'],
        B: ['de', 'es', 'it', 'pt'],
        C: ['br', 'ar', 'uy', 'co'],
        D: ['us', 'mx', 'ca', 'jm'],
        E: ['jp', 'kr', 'au', 'nz'],
        F: ['ng', 'sn', 'gh', 'cm'],
        G: ['ma', 'dz', 'tn', 'eg'],
        H: ['gb', 'nl', 'be', 'hr'],
        I: ['se', 'no', 'dk', 'fi'],
        J: ['at', 'cz', 'sk', 'hu'],
        K: ['tr', 'gr', 'rs', 'ua'],
        L: ['ie', 'sc', 'wa', 'ni'],
    }

    const games = []
    let gameIndex = 0

    for (const [group, teamIds] of Object.entries(teamsByGroup)) {
        const team = (id, name) => ({ id, code: id, name })
        const t = teamIds.map((id) => team(id, id.toUpperCase()))

        games.push(
            makeGroupGame({ gameId: `g${gameIndex++}`, gameName: 'M1', group, teamA: t[0], teamB: t[1], goalsA: 3, goalsB: 0 }),
            makeGroupGame({ gameId: `g${gameIndex++}`, gameName: 'M2', group, teamA: t[2], teamB: t[3], goalsA: 1, goalsB: 0 }),
            makeGroupGame({ gameId: `g${gameIndex++}`, gameName: 'M3', group, teamA: t[0], teamB: t[2], goalsA: 2, goalsB: 1 }),
            makeGroupGame({ gameId: `g${gameIndex++}`, gameName: 'M4', group, teamA: t[1], teamB: t[3], goalsA: 2, goalsB: 0 }),
            makeGroupGame({ gameId: `g${gameIndex++}`, gameName: 'M5', group, teamA: t[0], teamB: t[3], goalsA: 3, goalsB: 0 }),
            makeGroupGame({ gameId: `g${gameIndex++}`, gameName: 'M6', group, teamA: t[1], teamB: t[2], goalsA: 1, goalsB: 1 }),
        )
    }

    return games
}

function makeKnockoutGame({
    gameId,
    gameName,
    phase = '8ème de finale',
    teamA,
    teamB,
    startsAt = 2000,
    predictionA = null,
    predictionB = null,
    goalsA = null,
    goalsB = null,
    penaltiesA = null,
    penaltiesB = null,
}) {
    return {
        gameId,
        gameName,
        phase,
        startsAt,
        countryCodeTeamA: teamA.code || null,
        countryNameTeamA: teamA.name,
        idTeamA: teamA.id,
        countryCodeTeamB: teamB.code || null,
        countryNameTeamB: teamB.name,
        idTeamB: teamB.id,
        predictionScoreTeamA: predictionA,
        predictionScoreTeamB: predictionB,
        goalsTeamA: goalsA,
        goalsTeamB: goalsB,
        penaltiesTeamA: penaltiesA,
        penaltiesTeamB: penaltiesB,
    }
}

describe('parseSlotLabel', () => {
    it('parse group rank', () => {
        assert.deepEqual(parseSlotLabel('1er du Groupe A'), {
            type: 'groupRank',
            rank: 1,
            group: 'A',
        })
        assert.deepEqual(parseSlotLabel('2e du Groupe C'), {
            type: 'groupRank',
            rank: 2,
            group: 'C',
        })
    })

    it('parse best third', () => {
        assert.deepEqual(parseSlotLabel('3e du Groupe A, C ou D'), {
            type: 'bestThird',
            groups: ['A', 'C', 'D'],
        })
    })

    it('parse winner', () => {
        assert.deepEqual(parseSlotLabel('Vainqueur du Match 37'), {
            type: 'winner',
            matchNumber: 37,
        })
    })
})

describe('getMatchWinner', () => {
    it('résultat réel avec tirs au but', () => {
        const game = {
            goalsTeamA: 1,
            goalsTeamB: 1,
            penaltiesTeamA: 4,
            penaltiesTeamB: 5,
            countryCodeTeamA: 'fr',
            countryNameTeamA: 'France',
            idTeamA: 'fr',
            countryCodeTeamB: 'pt',
            countryNameTeamB: 'Portugal',
            idTeamB: 'pt',
        }

        const winner = getMatchWinner(game, true)
        assert.equal(winner.side, 'B')
        assert.equal(winner.source, 'result')
    })

    it('égalité prédite en éliminatoire = non résolu', () => {
        const game = {
            predictionScoreTeamA: 1,
            predictionScoreTeamB: 1,
            countryCodeTeamA: 'fr',
            countryNameTeamA: 'France',
            idTeamA: 'fr',
            countryCodeTeamB: 'de',
            countryNameTeamB: 'Allemagne',
            idTeamB: 'de',
        }

        assert.equal(getMatchWinner(game, true), null)
    })
})

describe('computeLiveGroupStandings', () => {
    it('classe partiellement une poule avec seulement des résultats joués', () => {
        const fr = { id: 'fr', code: 'fr', name: 'France' }
        const ch = { id: 'ch', code: 'ch', name: 'Suisse' }
        const ro = { id: 'ro', code: 'ro', name: 'Roumanie' }

        const games = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: fr, teamB: ro, goalsA: 2, goalsB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: ch, teamB: ro, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g3', gameName: 'Match 3', group: 'A', teamA: ch, teamB: fr, predictionA: 0, predictionB: 0 }),
        ]

        const standings = computeLiveGroupStandings(games)
        assert.equal(standings.length, 3)
        assert.equal(standings[0].team.id, 'fr')
        assert.equal(standings[0].played, 1)
        assert.equal(standings[2].team.id, 'ro')
    })
})

describe('computePredictiveGroupStandings', () => {
    it('utilise les résultats puis les pronos pour compléter la poule', () => {
        const fr = { id: 'fr', code: 'fr', name: 'France' }
        const ch = { id: 'ch', code: 'ch', name: 'Suisse' }
        const ro = { id: 'ro', code: 'ro', name: 'Roumanie' }

        const games = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: fr, teamB: ro, goalsA: 2, goalsB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: ch, teamB: ro, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g3', gameName: 'Match 3', group: 'A', teamA: ch, teamB: fr, predictionA: 0, predictionB: 0 }),
        ]

        const standings = computePredictiveGroupStandings(games)
        assert.equal(standings[0].team.id, 'fr')
        assert.equal(standings[1].team.id, 'ch')
        assert.equal(standings[2].team.id, 'ro')
        assert.equal(standings[0].played, 2)
        assert.equal(standings[1].played, 2)
    })
})

describe('lookupThirdPlaceScenario', () => {
    it('affecte un seul match par 3e repêché (scénario EFGHIJKL)', () => {
        const scenario = lookupThirdPlaceScenario('EFGHIJKL')
        assert.equal(getThirdPlaceScenarioNumber('EFGHIJKL'), 1)
        assert.equal(getThirdPlaceScenarioNumber('ABCDEFGH'), 495)
        assert.equal(scenario.scenarioNumber, 1)
        assert.equal(getAssignedThirdGroupForMatch('EFGHIJKL', 74), 'F')
        assert.equal(getAssignedThirdGroupForMatch('EFGHIJKL', 79), 'E')
        assert.equal(Object.keys(scenario.groupToMatch).length, 8)
        assert.equal(Object.keys(scenario.matchToGroup).length, 8)
    })
})

describe('rankLiveThirdPlacedTeams', () => {
    it('repêche les 8 meilleurs troisièmes sur 12 poules complètes', () => {
        const games = makeTwelveGroupGames()
        const ranked = rankLiveThirdPlacedTeams(games)
        assert.equal(ranked.length, 12)
        assert.equal(ranked.filter((entry) => entry.qualifies).length, 8)
        assert.equal(ranked.filter((entry) => !entry.qualifies).length, 4)
        assert.equal(ranked[0].eligibleMatchNumbers.length, 1)
        assert.ok(ranked[0].scenarioNumber >= 1 && ranked[0].scenarioNumber <= 495)
        assert.equal(ranked[11].qualifies, false)
    })
})

describe('computeGroupStandings', () => {
    it('classe une poule de 3 matchs pronostiqués', () => {
        const fr = { id: 'fr', code: 'fr', name: 'France' }
        const ch = { id: 'ch', code: 'ch', name: 'Suisse' }
        const ro = { id: 'ro', code: 'ro', name: 'Roumanie' }

        const games = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: fr, teamB: ro, predictionA: 2, predictionB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: ch, teamB: ro, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g3', gameName: 'Match 3', group: 'A', teamA: ch, teamB: fr, predictionA: 0, predictionB: 0 }),
        ]

        const standings = computeGroupStandings(games)
        assert.equal(standings[0].team.id, 'fr')
        assert.equal(standings[1].team.id, 'ch')
        assert.equal(standings[2].team.id, 'ro')
    })
})

describe('enrichGamesWithBracket', () => {
    it('résout 1er du Groupe A quand la poule est pronostiquée', () => {
        const fr = { id: 'fr', code: 'fr', name: 'France' }
        const ch = { id: 'ch', code: 'ch', name: 'Suisse' }
        const ro = { id: 'ro', code: 'ro', name: 'Roumanie' }

        const groupGames = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: fr, teamB: ro, predictionA: 2, predictionB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: ch, teamB: ro, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g3', gameName: 'Match 3', group: 'A', teamA: ch, teamB: fr, predictionA: 0, predictionB: 0 }),
        ]

        const knockout = makeKnockoutGame({
            gameId: 'k37',
            gameName: 'Match 37',
            teamA: { id: 'u1', name: '1er du Groupe A' },
            teamB: { id: 'u2', name: '2e du Groupe C' },
            startsAt: Date.now() + 100000,
        })

        const bracket = enrichGamesWithBracket([...groupGames, knockout], Date.now())

        const state = bracket.get('k37')
        assert.equal(state.teamA.resolved.countryCode, 'fr')
        assert.equal(state.teamA.source, 'prediction')
        assert.equal(state.teamB.resolved, null)
        assert.equal(state.isPredictable, false)
    })

    it('résout Vainqueur du Match en chaîne', () => {
        const fr = { id: 'fr', code: 'fr', name: 'France' }
        const de = { id: 'de', code: 'de', name: 'Allemagne' }

        const round16 = makeKnockoutGame({
            gameId: 'k37',
            gameName: 'Match 37',
            teamA: fr,
            teamB: de,
            startsAt: 1000,
            predictionA: 2,
            predictionB: 1,
        })

        const quarter = makeKnockoutGame({
            gameId: 'k45',
            gameName: 'Match 45',
            phase: 'Quart de finale',
            teamA: { id: 'u17', name: 'Vainqueur du Match 37' },
            teamB: { id: 'u18', name: 'Vainqueur du Match 39' },
            startsAt: Date.now() + 100000,
        })

        const bracket = enrichGamesWithBracket([round16, quarter], Date.now())

        const state = bracket.get('k45')
        assert.equal(state.teamA.resolved.countryCode, 'fr')
        assert.equal(state.teamA.source, 'prediction')
        assert.equal(state.isPredictable, false)
    })

    it('privilégie le vainqueur réel sur le prono pour un slot Vainqueur du Match', () => {
        const us = { id: 'us', code: 'us', name: 'États-Unis' }
        const be = { id: 'be', code: 'be', name: 'Belgique' }

        const quarter = makeKnockoutGame({
            gameId: 'k100',
            gameName: 'Match 100',
            phase: 'Quart de finale',
            teamA: us,
            teamB: be,
            startsAt: 1000,
            goalsA: 1,
            goalsB: 4,
            predictionA: 2,
            predictionB: 1,
        })

        const semi = makeKnockoutGame({
            gameId: 'k102',
            gameName: 'Match 102',
            phase: 'Demi-finale',
            teamA: { id: 'u99', name: 'Vainqueur du Match 99' },
            teamB: { id: 'u100', name: 'Vainqueur du Match 100' },
            startsAt: Date.now() + 100000,
        })

        const bracket = enrichGamesWithBracket([quarter, semi], Date.now())
        const state = bracket.get('k102')

        assert.equal(state.teamB.resolved.countryCode, 'be')
        assert.equal(state.teamB.source, 'result')
    })

    it('n\'affecte pas le même 3e repêché à plusieurs créneaux des 16es', () => {
        const groupGames = makeTwelveGroupGames()
        const bestThirdSlots = [
            { gameId: 'k74', gameName: 'Match 74', slotB: '3e du Groupe A, B, C, D, F', startsAt: 3000 },
            { gameId: 'k77', gameName: 'Match 77', slotB: '3e du Groupe C, D, F, G, H', startsAt: 3100 },
            { gameId: 'k79', gameName: 'Match 79', slotB: '3e du Groupe C, E, F, H, I', startsAt: 3200 },
            { gameId: 'k80', gameName: 'Match 80', slotB: '3e du Groupe E, H, I, J, K', startsAt: 3300 },
            { gameId: 'k81', gameName: 'Match 81', slotB: '3e du Groupe B, E, F, I, J', startsAt: 3400 },
            { gameId: 'k82', gameName: 'Match 82', slotB: '3e du Groupe A, E, H, I, J', startsAt: 3500 },
            { gameId: 'k85', gameName: 'Match 85', slotB: '3e du Groupe E, F, G, I, J', startsAt: 3600 },
            { gameId: 'k87', gameName: 'Match 87', slotB: '3e du Groupe D, E, I, J, L', startsAt: 3700 },
        ].map((slot) => makeKnockoutGame({
            gameId: slot.gameId,
            gameName: slot.gameName,
            phase: '16èmes de finale',
            teamA: { id: `${slot.gameId}a`, name: '1er du Groupe X' },
            teamB: { id: `${slot.gameId}b`, name: slot.slotB },
            startsAt: slot.startsAt,
        }))

        const bracket = enrichGamesWithBracket([...groupGames, ...bestThirdSlots], Date.now())
        const assignedThirdIds = []

        for (const slot of bestThirdSlots) {
            const state = bracket.get(slot.gameId)
            assert.ok(state.teamB.resolved, `Match ${slot.gameName} devrait avoir un 3e repêché`)
            assignedThirdIds.push(state.teamB.resolved.id)
        }

        assert.equal(new Set(assignedThirdIds).size, assignedThirdIds.length)
    })

    it('isPredictable true quand les deux protagonistes sont connus', () => {
        const fr = { id: 'fr', code: 'fr', name: 'France' }
        const de = { id: 'de', code: 'de', name: 'Allemagne' }

        const game = makeKnockoutGame({
            gameId: 'k37',
            gameName: 'Match 37',
            teamA: fr,
            teamB: de,
            startsAt: Date.now() + 100000,
        })

        const bracket = enrichGamesWithBracket([game], Date.now())
        assert.equal(bracket.get('k37').isPredictable, true)
        assert.equal(isGamePredictable(bracket, game, Date.now()), true)
    })

    it('isPredictable false si le match a commencé', () => {
        const fr = { id: 'fr', code: 'fr', name: 'France' }
        const de = { id: 'de', code: 'de', name: 'Allemagne' }

        const game = makeKnockoutGame({
            gameId: 'k37',
            gameName: 'Match 37',
            teamA: fr,
            teamB: de,
            startsAt: Date.now() - 1000,
        })

        const bracket = enrichGamesWithBracket([game], Date.now())
        assert.equal(bracket.get('k37').isPredictable, false)
    })
})

describe('resolveGroupRank', () => {
    it('déduit un candidat prono même si la poule est incomplète', () => {
        const fr = { id: 'fr', code: 'fr', name: 'France' }
        const ch = { id: 'ch', code: 'ch', name: 'Suisse' }
        const ro = { id: 'ro', code: 'ro', name: 'Roumanie' }
        const al = { id: 'al', code: 'al', name: 'Albanie' }

        const games = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: fr, teamB: ro, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: ch, teamB: al, predictionA: 1, predictionB: 0 }),
        ]

        assert.equal(resolveGroupRank(games, 1, 'A').source, 'prediction')
    })

    it('retourne partialResult et prediction si la poule a des résultats partiels', () => {
        const mx = { id: 'mx', code: 'mx', name: 'Mexique' }
        const za = { id: 'za', code: 'za', name: 'Afrique du Sud' }
        const kr = { id: 'kr', code: 'kr', name: 'Corée du Sud' }
        const cz = { id: 'cz', code: 'cz', name: 'République tchèque' }

        const games = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: mx, teamB: za, goalsA: 2, goalsB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: kr, teamB: cz, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g3', gameName: 'Match 3', group: 'A', teamA: mx, teamB: kr, predictionA: 1, predictionB: 1 }),
            makeGroupGame({ gameId: 'g4', gameName: 'Match 4', group: 'A', teamA: za, teamB: cz, predictionA: 0, predictionB: 0 }),
            makeGroupGame({ gameId: 'g5', gameName: 'Match 5', group: 'A', teamA: mx, teamB: cz, predictionA: 2, predictionB: 0 }),
            makeGroupGame({ gameId: 'g6', gameName: 'Match 6', group: 'A', teamA: za, teamB: kr, predictionA: 1, predictionB: 0 }),
        ]

        const candidates = resolveGroupRankCandidates(games, 2, 'A')
        assert.equal(candidates.length, 2)
        assert.equal(candidates[0].source, 'partialResult')
        assert.equal(candidates[1].source, 'prediction')
    })

    it('retourne partialResult si la poule a des résultats partiels', () => {
        const mx = { id: 'mx', code: 'mx', name: 'Mexique' }
        const za = { id: 'za', code: 'za', name: 'Afrique du Sud' }
        const kr = { id: 'kr', code: 'kr', name: 'Corée du Sud' }
        const cz = { id: 'cz', code: 'cz', name: 'République tchèque' }

        const games = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: mx, teamB: za, goalsA: 2, goalsB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: kr, teamB: cz, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g3', gameName: 'Match 3', group: 'A', teamA: mx, teamB: kr, predictionA: 1, predictionB: 1 }),
            makeGroupGame({ gameId: 'g4', gameName: 'Match 4', group: 'A', teamA: za, teamB: cz, predictionA: 0, predictionB: 0 }),
            makeGroupGame({ gameId: 'g5', gameName: 'Match 5', group: 'A', teamA: mx, teamB: cz, predictionA: 2, predictionB: 0 }),
            makeGroupGame({ gameId: 'g6', gameName: 'Match 6', group: 'A', teamA: za, teamB: kr, predictionA: 1, predictionB: 0 }),
        ]

        const second = resolveGroupRank(games, 2, 'A')
        assert.equal(second.source, 'partialResult')
        assert.equal(second.team.countryCode, 'kr')
    })

    it('retourne result quand la poule est terminée', () => {
        const mx = { id: 'mx', code: 'mx', name: 'Mexique' }
        const za = { id: 'za', code: 'za', name: 'Afrique du Sud' }
        const kr = { id: 'kr', code: 'kr', name: 'Corée du Sud' }
        const cz = { id: 'cz', code: 'cz', name: 'République tchèque' }

        const games = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: mx, teamB: za, goalsA: 2, goalsB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: kr, teamB: cz, goalsA: 1, goalsB: 0 }),
            makeGroupGame({ gameId: 'g3', gameName: 'Match 3', group: 'A', teamA: mx, teamB: kr, goalsA: 1, goalsB: 1 }),
            makeGroupGame({ gameId: 'g4', gameName: 'Match 4', group: 'A', teamA: za, teamB: cz, goalsA: 0, goalsB: 0 }),
            makeGroupGame({ gameId: 'g5', gameName: 'Match 5', group: 'A', teamA: mx, teamB: cz, goalsA: 2, goalsB: 0 }),
            makeGroupGame({ gameId: 'g6', gameName: 'Match 6', group: 'A', teamA: za, teamB: kr, goalsA: 1, goalsB: 0 }),
        ]

        const second = resolveGroupRank(games, 2, 'A')
        assert.equal(second.source, 'result')
        assert.equal(second.team.countryCode, 'kr')
    })

    it('bloque le prono quand les qualifiés ne sont pas officiels', () => {
        const mx = { id: 'mx', code: 'mx', name: 'Mexique' }
        const za = { id: 'za', code: 'za', name: 'Afrique du Sud' }
        const kr = { id: 'kr', code: 'kr', name: 'Corée du Sud' }
        const cz = { id: 'cz', code: 'cz', name: 'République tchèque' }
        const ca = { id: 'ca', code: 'ca', name: 'Canada' }

        const groupGames = [
            makeGroupGame({ gameId: 'g1', gameName: 'Match 1', group: 'A', teamA: mx, teamB: za, goalsA: 2, goalsB: 0 }),
            makeGroupGame({ gameId: 'g2', gameName: 'Match 2', group: 'A', teamA: kr, teamB: cz, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g3', gameName: 'Match 3', group: 'A', teamA: mx, teamB: kr, predictionA: 1, predictionB: 1 }),
            makeGroupGame({ gameId: 'g4', gameName: 'Match 4', group: 'A', teamA: za, teamB: cz, predictionA: 0, predictionB: 0 }),
            makeGroupGame({ gameId: 'g5', gameName: 'Match 5', group: 'A', teamA: mx, teamB: cz, predictionA: 2, predictionB: 0 }),
            makeGroupGame({ gameId: 'g6', gameName: 'Match 6', group: 'A', teamA: za, teamB: kr, predictionA: 1, predictionB: 0 }),
            makeGroupGame({ gameId: 'g7', gameName: 'Match 7', group: 'B', teamA: ca, teamB: kr, goalsA: 1, goalsB: 0 }),
            makeGroupGame({ gameId: 'g8', gameName: 'Match 8', group: 'B', teamA: ca, teamB: cz, predictionA: 2, predictionB: 0 }),
            makeGroupGame({ gameId: 'g9', gameName: 'Match 9', group: 'B', teamA: kr, teamB: cz, predictionA: 0, predictionB: 0 }),
        ]

        const knockout = makeKnockoutGame({
            gameId: 'k73',
            gameName: 'Match 73',
            teamA: { id: 'slot-a', name: '2e du Groupe A' },
            teamB: { id: 'slot-b', name: '2e du Groupe B' },
            startsAt: Date.now() + 100000,
        })

        const bracket = enrichGamesWithBracket([...groupGames, knockout], Date.now())
        const state = bracket.get('k73')

        assert.equal(state.teamA.source, 'partialResult')
        assert.equal(state.teamB.source, 'partialResult')
        assert.equal(state.teamA.candidates.length, 2)
        assert.equal(state.teamB.candidates.length, 2)
        assert.equal(areProtagonistsConfirmed(bracket, knockout), false)
        assert.equal(isGamePredictable(bracket, knockout, Date.now()), true)
    })

    it('un 3e repêché n\'est confirmé qu\'une fois toutes les poules terminées', () => {
        const games = makeTwelveGroupGames()

        for (const game of games) {
            if (game.group === 'A' && game.gameName !== 'M1') {
                game.goalsTeamA = null
                game.goalsTeamB = null
                game.predictionScoreTeamA = 1
                game.predictionScoreTeamB = 0
            }
        }

        const match79 = makeKnockoutGame({
            gameId: 'k79',
            gameName: 'Match 79',
            phase: '16èmes de finale',
            teamA: { id: 'slot79a', name: '1er du Groupe A' },
            teamB: { id: 'slot79b', name: '3e du Groupe C, E, F, H, I' },
            startsAt: Date.now() + 100000,
        })

        const allGames = [...games, match79]
        assert.equal(areAllGroupStagesOfficiallyComplete(allGames), false)

        const bracket = enrichGamesWithBracket(allGames, Date.now())
        const state = bracket.get('k79')

        assert.ok(state.teamB.resolved, 'un 3e provisoire devrait être affiché')
        assert.equal(state.teamB.source, 'partialResult')
        assert.equal(state.teamB.candidates.length, 2)
        assert.equal(state.teamB.candidates[0].source, 'partialResult')
        assert.equal(state.teamB.candidates[1].source, 'prediction')
        assert.equal(areProtagonistsConfirmed(bracket, match79), false)
    })
})
