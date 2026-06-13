/**
 * Determine the winner of a match from actual results or predictions.
 */

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

function hasActualScore(game) {
    return game.goalsTeamA != null && game.goalsTeamB != null
}

function hasPredictionScore(game) {
    return game.predictionScoreTeamA != null && game.predictionScoreTeamB != null
}

function winnerFromPredictionScore(game) {
    const goalsA = game.predictionScoreTeamA
    const goalsB = game.predictionScoreTeamB

    if (goalsA > goalsB) {
        return { side: 'A', team: teamFromSide(game, 'A'), source: 'prediction' }
    }

    if (goalsA < goalsB) {
        return { side: 'B', team: teamFromSide(game, 'B'), source: 'prediction' }
    }

    return null
}

export function getMatchWinnerFromPrediction(game) {
    if (!hasPredictionScore(game)) {
        return null
    }

    return winnerFromPredictionScore(game)
}

export function getMatchWinnerCandidates(game, isKnockout = false) {
    const candidates = []

    if (hasActualScore(game)) {
        const winner = getMatchWinner(game, isKnockout)
        if (winner != null) {
            candidates.push({
                team: winner.team,
                source: 'result',
            })
        }
    }

    if (hasPredictionScore(game)) {
        const winner = winnerFromPredictionScore(game)
        if (winner != null) {
            candidates.push({
                team: winner.team,
                source: 'prediction',
            })
        }
    }

    return candidates
}

export function getMatchWinner(game, isKnockout = false) {
    if (hasActualScore(game)) {
        const goalsA = game.goalsTeamA
        const goalsB = game.goalsTeamB

        if (goalsA > goalsB) {
            return { side: 'A', team: teamFromSide(game, 'A'), source: 'result' }
        }

        if (goalsA < goalsB) {
            return { side: 'B', team: teamFromSide(game, 'B'), source: 'result' }
        }

        if (isKnockout
                && game.penaltiesTeamA != null
                && game.penaltiesTeamB != null) {
            if (game.penaltiesTeamA > game.penaltiesTeamB) {
                return { side: 'A', team: teamFromSide(game, 'A'), source: 'result' }
            }

            if (game.penaltiesTeamA < game.penaltiesTeamB) {
                return { side: 'B', team: teamFromSide(game, 'B'), source: 'result' }
            }
        }

        return null
    }

    if (hasPredictionScore(game)) {
        return winnerFromPredictionScore(game)
    }

    return null
}

export function isKnockoutPhase(phase) {
    return phase != null && phase !== 'Groupes'
}
