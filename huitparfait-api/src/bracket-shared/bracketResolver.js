import { parseSlotLabel } from './bracketSlotParser.js'
import {
    getQualifyingThirdGroupsKey,
    resolveBestThird,
    resolveGroupRank,
} from './groupStandings.js'
import { getMatchWinner, isKnockoutPhase } from './knockoutWinner.js'

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
    }
}

function applyResolved(slot, resolved, source) {
    if (resolved == null) {
        return slot
    }

    return Object.assign({}, slot, {
        resolved: {
            countryCode: resolved.countryCode,
            countryName: resolved.countryName,
            id: resolved.id,
        },
        source,
    })
}

function isGameStarted(game, now = Date.now()) {
    return game.startsAt <= now
}

function resolveTeamSlot(slot, countryCode, countryName, teamId, context, game) {
    const base = buildTeamSlotState(countryName, countryCode, countryName, teamId)

    if (countryCode) {
        return applyResolved(base, {
            countryCode,
            countryName,
            id: teamId,
        }, 'db')
    }

    const cacheKey = teamId || countryName
    if (context.resolutionCache.has(cacheKey)) {
        const cached = context.resolutionCache.get(cacheKey)
        return applyResolved(base, cached.resolved, cached.source)
    }

    const parsed = parseSlotLabel(countryName)
    if (parsed == null) {
        context.resolutionCache.set(cacheKey, { resolved: null, source: null })
        return base
    }

    let result = null

    if (parsed.type === 'groupRank') {
        result = resolveGroupRank(context.allGames, parsed.rank, parsed.group)
    } else if (parsed.type === 'bestThird') {
        const matchNumber = game != null ? parseMatchNumber(game.gameName) : null
        result = resolveBestThird(
            context.allGames,
            parsed.groups,
            matchNumber,
            context.qualifyingThirdGroupsKey,
        )
    } else if (parsed.type === 'winner') {
        result = resolveWinnerMatch(context, parsed.matchNumber)
    } else if (parsed.type === 'loser') {
        result = resolveLoserMatch(context, parsed.matchNumber)
    }

    if (result == null || result.team == null) {
        context.resolutionCache.set(cacheKey, { resolved: null, source: null })
        return base
    }

    const resolved = {
        countryCode: result.team.countryCode,
        countryName: result.team.countryName,
        id: result.team.id,
    }

    context.resolutionCache.set(cacheKey, { resolved, source: result.source })
    return applyResolved(base, resolved, result.source)
}

function resolveWinnerMatch(context, matchNumber) {
    const feederGame = context.gamesByMatchNumber.get(matchNumber)
    if (feederGame == null) {
        return null
    }

    const bracketState = context.bracketStates.get(feederGame.gameId)
    if (bracketState == null) {
        return null
    }

    const gameWithResolvedTeams = buildGameWithResolvedTeams(feederGame, bracketState)

    const winner = getMatchWinner(gameWithResolvedTeams, isKnockoutPhase(feederGame.phase))
    if (winner == null) {
        return null
    }

    return {
        team: winner.team,
        source: winner.source,
    }
}

function buildGameWithResolvedTeams(feederGame, bracketState) {
    const resolvedA = bracketState.teamA.resolved
    const resolvedB = bracketState.teamB.resolved

    return Object.assign({}, feederGame, {
        countryCodeTeamA: (resolvedA && resolvedA.countryCode) || feederGame.countryCodeTeamA,
        countryNameTeamA: (resolvedA && resolvedA.countryName) || feederGame.countryNameTeamA,
        idTeamA: (resolvedA && resolvedA.id) || feederGame.idTeamA,
        countryCodeTeamB: (resolvedB && resolvedB.countryCode) || feederGame.countryCodeTeamB,
        countryNameTeamB: (resolvedB && resolvedB.countryName) || feederGame.countryNameTeamB,
        idTeamB: (resolvedB && resolvedB.id) || feederGame.idTeamB,
    })
}

function resolveLoserMatch(context, matchNumber) {
    const feederGame = context.gamesByMatchNumber.get(matchNumber)
    if (feederGame == null) {
        return null
    }

    const bracketState = context.bracketStates.get(feederGame.gameId)
    if (bracketState == null) {
        return null
    }

    const gameWithResolvedTeams = buildGameWithResolvedTeams(feederGame, bracketState)

    const winner = getMatchWinner(gameWithResolvedTeams, isKnockoutPhase(feederGame.phase))
    if (winner == null) {
        return null
    }

    const loserSide = winner.side === 'A' ? 'B' : 'A'
    const loserTeam = loserSide === 'A'
        ? {
            countryCode: gameWithResolvedTeams.countryCodeTeamA,
            countryName: gameWithResolvedTeams.countryNameTeamA,
            id: gameWithResolvedTeams.idTeamA,
        }
        : {
            countryCode: gameWithResolvedTeams.countryCodeTeamB,
            countryName: gameWithResolvedTeams.countryNameTeamB,
            id: gameWithResolvedTeams.idTeamB,
        }

    return {
        team: loserTeam,
        source: winner.source,
    }
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
        qualifyingThirdGroupsKey: getQualifyingThirdGroupsKey(sortedGames),
    }

    for (const game of sortedGames) {
        const teamA = resolveTeamSlot(
            null,
            game.countryCodeTeamA,
            game.countryNameTeamA,
            game.idTeamA,
            context,
            game,
        )
        const teamB = resolveTeamSlot(
            null,
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
    context.qualifyingThirdGroupsKey = getQualifyingThirdGroupsKey(sortedGames)

    for (const game of sortedGames) {
        const state = context.bracketStates.get(game.gameId)
        state.teamA = resolveTeamSlot(
            null,
            game.countryCodeTeamA,
            game.countryNameTeamA,
            game.idTeamA,
            context,
            game,
        )
        state.teamB = resolveTeamSlot(
            null,
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
