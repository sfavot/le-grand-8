import { cypher, cypherOne } from '../infra/neo4j.js'

export function fetchGamesToFill() {
    return cypher(`
        MATCH (g:Game)
        WHERE g.startsAt < timestamp()
        MATCH (ta:Team)-[piga:PLAYS_IN_GAME { order: 1 }]->(g)
        MATCH (tb:Team)-[pigb:PLAYS_IN_GAME { order: 2 }]->(g)
        MATCH (r:Risk)-[ufg:USED_FOR_GAME]->(g)
        WHERE piga.goals IS NULL
           OR pigb.goals IS NULL
           OR ufg.happened IS NULL
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
        ORDER BY g.startsAt ASC`)
}

export function updateGameResults({ gameId, goalsTeamA, goalsTeamB, riskHappened }) {
    return cypherOne(`
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
}
