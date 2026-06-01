import {
    FETCH_GROUPS_RANKING,
    FETCH_GROUPS_RANKING_SUCCESS,
    FETCH_GROUPS_RANKING_FAILURE,
} from '../actions/ranking'

const initialState = { ranking: [], page: 1 }

export default function (state = initialState, action) {

    switch (action.type) {

        case FETCH_GROUPS_RANKING_SUCCESS:
            return {
                ranking: action.groupsRanking,
                page: action.page,
            }

        case FETCH_GROUPS_RANKING:
        case FETCH_GROUPS_RANKING_FAILURE:
            return { ranking: [], page: 1 }

        default:
            return state
    }
}
