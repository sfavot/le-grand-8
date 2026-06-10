import { combineReducers } from 'redux'
import loaders from './loaders'
import user from './user'
import group from './group'
import groups from './groups'
import leftGroups from './leftGroups'
import groupUsers from './groupUsers'
import groupRanking from './groupRanking'
import groupsRanking from './groupsRanking'
import predictions from './predictions'
import predictionsAllGames from './predictionsAllGames'
import predictionsBadge from './predictionsBadge'
import predictionsPeriod from './predictionsPeriod'
import ranking from './ranking'
import submenu from './submenu'

export default combineReducers({
    loaders,
    user,
    group,
    groups,
    leftGroups,
    groupUsers,
    groupRanking,
    groupsRanking,
    predictions,
    predictionsAllGames,
    predictionsBadge,
    predictionsPeriod,
    ranking,
    submenu,
})
