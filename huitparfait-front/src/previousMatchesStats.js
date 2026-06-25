import _ from 'lodash'

function isRisquettePlayed(game) {
    return game.predictionRiskAnswer != null
}

function isOutcomeWon(game) {
    return (game.classicPoints || 0) >= 3
}

function successRate(won, total) {
    if (total === 0) {
        return null
    }

    return (won / total) * 100
}

export function computePreviousMatchesStats(scoredGames) {
    const games = scoredGames || []

    const playedRisquetteGames = games.filter(isRisquettePlayed)
    const nbRisquettesPlayed = playedRisquetteGames.length
    const nbRisquettesWon = games.filter((game) => isRisquettePlayed(game) && (game.riskPoints || 0) > 0).length
    const nbRisquettesLost = games.filter((game) => isRisquettePlayed(game) && (game.riskPoints || 0) < 0).length
    const nbPredictions = games.length
    const totalScore = _.sumBy(games, 'points')
    const nbOutcomesWon = games.filter(isOutcomeWon).length
    const avgRiskedPoints = nbRisquettesPlayed === 0
        ? null
        : _.sumBy(playedRisquetteGames, 'predictionRiskAmount') / nbRisquettesPlayed

    return {
        totalScore,
        nbPredictions,
        nbPerfects: games.filter((game) => game.points === 8).length,
        nbRisquettesWon,
        nbRisquettesLost,
        nbRisquettesNotPlayed: games.filter((game) => !isRisquettePlayed(game)).length,
        avgRiskedPoints,
        risquetteSuccessRate: successRate(nbRisquettesWon, nbRisquettesPlayed),
        nbOutcomesWon,
        nbOutcomesLost: games.filter((game) => !isOutcomeWon(game)).length,
        outcomeSuccessRate: successRate(nbOutcomesWon, nbPredictions),
        avgPointsPerMatch: nbPredictions === 0 ? null : totalScore / nbPredictions,
    }
}

export function formatOneDecimal(value) {
    if (value == null) {
        return null
    }

    return value.toFixed(1).replace('.', ',')
}

export function formatAvgRiskedPoints(avgRiskedPoints) {
    return formatOneDecimal(avgRiskedPoints)
}

export function formatSuccessRate(rate) {
    if (rate == null) {
        return null
    }

    return Math.round(rate).toString()
}
