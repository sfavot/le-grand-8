import {
    deleteAccount as apiDeleteAccount,
    fetchCurrentUser as apiFetchCurrentUser,
    updateProfile as apiUpdateProfile,
} from '../../WebApi'

export const FETCH_CURRENT_USER = 'FETCH_CURRENT_USER'
function fetchCurrentUserAttempt() {
    return {
        type: FETCH_CURRENT_USER,
    }
}

export const FETCH_CURRENT_USER_SUCCESS = 'FETCH_CURRENT_USER_SUCCESS'
function fetchCurrentUserSuccess(user) {
    return {
        type: FETCH_CURRENT_USER_SUCCESS,
        user,
    }
}

export const NO_CONNECTED_USER = 'NO_CONNECTED_USER'
function noConnectedUser() {
    return {
        type: NO_CONNECTED_USER,
    }
}

export function fetchCurrentUser() {

    return (dispatch) => {

        dispatch(fetchCurrentUserAttempt())

        return apiFetchCurrentUser()
            .then((user) => dispatch(fetchCurrentUserSuccess(user)))
            .catch(() => dispatch(noConnectedUser()))
    }
}

export const UPDATE_PROFILE = 'UPDATE_PROFILE'
function updateProfileAttempt(profile) {
    return {
        type: UPDATE_PROFILE,
        profile,
    }
}

export const UPDATE_PROFILE_SUCCESS = 'UPDATE_PROFILE_SUCCESS'
function updateProfileSuccess(user) {
    return {
        type: UPDATE_PROFILE_SUCCESS,
        user,
    }
}

export const UPDATE_PROFILE_FAILURE = 'UPDATE_PROFILE_FAILURE'
function updateProfileFailure() {
    return {
        type: UPDATE_PROFILE_FAILURE,
    }
}

export function updateProfile(profile) {

    return (dispatch) => {

        dispatch(updateProfileAttempt())

        return apiUpdateProfile(profile)
            .then((updatedProfile) => dispatch(updateProfileSuccess(updatedProfile)))
            .catch(() => dispatch(updateProfileFailure()))
    }
}

export const DELETE_ACCOUNT = 'DELETE_ACCOUNT'
function deleteAccountAttempt() {
    return {
        type: DELETE_ACCOUNT,
    }
}

export const DELETE_ACCOUNT_SUCCESS = 'DELETE_ACCOUNT_SUCCESS'
function deleteAccountSuccess() {
    return {
        type: DELETE_ACCOUNT_SUCCESS,
    }
}

export const DELETE_ACCOUNT_FAILURE = 'DELETE_ACCOUNT_FAILURE'
function deleteAccountFailure() {
    return {
        type: DELETE_ACCOUNT_FAILURE,
    }
}

export function deleteAccount() {

    return (dispatch) => {

        dispatch(deleteAccountAttempt())

        return apiDeleteAccount()
            .then(() => {
                dispatch(deleteAccountSuccess())
                dispatch(noConnectedUser())
                window.location.href = '/auth/logout'
            })
            .catch(() => dispatch(deleteAccountFailure()))
    }
}
