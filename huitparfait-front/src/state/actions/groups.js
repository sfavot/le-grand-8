import {
    fetchUserGroups as apiFetchUserGroups,
    fetchLeftUserGroups as apiFetchLeftUserGroups,
    joinGroup as apiJoinGroup,
    fetchGroup as apiFetchGroup,
    fetchGroupUsers as apiFetchGroupUsers,
    upsertGroup as apiUpsertGroup,
    deleteGroup as apiDeleteGroup,
    leaveGroup as apiLeaveGroup,
} from '../../WebApi'

export const FETCH_USER_GROUPS = 'FETCH_USER_GROUPS'
function fetchUserGroupAttempt() {
    return {
        type: FETCH_USER_GROUPS,
    }
}

export const FETCH_USER_GROUPS_SUCCESS = 'FETCH_USER_GROUPS_SUCCESS'
function fetchUserGroupsSuccess(groups) {
    return {
        type: FETCH_USER_GROUPS_SUCCESS,
        groups,
    }
}

export const FETCH_USER_GROUPS_FAILURE = 'FETCH_USER_GROUPS_FAILURE'
function fetchUserGroupsFailure() {
    return {
        type: FETCH_USER_GROUPS_FAILURE,
    }
}

export function fetchUserGroups() {

    return (dispatch) => {

        dispatch(fetchUserGroupAttempt())

        apiFetchUserGroups()
            .then((groups) => dispatch(fetchUserGroupsSuccess(groups)))
            .catch(() => dispatch(fetchUserGroupsFailure()))
    }
}

export const FETCH_LEFT_USER_GROUPS = 'FETCH_LEFT_USER_GROUPS'
function fetchLeftUserGroupsAttempt() {
    return {
        type: FETCH_LEFT_USER_GROUPS,
    }
}

export const FETCH_LEFT_USER_GROUPS_SUCCESS = 'FETCH_LEFT_USER_GROUPS_SUCCESS'
function fetchLeftUserGroupsSuccess(groups) {
    return {
        type: FETCH_LEFT_USER_GROUPS_SUCCESS,
        groups,
    }
}

export const FETCH_LEFT_USER_GROUPS_FAILURE = 'FETCH_LEFT_USER_GROUPS_FAILURE'
function fetchLeftUserGroupsFailure() {
    return {
        type: FETCH_LEFT_USER_GROUPS_FAILURE,
    }
}

export function fetchLeftUserGroups() {

    return (dispatch) => {

        dispatch(fetchLeftUserGroupsAttempt())

        apiFetchLeftUserGroups()
            .then((groups) => dispatch(fetchLeftUserGroupsSuccess(groups)))
            .catch(() => dispatch(fetchLeftUserGroupsFailure()))
    }
}

export const FETCH_GROUP = 'FETCH_GROUP'
function fetchGroupAttempt() {
    return {
        type: FETCH_GROUP,
    }
}

export const FETCH_GROUP_SUCCESS = 'FETCH_GROUP_SUCCESS'
function fetchGroupSuccess(group) {
    return {
        type: FETCH_GROUP_SUCCESS,
        group,
    }
}

export const FETCH_GROUP_FAILURE = 'FETCH_GROUP_FAILURE'
function fetchGroupFailure() {
    return {
        type: FETCH_USER_GROUPS_FAILURE,
    }
}

export function fetchGroup(groupId) {

    return (dispatch) => {

        dispatch(fetchGroupAttempt())

        if (groupId === 'general') {
            return dispatch(fetchGroupSuccess({id: groupId, name: groupId}))
        }

        apiFetchGroup(groupId)
            .then((group) => dispatch(fetchGroupSuccess(group)))
            .catch(() => dispatch(fetchGroupFailure()))
    }
}

export const FETCH_GROUP_USERS = 'FETCH_GROUP_USERS'
function fetchGroupUsersAttempt() {
    return {
        type: FETCH_GROUP_USERS,
    }
}

export const FETCH_GROUP_USERS_SUCCESS = 'FETCH_GROUP_USERS_SUCCESS'
function fetchGroupUsersSuccess(groupUsers) {
    return {
        type: FETCH_GROUP_USERS_SUCCESS,
        groupUsers,
    }
}

export const FETCH_GROUP_USERS_FAILURE = 'FETCH_GROUP_USERS_FAILURE'
function fetchGroupUsersFailure() {
    return {
        type: FETCH_USER_GROUPS_FAILURE,
    }
}

export function fetchGroupUsers(groupId) {

    return (dispatch) => {

        dispatch(fetchGroupUsersAttempt())

        return apiFetchGroupUsers(groupId)
            .then((groupUsers) => dispatch(fetchGroupUsersSuccess(groupUsers)))
            .catch(() => dispatch(fetchGroupUsersFailure()))
    }
}

export const UPSERT_GROUP = 'UPSERT_GROUP'
function upsertGroupAttempt(group) {
    return {
        type: UPSERT_GROUP,
        group,
    }
}

export const UPSERT_GROUP_SUCCESS = 'UPSERT_GROUP_SUCCESS'
function upsertGroupSuccess(group) {
    return {
        type: UPSERT_GROUP_SUCCESS,
        group,
    }
}

export const UPSERT_GROUP_FAILURE = 'UPSERT_GROUP_FAILURE'
function upsertGroupFailure() {
    return {
        type: UPSERT_GROUP_FAILURE,
    }
}

export function upsertGroup(group) {

    return (dispatch) => {

        dispatch(upsertGroupAttempt(group))

        return apiUpsertGroup(group)
            .then((upsertedGroup) => dispatch(upsertGroupSuccess(upsertedGroup)))
            .catch(() => dispatch(upsertGroupFailure()))
    }
}

export const DELETE_GROUP = 'DELETE_GROUP'
function deleteGroupAttempt(group) {
    return {
        type: DELETE_GROUP,
        group,
    }
}

export const DELETE_GROUP_SUCCESS = 'DELETE_GROUP_SUCCESS'
function deleteGroupSuccess() {
    return {
        type: DELETE_GROUP_SUCCESS,
    }
}

export const DELETE_GROUP_FAILURE = 'DELETE_GROUP_FAILURE'
function deleteGroupFailure(group) {
    return {
        type: UPSERT_GROUP_FAILURE,
        group,
    }
}

export function deleteGroup(group) {

    return (dispatch) => {

        dispatch(deleteGroupAttempt(group))

        return apiDeleteGroup(group.id)
            .then(() => dispatch(deleteGroupSuccess()))
            .catch(() => dispatch(deleteGroupFailure(group)))
    }
}

export const LEAVE_GROUP = 'LEAVE_GROUP'
function leaveGroupAttempt(group) {
    return {
        type: LEAVE_GROUP,
        group,
    }
}

export const LEAVE_GROUP_SUCCESS = 'LEAVE_GROUP_SUCCESS'
function leaveGroupSuccess(group) {
    return {
        type: LEAVE_GROUP_SUCCESS,
        group,
    }
}

export const LEAVE_GROUP_FAILURE = 'LEAVE_GROUP_FAILURE'
function leaveGroupFailure(group) {
    return {
        type: LEAVE_GROUP_FAILURE,
        group,
    }
}

export function leaveGroup(group) {

    return (dispatch) => {

        dispatch(leaveGroupAttempt(group))

        return apiLeaveGroup(group.id)
            .then(() => dispatch(leaveGroupSuccess(group)))
            .catch(() => dispatch(leaveGroupFailure(group)))
    }
}

export const JOIN_GROUP = 'JOIN_GROUP'
function joinGroupAttempt(group) {
    return {
        type: JOIN_GROUP,
        group,
    }
}

export const JOIN_GROUP_SUCCESS = 'JOIN_GROUP_SUCCESS'
function joinGroupSuccess(group) {
    return {
        type: JOIN_GROUP_SUCCESS,
        group,
    }
}

export const JOIN_GROUP_FAILURE = 'JOIN_GROUP_FAILURE'
function joinGroupFailure(group) {
    return {
        type: JOIN_GROUP_FAILURE,
        group,
    }
}

export function joinGroup(group) {

    return (dispatch) => {

        dispatch(joinGroupAttempt(group))

        return apiJoinGroup(group.id)
            .then(() => {
                dispatch(joinGroupSuccess(group))
                dispatch(fetchUserGroups())
                dispatch(fetchLeftUserGroups())
            })
            .catch(() => dispatch(joinGroupFailure(group)))
    }
}
