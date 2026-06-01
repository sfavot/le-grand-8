import {
    FETCH_PREDICTIONS_SUCCESS,
    FETCH_UNFILLED_BADGE_SUCCESS,
    PREDICTION_SAVED,
} from '../actions/predictions'
import { countUnfilledOpenGames } from '../../predictionUtils'

const initialState = 0

const NEXT_DAYS_PERIODS = ['next-days', 'prochains-matchs']

export default function (state = initialState, action) {

    switch (action.type) {

        case FETCH_UNFILLED_BADGE_SUCCESS:
            return countUnfilledOpenGames(action.predictions)

        case FETCH_PREDICTIONS_SUCCESS:
            if (NEXT_DAYS_PERIODS.includes(action.period)) {
                return countUnfilledOpenGames(action.predictions)
            }
            return state

        case PREDICTION_SAVED:
            return Math.max(0, state - 1)

        default:
            return state
    }
}
