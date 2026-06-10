import { THIRD_PLACE_SCENARIOS } from './thirdPlaceScenariosData.js'

export const THIRD_PLACE_MATCH_NUMBERS = [74, 77, 79, 80, 81, 82, 85, 87]

const SCENARIO_NUMBER_BY_KEY = Object.keys(THIRD_PLACE_SCENARIOS).reduce((index, key, i) => {
    index[key] = i + 1
    return index
}, {})

export function buildQualifyingThirdGroupsKey(qualifyingGroups) {
    if (qualifyingGroups == null || qualifyingGroups.length !== 8) {
        return null
    }

    return qualifyingGroups.slice().sort().join('')
}

export function getThirdPlaceScenarioNumber(qualifyingGroupsKey) {
    if (qualifyingGroupsKey == null) {
        return null
    }

    return SCENARIO_NUMBER_BY_KEY[qualifyingGroupsKey] || null
}

export function lookupThirdPlaceScenario(qualifyingGroupsKey) {
    if (qualifyingGroupsKey == null) {
        return null
    }

    const entry = THIRD_PLACE_SCENARIOS[qualifyingGroupsKey]
    if (entry == null) {
        return null
    }

    return {
        matchToGroup: entry.m,
        groupToMatch: entry.g,
        scenarioNumber: SCENARIO_NUMBER_BY_KEY[qualifyingGroupsKey] || null,
    }
}

export function getAssignedThirdGroupForMatch(qualifyingGroupsKey, matchNumber) {
    const scenario = lookupThirdPlaceScenario(qualifyingGroupsKey)
    if (scenario == null) {
        return null
    }

    return scenario.matchToGroup[String(matchNumber)] || null
}

export function getAssignedMatchForThirdGroup(qualifyingGroupsKey, group) {
    const scenario = lookupThirdPlaceScenario(qualifyingGroupsKey)
    if (scenario == null) {
        return null
    }

    return scenario.groupToMatch[group] || null
}
