import {
    FETCH_PREDICTIONS_SUCCESS,
    FETCH_UNFILLED_BADGE_SUCCESS,
} from '../actions/predictions'

const initialState = 0

const NEXT_DAYS_PERIODS = ['next-days', 'prochains-matchs']

export default function (state = initialState, action) {

    switch (action.type) {

        case FETCH_UNFILLED_BADGE_SUCCESS:
            return action.count

        case FETCH_PREDICTIONS_SUCCESS:
            if (NEXT_DAYS_PERIODS.includes(action.period) && action.unfilledCount != null) {
                return action.unfilledCount
            }
            return state

        default:
            return state
    }
}
