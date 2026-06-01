import {
    fetchPredictions as apiFetchPredictions,
    savePrediction as apiSavePrediction,
} from '../../WebApi'

export const FETCH_PREDICTIONS = 'FETCH_PREDICTIONS'
function fetchPredictionsAttempt(period) {
    return {
        type: FETCH_PREDICTIONS,
        period,
    }
}

export const FETCH_PREDICTIONS_SUCCESS = 'FETCH_PREDICTIONS_SUCCESS'
function fetchPredictionsSuccess(predictions, period) {
    return {
        type: FETCH_PREDICTIONS_SUCCESS,
        predictions,
        period,
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
function fetchUnfilledBadgeSuccess(predictions) {
    return {
        type: FETCH_UNFILLED_BADGE_SUCCESS,
        predictions,
    }
}

const pendingFetches = {}
let pendingNextDaysFetch = null
let pendingNextDaysUpdatesPage = false

function fetchNextDaysShared(dispatch, updatePageStore) {
    if (pendingNextDaysFetch != null) {
        pendingNextDaysUpdatesPage = pendingNextDaysUpdatesPage || updatePageStore

        return pendingNextDaysFetch.then((predictions) => {
            if (updatePageStore) {
                dispatch(fetchPredictionsSuccess(predictions, 'next-days'))
            }
            return predictions
        })
    }

    pendingNextDaysUpdatesPage = updatePageStore

    if (updatePageStore) {
        dispatch(fetchPredictionsAttempt('next-days'))
    }

    pendingNextDaysFetch = apiFetchPredictions('next-days')
        .then((predictions) => {
            dispatch(fetchUnfilledBadgeSuccess(predictions))

            if (pendingNextDaysUpdatesPage) {
                dispatch(fetchPredictionsSuccess(predictions, 'next-days'))
            }

            return predictions
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

    return (dispatch) => {

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
            })
            // fix this with redux
            .catch((err) => {
                dispatch(savePredictionFailure())
                return Promise.reject(err)
            })
    }
}
