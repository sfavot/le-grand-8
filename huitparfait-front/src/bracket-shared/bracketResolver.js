import { parseSlotLabel } from './bracketSlotParser.js'
import {
    pickPrimaryCandidate,
    resolveBestThirdCandidates,
    resolveGroupRankCandidates,
} from './groupStandings.js'
import { getMatchWinner, getMatchWinnerCandidates, getMatchWinnerFromPrediction, getMatchWinnerFromResult, isKnockoutPhase } from './knockoutWinner.js'

/**
 * Flatten API response grouped by day into a single array of games.
 */
export function flattenGamesFromApiResponse(gamesByDay) {
    if (gamesByDay == null) {
        return []
    }

    if (Array.isArray(gamesByDay)) {
        return gamesByDay
    }

    return Object.keys(gamesByDay).reduce((games, dayKey) => (
        games.concat(gamesByDay[dayKey])
    ), [])
}

function buildTeamSlotState(label, countryCode, countryName, teamId) {
    return {
        label: countryCode ? countryName : label,
        teamId,
        countryCode: countryCode || null,
        countryName: countryName || null,
        resolved: null,
        source: null,
        candidates: [],
    }
}

function applyCandidates(slot, candidates) {
    const primary = pickPrimaryCandidate(candidates)

    return Object.assign({}, slot, {
        candidates,
        resolved: primary != null
            ? {
                countryCode: primary.team.countryCode,
                countryName: primary.team.countryName,
                id: primary.team.id,
            }
            : null,
        source: primary != null ? primary.source : null,
    })
}

function isGameStarted(game, now = Date.now()) {
    return game.startsAt <= now
}

function teamFromCandidate(slot, source) {
    if (slot.candidates == null || slot.candidates.length === 0) {
        return slot.resolved
    }

    const direct = slot.candidates.find((candidate) => candidate.source === source)
    if (direct != null) {
        return direct.team
    }

    if (source === 'partialResult') {
        const fallback = slot.candidates.find((candidate) => (
            candidate.source === 'partialResult'
            || candidate.source === 'result'
            || candidate.source === 'db'
        ))
        return fallback != null ? fallback.team : slot.resolved
    }

    if (source === 'prediction') {
        const fallback = slot.candidates.find((candidate) => candidate.source === 'prediction')
        if (fallback != null) {
            return fallback.team
        }

        return slot.resolved
    }

    return slot.resolved
}

function buildGameWithResolvedTeams(feederGame, bracketState, source = null) {
    const resolvedA = source != null
        ? teamFromCandidate(bracketState.teamA, source)
        : bracketState.teamA.resolved
    const resolvedB = source != null
        ? teamFromCandidate(bracketState.teamB, source)
        : bracketState.teamB.resolved

    return Object.assign({}, feederGame, {
        countryCodeTeamA: (resolvedA && resolvedA.countryCode) || feederGame.countryCodeTeamA,
        countryNameTeamA: (resolvedA && resolvedA.countryName) || feederGame.countryNameTeamA,
        idTeamA: (resolvedA && resolvedA.id) || feederGame.idTeamA,
        countryCodeTeamB: (resolvedB && resolvedB.countryCode) || feederGame.countryCodeTeamB,
        countryNameTeamB: (resolvedB && resolvedB.countryName) || feederGame.countryNameTeamB,
        idTeamB: (resolvedB && resolvedB.id) || feederGame.idTeamB,
    })
}

function resolveWinnerMatchCandidates(context, matchNumber) {
    const feederGame = context.gamesByMatchNumber.get(matchNumber)
    if (feederGame == null) {
        return []
    }

    const bracketState = context.bracketStates.get(feederGame.gameId)
    if (bracketState == null) {
        return []
    }

    const isKO = isKnockoutPhase(feederGame.phase)
    const resultGame = buildGameWithResolvedTeams(feederGame, bracketState, 'partialResult')
    const resultWinner = getMatchWinnerFromResult(resultGame, isKO)
    if (resultWinner != null) {
        return [{
            team: resultWinner.team,
            source: 'result',
        }]
    }

    const candidates = []
    const predictionGame = buildGameWithResolvedTeams(feederGame, bracketState, 'prediction')
    for (const candidate of getMatchWinnerCandidates(predictionGame, isKO)) {
        if (candidate.source === 'prediction') {
            candidates.push(candidate)
        }
    }

    return candidates
}

function resolveLoserMatchCandidates(context, matchNumber) {
    const feederGame = context.gamesByMatchNumber.get(matchNumber)
    if (feederGame == null) {
        return []
    }

    const bracketState = context.bracketStates.get(feederGame.gameId)
    if (bracketState == null) {
        return []
    }

    const isKO = isKnockoutPhase(feederGame.phase)
    const candidates = []

    const resultGame = buildGameWithResolvedTeams(feederGame, bracketState, 'partialResult')
    const resultWinner = getMatchWinnerFromResult(resultGame, isKO)
    if (resultWinner != null) {
        const loserSide = resultWinner.side === 'A' ? 'B' : 'A'
        candidates.push({
            team: teamFromSide(resultGame, loserSide),
            source: 'result',
        })
    }

    const predictionGame = buildGameWithResolvedTeams(feederGame, bracketState, 'prediction')
    const predictionWinner = getMatchWinnerFromPrediction(predictionGame)
    if (predictionWinner != null) {
        const loserSide = predictionWinner.side === 'A' ? 'B' : 'A'
        candidates.push({
            team: teamFromSide(predictionGame, loserSide),
            source: 'prediction',
        })
    }

    return candidates
}

function teamFromSide(game, side) {
    if (side === 'A') {
        return {
            countryCode: game.countryCodeTeamA,
            countryName: game.countryNameTeamA,
            id: game.idTeamA,
        }
    }

    return {
        countryCode: game.countryCodeTeamB,
        countryName: game.countryNameTeamB,
        id: game.idTeamB,
    }
}

function resolveTeamSlot(countryCode, countryName, teamId, context, game) {
    const base = buildTeamSlotState(countryName, countryCode, countryName, teamId)

    if (countryCode) {
        return applyCandidates(base, [{
            team: {
                countryCode,
                countryName,
                id: teamId,
            },
            source: 'db',
        }])
    }

    const parsed = parseSlotLabel(countryName)
    const cacheKey = parsed != null && parsed.type === 'bestThird' && game != null
        ? `${teamId || countryName}#${parseMatchNumber(game.gameName) || game.gameId}`
        : (teamId || countryName)
    if (context.resolutionCache.has(cacheKey)) {
        return applyCandidates(base, context.resolutionCache.get(cacheKey))
    }

    if (parsed == null) {
        context.resolutionCache.set(cacheKey, [])
        return applyCandidates(base, [])
    }

    let candidates = []

    if (parsed.type === 'groupRank') {
        candidates = resolveGroupRankCandidates(context.allGames, parsed.rank, parsed.group)
    } else if (parsed.type === 'bestThird') {
        const matchNumber = game != null ? parseMatchNumber(game.gameName) : null
        candidates = resolveBestThirdCandidates(
            context.allGames,
            parsed.groups,
            matchNumber,
        )
    } else if (parsed.type === 'winner') {
        candidates = resolveWinnerMatchCandidates(context, parsed.matchNumber)
    } else if (parsed.type === 'loser') {
        candidates = resolveLoserMatchCandidates(context, parsed.matchNumber)
    }

    context.resolutionCache.set(cacheKey, candidates)
    return applyCandidates(base, candidates)
}

function parseMatchNumber(gameName) {
    const match = gameName != null ? gameName.match(/^Match (\d+)$/) : null
    return match ? Number(match[1]) : null
}

function indexGames(allGames) {
    const gamesByMatchNumber = new Map()

    for (const game of allGames) {
        const matchNumber = parseMatchNumber(game.gameName)
        if (matchNumber != null) {
            gamesByMatchNumber.set(matchNumber, game)
        }
    }

    return gamesByMatchNumber
}

/**
 * @param {Array} allGames - flat list of all games (API shape)
 * @param {number} [now] - timestamp for predictability check
 * @returns {Map<string, object>} gameId → BracketState
 */
export function enrichGamesWithBracket(allGames, now = Date.now()) {
    const sortedGames = allGames.slice().sort((a, b) => a.startsAt - b.startsAt)
    const gamesByMatchNumber = indexGames(sortedGames)

    const context = {
        allGames: sortedGames,
        gamesByMatchNumber,
        resolutionCache: new Map(),
        bracketStates: new Map(),
    }

    for (const game of sortedGames) {
        const teamA = resolveTeamSlot(
            game.countryCodeTeamA,
            game.countryNameTeamA,
            game.idTeamA,
            context,
            game,
        )
        const teamB = resolveTeamSlot(
            game.countryCodeTeamB,
            game.countryNameTeamB,
            game.idTeamB,
            context,
            game,
        )

        const bothResolved = teamA.resolved != null && teamB.resolved != null
        const isPredictable = bothResolved && !isGameStarted(game, now)

        const state = {
            teamA,
            teamB,
            isPredictable,
        }

        context.bracketStates.set(game.gameId, state)
    }

    context.resolutionCache.clear()

    for (const game of sortedGames) {
        const state = context.bracketStates.get(game.gameId)
        state.teamA = resolveTeamSlot(
            game.countryCodeTeamA,
            game.countryNameTeamA,
            game.idTeamA,
            context,
            game,
        )
        state.teamB = resolveTeamSlot(
            game.countryCodeTeamB,
            game.countryNameTeamB,
            game.idTeamB,
            context,
            game,
        )
        state.isPredictable = state.teamA.resolved != null
            && state.teamB.resolved != null
            && !isGameStarted(game, now)
    }

    return context.bracketStates
}

export function getBracketStateForGame(bracketMap, gameId) {
    if (bracketMap == null) {
        return null
    }

    return bracketMap.get(gameId) || null
}

function isSlotConfirmed(slot) {
    return slot.resolved != null && (slot.source === 'result' || slot.source === 'db')
}

/**
 * Équipes officiellement connues (en base ou qualifiées par des résultats réels).
 * Les déductions depuis les pronos de poule (source: prediction) ne comptent pas.
 */
export function areProtagonistsConfirmed(bracketMap, game) {
    if (game.countryCodeTeamA && game.countryCodeTeamB) {
        return true
    }

    if (!isKnockoutPhase(game.phase)) {
        return true
    }

    const state = getBracketStateForGame(bracketMap, game.gameId)
    if (state == null) {
        return false
    }

    return isSlotConfirmed(state.teamA) && isSlotConfirmed(state.teamB)
}

export function isGamePredictable(bracketMap, game, now = Date.now()) {
    const state = getBracketStateForGame(bracketMap, game.gameId)
    if (state == null) {
        return !isKnockoutPhase(game.phase) || (game.countryCodeTeamA && game.countryCodeTeamB)
    }

    return state.isPredictable && !isGameStarted(game, now)
}

export const PHASE_DISPLAY_LABELS = {
    Groupes: 'Phase de groupes',
    '16èmes de finale': '16èmes de finale',
    '8èmes de finale': 'Huitièmes de finale',
    '8ème de finale': 'Huitièmes de finale',
    'Quart de finale': 'Quarts de finale',
    'Demi-finale': 'Demi-finales',
    'Petite finale': 'Petite finale',
    Finale: 'Finale',
}

export function getPhaseDisplayLabel(phase) {
    return PHASE_DISPLAY_LABELS[phase] || phase
}
