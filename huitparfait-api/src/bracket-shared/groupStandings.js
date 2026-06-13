import {
    buildQualifyingThirdGroupsKey,
    getAssignedMatchForThirdGroup,
    getAssignedThirdGroupForMatch,
    getThirdPlaceScenarioNumber,
} from './thirdPlaceScenarios.js'

function emptyStanding(team) {
    return {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
    }
}

function getResultScore(game) {
    if (game.goalsTeamA != null && game.goalsTeamB != null) {
        return {
            goalsA: game.goalsTeamA,
            goalsB: game.goalsTeamB,
        }
    }

    return null
}

function getPredictionScore(game) {
    if (game.predictionScoreTeamA != null && game.predictionScoreTeamB != null) {
        return {
            goalsA: game.predictionScoreTeamA,
            goalsB: game.predictionScoreTeamB,
        }
    }

    return null
}

function getScoreForStanding(game) {
    const result = getResultScore(game)
    if (result != null) {
        return Object.assign({}, result, { source: 'result' })
    }

    const prediction = getPredictionScore(game)
    if (prediction != null) {
        return Object.assign({}, prediction, { source: 'prediction' })
    }

    return null
}

function getScoreForPredictiveStanding(game) {
    return getResultScore(game) || getPredictionScore(game)
}

function getGroupScheduleInfo(groupGames) {
    const teamIds = new Set()
    for (const game of groupGames) {
        teamIds.add(game.idTeamA)
        teamIds.add(game.idTeamB)
    }

    const teamCount = teamIds.size
    return {
        teamCount,
        expectedGames: (teamCount * (teamCount - 1)) / 2,
    }
}

function isGroupScheduleComplete(groupGames) {
    if (groupGames.length === 0) {
        return false
    }

    const { expectedGames } = getGroupScheduleInfo(groupGames)
    return groupGames.length >= expectedGames
}

function teamFromGame(game, side) {
    if (side === 'A') {
        return {
            id: game.idTeamA,
            countryCode: game.countryCodeTeamA,
            countryName: game.countryNameTeamA,
            group: game.group,
        }
    }

    return {
        id: game.idTeamB,
        countryCode: game.countryCodeTeamB,
        countryName: game.countryNameTeamB,
        group: game.group,
    }
}

function buildStandingsFromGroupGames(groupGames, getScore) {
    if (groupGames.length === 0) {
        return []
    }

    const standingsByTeamId = new Map()

    for (const game of groupGames) {
        const teamA = teamFromGame(game, 'A')
        const teamB = teamFromGame(game, 'B')

        if (!standingsByTeamId.has(teamA.id)) {
            standingsByTeamId.set(teamA.id, emptyStanding(teamA))
        }
        if (!standingsByTeamId.has(teamB.id)) {
            standingsByTeamId.set(teamB.id, emptyStanding(teamB))
        }

        const score = getScore(game)
        if (score == null) {
            continue
        }

        const standingA = standingsByTeamId.get(teamA.id)
        const standingB = standingsByTeamId.get(teamB.id)

        applyResult(standingA, score.goalsA, score.goalsB)
        applyResult(standingB, score.goalsB, score.goalsA)
    }

    return Array.from(standingsByTeamId.values())
        .sort(compareStandings)
        .map((standing, index) => Object.assign({}, standing, {
            rank: index + 1,
            goalDifference: standing.goalsFor - standing.goalsAgainst,
        }))
}

function applyResult(standing, goalsFor, goalsAgainst) {
    standing.played++
    standing.goalsFor += goalsFor
    standing.goalsAgainst += goalsAgainst

    if (goalsFor > goalsAgainst) {
        standing.won++
        standing.points += 3
    } else if (goalsFor === goalsAgainst) {
        standing.drawn++
        standing.points += 1
    } else {
        standing.lost++
    }
}

// FIFA tie-breakers (3e entre poules) : pts, diff., buts, fair-play, classement FIFA.
// Fallback countryName : ordre déterministe côté app, pas un critère officiel.
function standingSortKey(standing) {
    return [
        -standing.points,
        -(standing.goalsFor - standing.goalsAgainst),
        -standing.goalsFor,
        standing.team.countryName,
    ]
}

function compareStandingKeys(a, b) {
    for (let i = 0; i < a.length; i++) {
        if (a[i] < b[i]) {
            return -1
        }
        if (a[i] > b[i]) {
            return 1
        }
    }
    return 0
}

function compareStandings(a, b) {
    return compareStandingKeys(standingSortKey(a), standingSortKey(b))
}

/**
 * Build group standings from group-phase games.
 * Returns null if any group game lacks both result and prediction.
 */
export function computeGroupStandings(groupGames) {
    if (!isGroupScheduleComplete(groupGames)) {
        return null
    }

    for (const game of groupGames) {
        if (getScoreForStanding(game) == null) {
            return null
        }
    }

    return buildStandingsFromGroupGames(groupGames, (game) => {
        const score = getScoreForStanding(game)
        if (score == null) {
            return null
        }

        return {
            goalsA: score.goalsA,
            goalsB: score.goalsB,
        }
    })
}

export function getGroupGames(allGames, group) {
    return allGames.filter((game) => game.phase === 'Groupes' && game.group === group)
}

/**
 * Standings from played matches only (partial standings allowed).
 */
export function computeLiveGroupStandings(groupGames) {
    return buildStandingsFromGroupGames(groupGames, getResultScore)
}

/**
 * Standings from results when available, otherwise user predictions.
 */
export function computePredictiveGroupStandings(groupGames) {
    return buildStandingsFromGroupGames(groupGames, getScoreForPredictiveStanding)
}

export function listGroupPhaseGroups(allGames) {
    return Array.from(new Set(
        allGames
            .filter((game) => game.phase === 'Groupes' && game.group != null)
            .map((game) => game.group),
    )).sort()
}

export function computeAllGroupStandings(allGames) {
    const groups = listGroupPhaseGroups(allGames)
    const standingsByGroup = {}

    for (const group of groups) {
        const groupGames = getGroupGames(allGames, group)

        standingsByGroup[group] = {
            live: computeLiveGroupStandings(groupGames),
            predictive: computePredictiveGroupStandings(groupGames),
            playedGames: groupGames.filter((game) => getResultScore(game) != null).length,
            predictedGames: groupGames.filter((game) => {
                return getResultScore(game) != null || getPredictionScore(game) != null
            }).length,
            totalGames: groupGames.length,
        }
    }

    return standingsByGroup
}

function collectThirdPlacedTeams(allGames, computeStandingsFn) {
    const groups = listGroupPhaseGroups(allGames)
    const thirds = []

    for (const group of groups) {
        const standings = computeStandingsFn(getGroupGames(allGames, group))
        if (standings.length < 3) {
            continue
        }

        thirds.push({
            group,
            standing: standings[2],
        })
    }

    return {
        groups,
        thirds,
    }
}

function finalizeThirdPlaceRanking(thirds, groupCount) {
    if (thirds.length === 0) {
        return []
    }

    const qualifyingCount = groupCount >= 12 ? 8 : Math.min(4, thirds.length)
    const ranked = thirds
        .sort((a, b) => compareStandings(a.standing, b.standing))
        .map((entry, index) => Object.assign({}, entry, {
            rankAmongThirds: index + 1,
            qualifies: index < qualifyingCount,
        }))

    const qualifyingGroupsKey = buildQualifyingThirdGroupsKey(
        ranked.filter((entry) => entry.qualifies).map((entry) => entry.group),
    )
    const scenarioNumber = getThirdPlaceScenarioNumber(qualifyingGroupsKey)

    return ranked.map((entry) => {
        const assignedMatch = entry.qualifies
            ? getAssignedMatchForThirdGroup(qualifyingGroupsKey, entry.group)
            : null

        return {
            group: entry.group,
            standing: entry.standing,
            rankAmongThirds: entry.rankAmongThirds,
            qualifies: entry.qualifies,
            eligibleMatchNumbers: assignedMatch != null ? [assignedMatch] : [],
            scenarioNumber,
        }
    })
}

export function getQualifyingThirdGroupsKey(allGames) {
    let ranked = rankThirdPlacedTeams(allGames)
    if (ranked == null) {
        ranked = rankPredictiveThirdPlacedTeams(allGames)
    }

    return qualifyingThirdGroupsKeyFromRanked(ranked)
}

function qualifyingThirdGroupsKeyFromRanked(ranked) {
    if (ranked == null || ranked.length === 0) {
        return null
    }

    const qualifying = ranked.filter((entry) => entry.qualifies)
    if (qualifying.length < 8) {
        return null
    }

    return buildQualifyingThirdGroupsKey(qualifying.map((entry) => entry.group))
}

export function getQualifyingThirdGroupsKeyFromLive(allGames) {
    return qualifyingThirdGroupsKeyFromRanked(rankLiveThirdPlacedTeams(allGames))
}

export function getQualifyingThirdGroupsKeyFromPredictive(allGames) {
    return qualifyingThirdGroupsKeyFromRanked(rankPredictiveThirdPlacedTeams(allGames))
}

function resolveThirdInAssignedGroup(allGames, eligibleGroups, matchNumber, qualifyingGroupsKey, standingsFn, source) {
    if (qualifyingGroupsKey == null) {
        return null
    }

    const assignedGroup = getAssignedThirdGroupForMatch(qualifyingGroupsKey, matchNumber)
    if (assignedGroup == null || eligibleGroups.indexOf(assignedGroup) === -1) {
        return null
    }

    const standings = standingsFn(getGroupGames(allGames, assignedGroup))
    if (standings.length < 3) {
        return null
    }

    return {
        team: standings[2].team,
        source,
    }
}

function appendCandidate(candidates, candidate) {
    if (candidate == null) {
        return candidates
    }

    const alreadyListed = candidates.some((entry) => (
        entry.source === candidate.source && entry.team.id === candidate.team.id
    ))
    if (!alreadyListed) {
        candidates.push(candidate)
    }

    return candidates
}

export function rankLiveThirdPlacedTeams(allGames) {
    const collected = collectThirdPlacedTeams(allGames, computeLiveGroupStandings)
    return finalizeThirdPlaceRanking(collected.thirds, collected.groups.length)
}

export function rankPredictiveThirdPlacedTeams(allGames) {
    const collected = collectThirdPlacedTeams(allGames, computePredictiveGroupStandings)
    return finalizeThirdPlaceRanking(collected.thirds, collected.groups.length)
}

export function rankThirdPlacedTeams(allGames) {
    const groups = listGroupPhaseGroups(allGames)
    const thirds = []

    for (const group of groups) {
        const standings = computeGroupStandings(getGroupGames(allGames, group))
        if (standings == null || standings.length < 3) {
            return null
        }

        thirds.push({
            group,
            standing: standings[2],
        })
    }

    return finalizeThirdPlaceRanking(thirds, groups.length)
}

function isGroupOfficiallyComplete(groupGames) {
    return isGroupScheduleComplete(groupGames)
        && groupGames.every((game) => getResultScore(game) != null)
}

const CANDIDATE_SOURCE_PRIORITY = ['db', 'result', 'partialResult', 'prediction']

export function pickPrimaryCandidate(candidates) {
    if (candidates == null || candidates.length === 0) {
        return null
    }

    for (const source of CANDIDATE_SOURCE_PRIORITY) {
        const found = candidates.find((candidate) => candidate.source === source)
        if (found != null) {
            return found
        }
    }

    return candidates[0]
}

export function resolveGroupRankCandidates(allGames, rank, group) {
    const groupGames = getGroupGames(allGames, group)
    const candidates = []

    if (isGroupOfficiallyComplete(groupGames)) {
        const officialStandings = computeLiveGroupStandings(groupGames)
        if (officialStandings.length >= rank) {
            candidates.push({
                team: officialStandings[rank - 1].team,
                source: 'result',
            })
        }
        return candidates
    }

    const playedGames = groupGames.filter((game) => getResultScore(game) != null)
    if (playedGames.length > 0) {
        const liveStandings = computeLiveGroupStandings(groupGames)
        if (liveStandings.length >= rank) {
            candidates.push({
                team: liveStandings[rank - 1].team,
                source: 'partialResult',
            })
        }
    }

    const predictiveStandings = computeGroupStandings(groupGames)
    if (predictiveStandings != null && predictiveStandings.length >= rank) {
        candidates.push({
            team: predictiveStandings[rank - 1].team,
            source: 'prediction',
        })
    }

    return candidates
}

export function resolveGroupRank(allGames, rank, group) {
    return pickPrimaryCandidate(resolveGroupRankCandidates(allGames, rank, group))
}

export function areAllGroupStagesOfficiallyComplete(allGames) {
    const groups = listGroupPhaseGroups(allGames)
    if (groups.length === 0) {
        return false
    }

    return groups.every((group) => isGroupOfficiallyComplete(getGroupGames(allGames, group)))
}

export function resolveBestThirdCandidates(allGames, eligibleGroups, matchNumber) {
    if (matchNumber == null) {
        return []
    }

    const scenarios = areAllGroupStagesOfficiallyComplete(allGames)
        ? [{
            key: getQualifyingThirdGroupsKey(allGames),
            standingsFn: computeLiveGroupStandings,
            source: 'result',
        }]
        : [{
            key: getQualifyingThirdGroupsKeyFromLive(allGames),
            standingsFn: computeLiveGroupStandings,
            source: 'partialResult',
        }, {
            key: getQualifyingThirdGroupsKeyFromPredictive(allGames),
            standingsFn: computePredictiveGroupStandings,
            source: 'prediction',
        }]

    const candidates = []
    for (const scenario of scenarios) {
        appendCandidate(
            candidates,
            resolveThirdInAssignedGroup(
                allGames,
                eligibleGroups,
                matchNumber,
                scenario.key,
                scenario.standingsFn,
                scenario.source,
            ),
        )
    }

    return candidates
}
