import _ from 'lodash'
import moment from 'moment'
import {
    areProtagonistsConfirmed,
    getBracketStateForGame,
    isGamePredictable,
} from './bracketUtils'

export { areProtagonistsConfirmed }

function isKnockoutPhase(phase) {
    return phase != null && phase !== 'Groupes'
}

export function isSubmissionClosed(game) {
    return moment(game.startsAt).isBefore(Date.now())
}

export function predictionIsFilled(game) {
    return game.predictionScoreTeamA != null && game.predictionScoreTeamB != null
}

/** Aucune équipe déduite (slots vides). */
export function hasUnknownProtagonists(game, bracketMap) {
    if (game.countryCodeTeamA && game.countryCodeTeamB) {
        return false
    }

    if (!isKnockoutPhase(game.phase)) {
        return false
    }

    const state = getBracketStateForGame(bracketMap, game.gameId)
    if (state == null) {
        return true
    }

    return state.teamA.resolved == null || state.teamB.resolved == null
}

export function isOpenForPrediction(game, bracketMap) {
    return !isSubmissionClosed(game) &&
        areProtagonistsConfirmed(bracketMap, game) &&
        isGamePredictable(bracketMap, game)
}

export function isPredictionInputsDisabled(game, bracketMap) {
    if (isSubmissionClosed(game)) {
        return true
    }

    if (!areProtagonistsConfirmed(bracketMap, game)) {
        return true
    }

    return !isGamePredictable(bracketMap, game)
}

/**
 * Matchs à inclure dans le badge / filtre « non pronostiqués ».
 * Les phases finales à slots ne sont pas comptées tant que les équipes ne sont pas confirmées.
 */
export function isCountableForBadge(game, bracketMap) {
    if (predictionIsFilled(game)) {
        return false
    }

    return isOpenForPrediction(game, bracketMap)
}

export function countUnfilledOpenGames(gamesByDay, bracketMap) {
    if (gamesByDay == null) {
        return 0
    }

    return _(gamesByDay)
        .values()
        .flatten()
        .filter((game) => isCountableForBadge(game, bracketMap))
        .size()
}
