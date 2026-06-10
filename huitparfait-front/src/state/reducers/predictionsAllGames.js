import {
    FETCH_ALL_PREDICTIONS_SUCCESS,
    FETCH_ALL_PREDICTIONS_FAILURE,
} from '../actions/predictions'

const initialState = null

export default function (state = initialState, action) {

    switch (action.type) {

        case FETCH_ALL_PREDICTIONS_SUCCESS:
            return action.allGames

        case FETCH_ALL_PREDICTIONS_FAILURE:
            return null

        default:
            return state
    }
}
