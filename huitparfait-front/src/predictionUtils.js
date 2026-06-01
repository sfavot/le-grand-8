import _ from 'lodash'
import moment from 'moment'

export function isSubmissionClosed(game) {
    return moment(game.startsAt).isBefore(Date.now())
}

export function predictionIsFilled(game) {
    return game.predictionScoreTeamA != null && game.predictionScoreTeamB != null
}

export function countUnfilledOpenGames(gamesByDay) {
    if (gamesByDay == null) {
        return 0
    }

    return _(gamesByDay)
        .values()
        .flatten()
        .reject(isSubmissionClosed)
        .reject(predictionIsFilled)
        .size()
}
