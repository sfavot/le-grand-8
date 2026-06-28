import { parseSlotLabel } from './bracket-shared/bracketSlotParser'
import { getPhaseDisplayLabel } from './bracket-shared/bracketResolver'
import { isKnockoutPhase } from './bracket-shared/knockoutWinner'
import { applyBracketStateToGame } from './bracketUtils'

export function isPhaseResultsComplete(playedCount, totalCount) {
    return totalCount > 0 && playedCount === totalCount
}

export const KNOCKOUT_PHASE_ORDER = [
    '16èmes de finale',
    '8èmes de finale',
    'Quart de finale',
    'Demi-finale',
    'Petite finale',
    'Finale',
]

function teamFromGame(game, side) {
    if (side === 'A') {
        return {
            countryCode: game.countryCodeTeamA,
            countryName: game.countryNameTeamA,
        }
    }

    return {
        countryCode: game.countryCodeTeamB,
        countryName: game.countryNameTeamB,
    }
}

function resolvedTeamFromGame(game, side) {
    if (side === 'A') {
        return game.bracketResolvedTeamA
    }

    return game.bracketResolvedTeamB
}

function resolvedSourceFromGame(game, side) {
    if (side === 'A') {
        return game.bracketResolvedSourceA
    }

    return game.bracketResolvedSourceB
}

function teamDisplayFromResolved(resolved) {
    return {
        type: 'team',
        countryCode: resolved.countryCode,
        countryName: resolved.countryName,
    }
}

function teamFromCandidates(candidates, sources) {
    if (candidates == null || candidates.length === 0) {
        return null
    }

    for (const source of sources) {
        const candidate = candidates.find((entry) => entry.source === source)
        if (candidate != null
                && candidate.team != null
                && (candidate.team.countryCode || candidate.team.countryName)) {
            return candidate.team
        }
    }

    return null
}

function candidatesFromGame(game, side) {
    if (side === 'A') {
        return game.bracketCandidatesTeamA
    }

    return game.bracketCandidatesTeamB
}

export function buildTeamDisplay(game, side, mode) {
    const team = teamFromGame(game, side)
    const slotLabel = team.countryName != null && parseSlotLabel(team.countryName) != null

    if (team.countryCode && !slotLabel) {
        return {
            type: 'team',
            countryCode: team.countryCode,
            countryName: team.countryName,
        }
    }

    const resolved = resolvedTeamFromGame(game, side)
    const resolvedSource = resolvedSourceFromGame(game, side)
    const candidates = candidatesFromGame(game, side)

    if (mode === 'predictive') {
        const predictionTeam = teamFromCandidates(candidates, ['prediction'])
        if (predictionTeam != null) {
            return teamDisplayFromResolved(predictionTeam)
        }

        const knownTeam = teamFromCandidates(candidates, ['result', 'partialResult', 'db'])
        if (knownTeam != null) {
            return teamDisplayFromResolved(knownTeam)
        }

        if (resolved != null && (resolved.countryCode || resolved.countryName)) {
            return teamDisplayFromResolved(resolved)
        }
    } else {
        const liveTeam = teamFromCandidates(candidates, ['db', 'result', 'partialResult'])
        if (liveTeam != null) {
            return teamDisplayFromResolved(liveTeam)
        }

        if (resolvedSource !== 'prediction'
                && resolved != null
                && (resolved.countryCode || resolved.countryName)) {
            return teamDisplayFromResolved(resolved)
        }
    }

    if (team.countryName) {
        return {
            type: 'slot',
            label: team.countryName,
        }
    }

    return {
        type: 'unknown',
        label: 'À déterminer',
    }
}

export function buildScoreDisplay(game, mode) {
    if (mode === 'predictive'
            && game.predictionScoreTeamA != null
            && game.predictionScoreTeamB != null) {
        return {
            goalsA: game.predictionScoreTeamA,
            goalsB: game.predictionScoreTeamB,
            penaltiesA: null,
            penaltiesB: null,
            isPrediction: true,
        }
    }

    if (game.goalsTeamA != null && game.goalsTeamB != null) {
        return {
            goalsA: game.goalsTeamA,
            goalsB: game.goalsTeamB,
            penaltiesA: game.penaltiesTeamA,
            penaltiesB: game.penaltiesTeamB,
        }
    }

    return null
}

export function buildMatchEntry(game) {
    return {
        gameId: game.gameId,
        gameName: game.gameName,
        startsAt: game.startsAt,
        live: {
            teamA: buildTeamDisplay(game, 'A', 'live'),
            teamB: buildTeamDisplay(game, 'B', 'live'),
            score: buildScoreDisplay(game, 'live'),
        },
        predictive: {
            teamA: buildTeamDisplay(game, 'A', 'predictive'),
            teamB: buildTeamDisplay(game, 'B', 'predictive'),
            score: buildScoreDisplay(game, 'predictive'),
        },
    }
}

export function buildKnockoutPhaseEntries(allGames, bracketMap) {
    if (allGames == null || allGames.length === 0) {
        return []
    }

    const enrichedGames = allGames.map((game) => applyBracketStateToGame(game, bracketMap))
    const knockoutGames = enrichedGames
        .filter((game) => isKnockoutPhase(game.phase))
        .sort((a, b) => a.startsAt - b.startsAt)

    return KNOCKOUT_PHASE_ORDER
        .map((phase) => {
            const matches = knockoutGames
                .filter((game) => game.phase === phase)
                .map(buildMatchEntry)

            if (matches.length === 0) {
                return null
            }

            return {
                phase,
                phaseLabel: getPhaseDisplayLabel(phase),
                matches,
                playedMatches: matches.filter((match) => match.live.score != null).length,
                predictedMatches: matches.filter((match) => match.predictive.score != null).length,
                totalMatches: matches.length,
            }
        })
        .filter((entry) => entry != null)
}
