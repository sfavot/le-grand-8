import { getPhaseDisplayLabel } from './bracket-shared/bracketResolver'
import { isKnockoutPhase } from './bracket-shared/knockoutWinner'
import { applyBracketStateToGame } from './bracketUtils'

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

export function buildTeamDisplay(game, side, mode) {
    if (mode === 'predictive') {
        const resolved = resolvedTeamFromGame(game, side)
        if (resolved != null && (resolved.countryCode || resolved.countryName)) {
            return {
                type: 'team',
                countryCode: resolved.countryCode,
                countryName: resolved.countryName,
            }
        }
    }

    const team = teamFromGame(game, side)
    if (team.countryCode) {
        return {
            type: 'team',
            countryCode: team.countryCode,
            countryName: team.countryName,
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
    if (game.goalsTeamA != null && game.goalsTeamB != null) {
        return {
            goalsA: game.goalsTeamA,
            goalsB: game.goalsTeamB,
            penaltiesA: game.penaltiesTeamA,
            penaltiesB: game.penaltiesTeamB,
        }
    }

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

    return null
}

function buildMatchEntry(game) {
    return {
        gameId: game.gameId,
        gameName: game.gameName,
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
