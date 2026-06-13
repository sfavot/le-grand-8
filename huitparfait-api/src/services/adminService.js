import { cypher, cypherOne } from '../infra/neo4j.js'
import { canonicalCityName, venueDateTimeToStartsAtMs } from '../infra/gameTimeUtils.js'

export function fetchGamesToFill() {
    return fetchAdminGames({ filled: false })
}

export function fetchAdminGames({ filled = false } = {}) {
    const resultsFilter = filled
        ? 'piga.goals IS NOT NULL AND pigb.goals IS NOT NULL AND ufg.happened IS NOT NULL'
        : 'piga.goals IS NULL OR pigb.goals IS NULL OR ufg.happened IS NULL'
    const order = filled ? 'DESC' : 'ASC'

    return cypher(`
        MATCH (g:Game)
        WHERE g.startsAt < timestamp()
        MATCH (ta:Team)-[piga:PLAYS_IN_GAME { order: 1 }]->(g)
        MATCH (tb:Team)-[pigb:PLAYS_IN_GAME { order: 2 }]->(g)
        MATCH (r:Risk)-[ufg:USED_FOR_GAME]->(g)
        WHERE ${resultsFilter}
        RETURN g.id           AS gameId,
               g.name         AS gameName,
               g.phase        AS phase,
               g.city         AS city,
               g.stadium      AS stadium,
               g.startsAt     AS startsAt,
               ta.countryCode AS countryCodeTeamA,
               ta.countryName AS countryNameTeamA,
               ta.group       AS group,
               tb.countryCode AS countryCodeTeamB,
               tb.countryName AS countryNameTeamB,
               piga.goals     AS goalsTeamA,
               pigb.goals     AS goalsTeamB,
               r.text         AS riskTitle,
               ufg.happened   AS riskHappened
        ORDER BY g.startsAt ${order}`)
}

export function fetchAdminGamesSchedule() {
    return cypher(`
        MATCH (g:Game)
        MATCH (ta:Team)-[:PLAYS_IN_GAME { order: 1 }]->(g)
        MATCH (tb:Team)-[:PLAYS_IN_GAME { order: 2 }]->(g)
        RETURN g.id           AS gameId,
               g.name         AS gameName,
               g.phase        AS phase,
               g.city         AS city,
               g.stadium      AS stadium,
               g.startsAt     AS startsAt,
               ta.countryCode AS countryCodeTeamA,
               ta.countryName AS countryNameTeamA,
               ta.group       AS group,
               tb.countryCode AS countryCodeTeamB,
               tb.countryName AS countryNameTeamB
        ORDER BY g.startsAt ASC`)
}

export async function updateGameSchedule({ gameId, gameName, phase, stadium, city, date, time }) {
    const canonicalCity = canonicalCityName(city)
    if (canonicalCity == null) {
        throw new Error(`Ville inconnue pour le fuseau horaire : ${city}`)
    }

    const startsAt = venueDateTimeToStartsAtMs(date, time, canonicalCity)

    const setClauses = [
        'g.startsAt = { startsAt }',
        'g.stadium = { stadium }',
        'g.city = { city }',
        'g.updatedAt = timestamp()',
    ]
    const params = { gameId, startsAt, stadium, city: canonicalCity }

    if (gameName != null) {
        setClauses.push('g.name = { gameName }')
        params.gameName = gameName
    }
    if (phase != null) {
        setClauses.push('g.phase = { phase }')
        params.phase = phase
    }

    const updated = await cypherOne(`
        MATCH (g:Game { id: { gameId } })
        SET ${setClauses.join(',\n            ')}
        RETURN g.id       AS gameId,
               g.name     AS gameName,
               g.phase    AS phase,
               g.city     AS city,
               g.stadium  AS stadium,
               g.startsAt AS startsAt`,
        params)

    return updated
}

export async function updateGameResults({ gameId, goalsTeamA, goalsTeamB, riskHappened }) {
    const updated = await cypherOne(`
        MATCH (g:Game { id: { gameId } })
        WHERE g.startsAt < timestamp()
        MATCH (ta:Team)-[piga:PLAYS_IN_GAME { order: 1 }]->(g)
        MATCH (tb:Team)-[pigb:PLAYS_IN_GAME { order: 2 }]->(g)
        MATCH (r:Risk)-[ufg:USED_FOR_GAME]->(g)
        SET piga.goals = { goalsTeamA },
            pigb.goals = { goalsTeamB },
            ufg.happened = { riskHappened }
        RETURN g.id AS gameId`,
        {
            gameId,
            goalsTeamA,
            goalsTeamB,
            riskHappened,
        })

    await cypher(`
        MATCH (g:Game { id: { gameId } })<-[:IS_ABOUT_GAME]-(p:Pronostic)
        REMOVE p.classicPoints, p.riskPoints`,
        { gameId },
    )

    return updated
}
