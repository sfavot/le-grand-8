import _ from 'lodash'
import {
    areProtagonistsConfirmed,
    enrichGamesWithBracket,
    isGamePredictable,
} from '../../../huitparfait-shared/src/bracketResolver.js'
import { cypher } from '../infra/neo4j.js'

const PREDICTIONS_QUERY = `
    MATCH          (g:Game)
    MATCH          (ta:Team)-[piga:PLAYS_IN_GAME {order: 1}]->(g)
    MATCH          (tb:Team)-[pigb:PLAYS_IN_GAME {order: 2}]->(g)
    MATCH          (r:Risk)-[ufg:USED_FOR_GAME]->(g)
    OPTIONAL MATCH (g)<-[:IS_ABOUT_GAME]-(p:Pronostic)-[:CREATED_BY_USER]->(u:User { id: {userId} })
    OPTIONAL MATCH (p)-[sa:PREDICT_SCORE]->(ta)
    OPTIONAL MATCH (p)-[sb:PREDICT_SCORE]->(tb)
    OPTIONAL MATCH (p)-[pr:PREDICT_RISK]->(r:Risk)
    RETURN   g.id            AS gameId,
             g.phase         AS phase,
             g.city          AS city,
             g.name          AS gameName,
             g.stadium       AS stadium,
             g.startsAt      AS startsAt,
             ta.id           AS idTeamA,
             ta.countryCode  AS countryCodeTeamA,
             ta.countryName  AS countryNameTeamA,
             ta.group        AS group,
             tb.id           AS idTeamB,
             tb.countryCode  AS countryCodeTeamB,
             tb.countryName  AS countryNameTeamB,
             piga.goals      AS goalsTeamA,
             pigb.goals      AS goalsTeamB,
             piga.penalties  AS penaltiesTeamA,
             pigb.penalties  AS penaltiesTeamB,
             r.id            AS riskId,
             r.text          AS riskTitle,
             sa.goals        AS predictionScoreTeamA,
             sb.goals        AS predictionScoreTeamB,
             pr.willHappen   AS predictionRiskAnswer,
             pr.amount       AS predictionRiskAmount,
             p.classicPoints AS classicPoints,
             p.riskPoints    AS riskPoints,
             ufg.happened    AS riskHappened
    ORDER BY g.startsAt
`

export function fetchAllUserPredictions(userId) {
    return cypher(PREDICTIONS_QUERY, { userId })
        .then((predictions) => predictions.map((game) => {
            game.predictionRiskAmount = game.predictionRiskAmount || 3

            if (game.classicPoints != null) {
                game.points = game.classicPoints + (game.riskPoints || 0)
            }

            return game
        }))
}

export async function assertGameIsPredictable(userId, gameId) {
    const allGames = await fetchAllUserPredictions(userId)
    const bracketMap = enrichGamesWithBracket(allGames)
    const game = _(allGames).find({ gameId })

    if (game == null) {
        return false
    }

    return areProtagonistsConfirmed(bracketMap, game)
        && isGamePredictable(bracketMap, game)
}
