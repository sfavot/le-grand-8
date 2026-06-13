import {
    areProtagonistsConfirmed,
    enrichGamesWithBracket,
    flattenGamesFromApiResponse,
    getBracketStateForGame,
    getPhaseDisplayLabel,
    isGamePredictable,
} from './bracket-shared/bracketResolver'

export {
    areProtagonistsConfirmed,
    enrichGamesWithBracket,
    flattenGamesFromApiResponse,
    getBracketStateForGame,
    getPhaseDisplayLabel,
    isGamePredictable,
}

const BRACKET_SLOT_FIELDS = {
    A: {
        countryCode: 'countryCodeTeamA',
        countryName: 'countryNameTeamA',
        resolvedSource: 'bracketResolvedSourceA',
        resolvedTeam: 'bracketResolvedTeamA',
    },
    B: {
        countryCode: 'countryCodeTeamB',
        countryName: 'countryNameTeamB',
        resolvedSource: 'bracketResolvedSourceB',
        resolvedTeam: 'bracketResolvedTeamB',
    },
}

const CONFIRMED_SOURCES = new Set(['result', 'db'])

function isBracketSlotConfirmed(game, side) {
    const fields = BRACKET_SLOT_FIELDS[side]

    if (game[fields.countryCode]) {
        return true
    }

    return CONFIRMED_SOURCES.has(game[fields.resolvedSource])
}

export function bracketResolvedSourceLabel(source) {
    if (source === 'prediction') {
        return 'selon tes pronos'
    }

    if (source === 'partialResult') {
        return 'selon les résultats temporaires'
    }

    return ''
}

function bracketDisplayTeam(game, side) {
    const fields = BRACKET_SLOT_FIELDS[side]

    if (game[fields.countryCode]) {
        return {
            countryCode: game[fields.countryCode],
            countryName: game[fields.countryName],
        }
    }

    if (isBracketSlotConfirmed(game, side) && game[fields.resolvedTeam] != null) {
        return game[fields.resolvedTeam]
    }

    return null
}

function withBracketDisplayFields(game) {
    return Object.assign({}, game, {
        bracketDisplayTeamA: bracketDisplayTeam(game, 'A'),
        bracketDisplayTeamB: bracketDisplayTeam(game, 'B'),
        bracketSlotUncertainA: !isBracketSlotConfirmed(game, 'A'),
        bracketSlotUncertainB: !isBracketSlotConfirmed(game, 'B'),
    })
}

const EMPTY_BRACKET_FIELDS = {
    bracketResolvedTeamA: null,
    bracketResolvedTeamB: null,
    bracketResolvedSourceA: null,
    bracketResolvedSourceB: null,
    bracketCandidatesTeamA: [],
    bracketCandidatesTeamB: [],
    bracketIsPredictable: null,
    bracketDisplayTeamA: null,
    bracketDisplayTeamB: null,
    bracketSlotUncertainA: false,
    bracketSlotUncertainB: false,
}

export function applyBracketStateToGame(game, bracketMap) {
    const state = getBracketStateForGame(bracketMap, game.gameId)

    if (state == null) {
        return withBracketDisplayFields(Object.assign({}, game, EMPTY_BRACKET_FIELDS))
    }

    return withBracketDisplayFields(Object.assign({}, game, {
        bracketResolvedTeamA: state.teamA.resolved,
        bracketResolvedTeamB: state.teamB.resolved,
        bracketResolvedSourceA: state.teamA.source,
        bracketResolvedSourceB: state.teamB.source,
        bracketCandidatesTeamA: state.teamA.candidates || [],
        bracketCandidatesTeamB: state.teamB.candidates || [],
        bracketIsPredictable: state.isPredictable,
    }))
}

const PHASE_SORT_ORDER = {
    Groupes: 0,
    '16èmes de finale': 10,
    '8èmes de finale': 20,
    '8ème de finale': 20,
    'Quart de finale': 30,
    'Demi-finale': 40,
    'Petite finale': 50,
    Finale: 60,
}

function phaseSortKey(phase) {
    if (phase == null) {
        return 100
    }
    return PHASE_SORT_ORDER[phase] != null ? PHASE_SORT_ORDER[phase] : 90
}

export function buildPhaseSections(games) {
    if (games == null || games.length === 0) {
        return []
    }

    const gamesByPhase = new Map()

    for (const game of games) {
        if (!gamesByPhase.has(game.phase)) {
            gamesByPhase.set(game.phase, [])
        }
        gamesByPhase.get(game.phase).push(game)
    }

    return Array.from(gamesByPhase.keys())
        .sort((phaseA, phaseB) => phaseSortKey(phaseA) - phaseSortKey(phaseB))
        .map((phase) => ({
            phase,
            phaseLabel: getPhaseDisplayLabel(phase),
            games: gamesByPhase.get(phase),
        }))
}
