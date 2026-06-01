import _ from 'lodash'
import {
    FETCH_LEFT_USER_GROUPS_SUCCESS,
    FETCH_LEFT_USER_GROUPS_FAILURE,
    LEAVE_GROUP_SUCCESS,
    JOIN_GROUP,
    JOIN_GROUP_FAILURE,
} from '../actions/groups'

const initialState = []

function sortGroups(groups) {
    return _.sortBy(groups, (group) => group.name.toLowerCase())
}

export default function (state = initialState, action) {

    switch (action.type) {

        case FETCH_LEFT_USER_GROUPS_SUCCESS:
            return sortGroups(action.groups)

        case FETCH_LEFT_USER_GROUPS_FAILURE:
            return []

        case LEAVE_GROUP_SUCCESS:
            return sortGroups([
                ...state.filter((group) => group.id !== action.group.id),
                action.group,
            ])

        case JOIN_GROUP:
            return state.filter((group) => group.id !== action.group.id)

        case JOIN_GROUP_FAILURE:
            return sortGroups([
                ...state.filter((group) => group.id !== action.group.id),
                action.group,
            ])

        default:
            return state
    }
}
