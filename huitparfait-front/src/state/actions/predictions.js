import {
    fetchPredictions as apiFetchPredictions,
    savePrediction as apiSavePrediction,
} from '../../WebApi'
import { enrichGamesWithBracket, flattenGamesFromApiResponse } from '../../bracketUtils'
import { countUnfilledOpenGames } from '../../predictionUtils'

export const FETCH_PREDICTIONS = 'FETCH_PREDICTIONS'
function fetchPredictionsAttempt(period) {
    return {
        type: FETCH_PREDICTIONS,
        period,
    }
}

export const FETCH_PREDICTIONS_SUCCESS = 'FETCH_PREDICTIONS_SUCCESS'
function fetchPredictionsSuccess(predictions, period, bracketMap = null) {
    const isNextDays = period === 'next-days' || period === 'prochains-matchs'

    return {
        type: FETCH_PREDICTIONS_SUCCESS,
        predictions,
        period,
        unfilledCount: isNextDays ? countUnfilledOpenGames(predictions, bracketMap) : null,
    }
}

export const FETCH_PREDICTIONS_FAILURE = 'FETCH_PREDICTIONS_FAILURE'
function fetchPredictionsFailure(period) {
    return {
        type: FETCH_PREDICTIONS_FAILURE,
        period,
    }
}

export const FETCH_UNFILLED_BADGE_SUCCESS = 'FETCH_UNFILLED_BADGE_SUCCESS'
function fetchUnfilledBadgeSuccess(predictions, bracketMap) {
    return {
        type: FETCH_UNFILLED_BADGE_SUCCESS,
        count: countUnfilledOpenGames(predictions, bracketMap),
    }
}

export const FETCH_ALL_PREDICTIONS_SUCCESS = 'FETCH_ALL_PREDICTIONS_SUCCESS'
function fetchAllPredictionsSuccess(allGames) {
    return {
        type: FETCH_ALL_PREDICTIONS_SUCCESS,
        allGames,
    }
}

export const FETCH_ALL_PREDICTIONS_FAILURE = 'FETCH_ALL_PREDICTIONS_FAILURE'
function fetchAllPredictionsFailure() {
    return {
        type: FETCH_ALL_PREDICTIONS_FAILURE,
    }
}

const pendingFetches = {}
let pendingNextDaysFetch = null
let pendingNextDaysUpdatesPage = false
let pendingAllGamesFetch = null

function fetchAllGamesShared(dispatch) {
    if (pendingAllGamesFetch != null) {
        return pendingAllGamesFetch
    }

    pendingAllGamesFetch = apiFetchPredictions('all')
        .then((predictionsByDay) => {
            const allGames = flattenGamesFromApiResponse(predictionsByDay)
            dispatch(fetchAllPredictionsSuccess(allGames))
            return allGames
        })
        .catch(() => {
            dispatch(fetchAllPredictionsFailure())
            return Promise.reject(new Error('fetch all predictions failed'))
        })
        .finally(() => {
            pendingAllGamesFetch = null
        })

    return pendingAllGamesFetch
}

function fetchNextDaysShared(dispatch, updatePageStore) {
    if (pendingNextDaysFetch != null) {
        pendingNextDaysUpdatesPage = pendingNextDaysUpdatesPage || updatePageStore

        return pendingNextDaysFetch.then((result) => {
            if (updatePageStore) {
                dispatch(fetchPredictionsSuccess(result.predictions, 'next-days', result.bracketMap))
            }
            return result.predictions
        })
    }

    pendingNextDaysUpdatesPage = updatePageStore

    if (updatePageStore) {
        dispatch(fetchPredictionsAttempt('next-days'))
    }

    const allGamesPromise = fetchAllGamesShared(dispatch)

    pendingNextDaysFetch = Promise.all([
        apiFetchPredictions('next-days'),
        allGamesPromise,
    ])
        .then(([predictions, allGames]) => {
            const bracketMap = allGames.length > 0 ? enrichGamesWithBracket(allGames) : null
            const result = { predictions, bracketMap }

            dispatch(fetchUnfilledBadgeSuccess(predictions, bracketMap))

            if (pendingNextDaysUpdatesPage) {
                dispatch(fetchPredictionsSuccess(predictions, 'next-days', bracketMap))
            }

            return result
        })
        .catch(() => {
            if (pendingNextDaysUpdatesPage) {
                dispatch(fetchPredictionsFailure('next-days'))
            }
            return Promise.reject(new Error('fetch next-days failed'))
        })
        .finally(() => {
            pendingNextDaysFetch = null
            pendingNextDaysUpdatesPage = false
        })

    return pendingNextDaysFetch
}

export function fetchUnfilledPredictionsBadge() {
    return (dispatch) => fetchNextDaysShared(dispatch, false)
}

export function fetchAllPredictionsGames() {
    return (dispatch) => fetchAllGamesShared(dispatch)
}

export function fetchPredictions(period) {

    return (dispatch) => {

        if (period === 'next-days' || period === 'prochains-matchs') {
            return fetchNextDaysShared(dispatch, true)
        }

        if (pendingFetches[period] != null) {
            return pendingFetches[period]
        }

        dispatch(fetchPredictionsAttempt(period))

        const promise = apiFetchPredictions(period)
            .then((predictions) => dispatch(fetchPredictionsSuccess(predictions, period)))
            .catch(() => dispatch(fetchPredictionsFailure(period)))
            .finally(() => {
                delete pendingFetches[period]
            })

        pendingFetches[period] = promise

        return promise
    }
}

export const SAVE_PREDICTION = 'SAVE_PREDICTION'
function savePredictionAttempt(prediction) {
    return {
        type: SAVE_PREDICTION,
        prediction,
    }
}

export const SAVE_PREDICTION_SUCCESS = 'SAVE_PREDICTION_SUCCESS'
function savePredictionSuccess() {
    return {
        type: SAVE_PREDICTION_SUCCESS,
    }
}

export const PREDICTION_SAVED = 'PREDICTION_SAVED'
function predictionSaved() {
    return {
        type: PREDICTION_SAVED,
    }
}

export const SAVE_PREDICTION_FAILURE = 'SAVE_PREDICTION_FAILURE'
function savePredictionFailure() {
    return {
        type: SAVE_PREDICTION_FAILURE,
    }
}

export function savePrediction(game) {

    return (dispatch, getState) => {

        dispatch(savePredictionAttempt(game))

        const prediction = {
            gameId: game.gameId,
            predictionScoreTeamA: game.predictionScoreTeamA,
            predictionScoreTeamB: game.predictionScoreTeamB,
            predictionRiskAnswer: game.predictionRiskAnswer,
            predictionRiskAmount: game.predictionRiskAnswer != null ? game.predictionRiskAmount : 0,
        }

        return apiSavePrediction(prediction)
            .then(() => {
                dispatch(savePredictionSuccess())
                dispatch(predictionSaved())
                return fetchAllGamesShared(dispatch)
                    .then((allGames) => {
                        const bracketMap = allGames.length > 0
                            ? enrichGamesWithBracket(allGames)
                            : null
                        const nextPredictions = getState().predictions
                        if (nextPredictions != null) {
                            dispatch(fetchUnfilledBadgeSuccess(nextPredictions, bracketMap))
                        }
                        return allGames
                    })
            })
            // fix this with redux
            .catch((err) => {
                dispatch(savePredictionFailure())
                return Promise.reject(err)
            })
    }
}
