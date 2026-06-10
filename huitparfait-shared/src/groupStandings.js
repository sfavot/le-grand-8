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
    if (groupGames.length === 0) {
        return null
    }

    const teamIds = new Set()
    for (const game of groupGames) {
        teamIds.add(game.idTeamA)
        teamIds.add(game.idTeamB)
    }

    const expectedGames = (teamIds.size * (teamIds.size - 1)) / 2
    if (groupGames.length < expectedGames) {
        return null
    }

    const standingsByTeamId = new Map()

    for (const game of groupGames) {
        const score = getScoreForStanding(game)
        if (score == null) {
            return null
        }

        const teamA = {
            id: game.idTeamA,
            countryCode: game.countryCodeTeamA,
            countryName: game.countryNameTeamA,
            group: game.group,
        }
        const teamB = {
            id: game.idTeamB,
            countryCode: game.countryCodeTeamB,
            countryName: game.countryNameTeamB,
            group: game.group,
        }

        if (!standingsByTeamId.has(teamA.id)) {
            standingsByTeamId.set(teamA.id, emptyStanding(teamA))
        }
        if (!standingsByTeamId.has(teamB.id)) {
            standingsByTeamId.set(teamB.id, emptyStanding(teamB))
        }

        const standingA = standingsByTeamId.get(teamA.id)
        const standingB = standingsByTeamId.get(teamB.id)

        applyResult(standingA, score.goalsA, score.goalsB)
        applyResult(standingB, score.goalsB, score.goalsA)
    }

    return Array.from(standingsByTeamId.values()).sort(compareStandings)
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
    return buildStandingsFromGroupGames(groupGames, (game) => getResultScore(game) || getPredictionScore(game))
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

    if (ranked.length < 8) {
        return null
    }

    return buildQualifyingThirdGroupsKey(
        ranked.filter((entry) => entry.qualifies).map((entry) => entry.group),
    )
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

export function resolveGroupRank(allGames, rank, group) {
    const standings = computeGroupStandings(getGroupGames(allGames, group))
    if (standings == null || standings.length < rank) {
        return null
    }

    const standing = standings[rank - 1]
    return {
        team: standing.team,
        source: inferStandingsSource(getGroupGames(allGames, group)),
    }
}

function inferStandingsSource(groupGames) {
    const hasResult = groupGames.some((g) => g.goalsTeamA != null && g.goalsTeamB != null)
    return hasResult ? 'result' : 'prediction'
}

export function resolveBestThird(allGames, eligibleGroups, matchNumber, qualifyingGroupsKey) {
    if (matchNumber == null || qualifyingGroupsKey == null) {
        return null
    }

    const assignedGroup = getAssignedThirdGroupForMatch(qualifyingGroupsKey, matchNumber)
    if (assignedGroup == null || eligibleGroups.indexOf(assignedGroup) === -1) {
        return null
    }

    return resolveGroupRank(allGames, 3, assignedGroup)
}
