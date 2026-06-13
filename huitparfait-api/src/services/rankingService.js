import { cypher } from '../infra/neo4j.js'
import _ from 'lodash'
import { betterUser, fetchUsersWithIds } from './userService.js'
import { betterGroup } from './groupService.js'
import moment from 'moment'
import { calculateRank } from './ranking-rank.js'

export { calculateRank } from './ranking-rank.js'

let commonRankingCache
let cachedEightLimit

fetchCommonRankingByCache({}).catch((err) => {
    console.warn('Ranking cache warmup skipped:', err.message)
})

export function fetchCommonRankingByCache({ forceUpdate = false }) {
    const eightLimit = getEightLimit()
    const cacheIsStale = commonRankingCache != null && cachedEightLimit !== eightLimit

    if (commonRankingCache && !forceUpdate && !cacheIsStale) {
        return commonRankingCache
    }

    cachedEightLimit = eightLimit
    commonRankingCache = calculateCommonRanking()
    return commonRankingCache
}

export function calculateCommonRanking() {
    const eightLimit = getEightLimit()

    return cypher(`
        MATCH (u:User)
        OPTIONAL MATCH (u)<-[:CREATED_BY_USER]-(p:Pronostic)-[:IS_ABOUT_GAME]->(game:Game)
        WHERE game.startsAt < {eightLimit} AND p.classicPoints IS NOT NULL
        OPTIONAL MATCH (ta:Team)-[:PLAYS_IN_GAME {order: 1}]->(game)
        OPTIONAL MATCH (tb:Team)-[:PLAYS_IN_GAME {order: 2}]->(game)
        WITH
          u,
          CASE WHEN ta IS NOT NULL AND tb IS NOT NULL
            THEN p.classicPoints + p.riskPoints END AS score,
          CASE WHEN ta IS NOT NULL AND tb IS NOT NULL
            AND p.classicPoints = 5 AND p.riskPoints = 3 THEN 1 END AS perfect
        RETURN
                u.id             AS userId,
                coalesce(SUM(score), 0) AS totalScore,
                COUNT(score)     AS nbPredictions,
                COUNT(perfect)   AS nbPerfects
                ORDER BY totalScore DESC, nbPredictions DESC, nbPerfects DESC`,
        { eightLimit })
}

export function fetchCommonRankingWithPaginate({ page = 1, pageSize = 50 }) {

    return fetchCommonRankingByCache({})
        .then(calculateRank)
        .then(paginate)
        .then(attachUser)
        .then((ranking) => ranking.map(formatRanking({ transformAnonymous: true })))


    function attachUser(ranking) {
        const userIds = _.map(ranking, 'userId')

        return fetchUsersWithIds(userIds).then((users) => {
            const usersById = _.keyBy(users, 'userId')

            return ranking.map((row) => {
                return {
                    ...row,
                    ...usersById[row.userId],
                }
            })
        })
    }


    function paginate(results = []) {
        if (page === 0) {
            page = 1
        }

        const from = pageSize * (page - 1)
        return results.slice(from, pageSize + from)
    }
}

function getEightLimit() {
    const now = moment()
    // TODO handle 8:08 on Europe/Paris timezone properly ;-)
    const eightLimit = moment().startOf('day').add({ hours: 6, minutes: 8 })

    if (now.isBefore(eightLimit)) {
        return eightLimit.subtract(1, 'days').valueOf()
    }

    return eightLimit.valueOf()
}

export function calculateGroupsRanking({ userId, page = 1, pageSize = 50 }) {

    const eightLimit = getEightLimit()

    return cypher(`
        MATCH (g:Group)
        WHERE coalesce(g.excludeFromGroupsRanking, false) = false
        MATCH (u:User)-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g)
        OPTIONAL MATCH (u)<-[:CREATED_BY_USER]-(p:Pronostic)-[:IS_ABOUT_GAME]->(game:Game)
        WHERE game.startsAt < {eightLimit} AND p.classicPoints IS NOT NULL
        OPTIONAL MATCH (ta:Team)-[:PLAYS_IN_GAME {order: 1}]->(game)
        OPTIONAL MATCH (tb:Team)-[:PLAYS_IN_GAME {order: 2}]->(game)
        WITH g, u,
          coalesce(SUM(
            CASE WHEN ta IS NOT NULL AND tb IS NOT NULL
              THEN p.classicPoints + p.riskPoints END
          ), 0) AS userScore
        WITH g, AVG(userScore) AS averageScore, count(DISTINCT u) AS memberCount
        OPTIONAL MATCH (me:User { id: {userId} })-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g)
        RETURN
                g.id        AS groupId,
                g.name      AS name,
                g.avatarUrl AS avatarUrl,
                averageScore,
                memberCount,
                count(me) > 0 AS isMember
        ORDER BY averageScore DESC, memberCount DESC`,
        {
            userId,
            eightLimit,
        })
        .then((results) => results.map((row) => ({
            ...row,
            totalScore: row.averageScore,
        })))
        .then(calculateRank)
        .then(paginateGroupsRanking(page, pageSize))
        .then((results) => results.map(formatGroupsRanking))
}

function paginateGroupsRanking(page, pageSize) {
    return function paginate(results = []) {
        if (page === 0) {
            page = 1
        }

        const from = pageSize * (page - 1)
        return results.slice(from, pageSize + from)
    }
}

function formatGroupsRanking(row) {
    return {
        rank: row.rank,
        group: betterGroup({
            id: row.groupId,
            name: row.name,
            avatarUrl: row.avatarUrl,
        }),
        stats: {
            averageScore: Math.round(row.averageScore * 10) / 10,
            memberCount: row.memberCount,
        },
        isMember: row.isMember,
    }
}

export function calculateRanking({ groupId, userId, page = 1, pageSize = 50 }) {

    const eightLimit = getEightLimit()

    return cypher(`
        MATCH (me:User { id: {userId} })-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g:Group {id: {groupId}} )
        MATCH (u:User)-[:IS_MEMBER_OF_GROUP { isActive: true }]->(g)
        OPTIONAL MATCH (u)<-[:CREATED_BY_USER]-(p:Pronostic)-[:IS_ABOUT_GAME]->(game:Game)
        WHERE game.startsAt < {eightLimit} AND p.classicPoints IS NOT NULL
        OPTIONAL MATCH (ta:Team)-[:PLAYS_IN_GAME {order: 1}]->(game)
        OPTIONAL MATCH (tb:Team)-[:PLAYS_IN_GAME {order: 2}]->(game)
        WITH
          u,
          CASE WHEN ta IS NOT NULL AND tb IS NOT NULL
            THEN p.classicPoints + p.riskPoints END AS score,
          CASE WHEN ta IS NOT NULL AND tb IS NOT NULL
            AND p.classicPoints = 5 AND p.riskPoints = 3 THEN 1 END AS perfect
        RETURN
                u.id            AS userId,
                u.name          AS userName,
                u.anonymousName AS anonymousName,
                u.avatarUrl     AS avatarUrl,
                u.isAnonymous   AS isAnonymous,
                coalesce(SUM(score), 0) as totalScore,
                COUNT(score) as nbPredictions,
                COUNT(perfect) AS nbPerfects
                ORDER BY totalScore DESC, nbPredictions DESC, nbPerfects DESC`,
        {
            userId,
            groupId,
            eightLimit,
        })
        .then(calculateRank)
        .then(paginate)
        .then((results) => results.map(formatRanking({ transformAnonymous: false })))

    function paginate(results = []) {
        if (page === 0) {
            page = 1
        }

        const from = pageSize * (page - 1)
        return results.slice(from, pageSize + from)
    }

}

function formatRanking({ transformAnonymous }) {

    return function formatRanking(rank) {
        return {
            rank: rank.rank,
            user: betterUser(rank, transformAnonymous),
            stats: {
                totalScore: rank.totalScore,
                nbPredictions: rank.nbPredictions,
                nbPerfects: rank.nbPerfects,
            },
        }
    }
}

