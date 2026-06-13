const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export function hasGameScore(game) {
    return game.goalsTeamA != null && game.goalsTeamB != null
}

/** Match terminé : score saisi et +2 h après le coup d’envoi. */
export function isGameFinishedForPeriod(game, now = Date.now()) {
    if (!hasGameScore(game)) {
        return false
    }

    return game.startsAt + TWO_HOURS_MS < now
}
