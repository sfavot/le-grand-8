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

export function buildBracketMap(allGamesByDay) {
    const allGames = flattenGamesFromApiResponse(allGamesByDay)
    if (allGames.length === 0) {
        return null
    }

    return enrichGamesWithBracket(allGames)
}

export function bracketResolvedSourceLabel(source) {
    if (source === 'prediction') {
        return 'selon ton prono'
    }

    if (source === 'result') {
        return 'selon les résultats'
    }

    return ''
}

export function applyBracketStateToGame(game, bracketMap) {
    const state = getBracketStateForGame(bracketMap, game.gameId)

    if (state == null) {
        return Object.assign({}, game, {
            bracketResolvedTeamA: null,
            bracketResolvedTeamB: null,
            bracketResolvedSourceA: null,
            bracketResolvedSourceB: null,
            bracketIsPredictable: null,
        })
    }

    return Object.assign({}, game, {
        bracketResolvedTeamA: state.teamA.resolved,
        bracketResolvedTeamB: state.teamB.resolved,
        bracketResolvedSourceA: state.teamA.source,
        bracketResolvedSourceB: state.teamB.source,
        bracketIsPredictable: state.isPredictable,
    })
}

export function buildPhaseSections(games) {
    if (games == null || games.length === 0) {
        return []
    }

    const sections = []
    let currentPhase = null

    for (const game of games) {
        if (game.phase !== currentPhase) {
            currentPhase = game.phase
            sections.push({
                phase: currentPhase,
                phaseLabel: getPhaseDisplayLabel(currentPhase),
                games: [],
            })
        }

        sections[sections.length - 1].games.push(game)
    }

    return sections
}
