/**
 * Classement par ex æquo (fonction pure, sans Neo4j).
 */

export function calculateRank(ranking = []) {
    ranking.forEach((row, idx, rows) => {
        if (idx > 0 && rows[idx - 1].totalScore === row.totalScore) {
            row.rank = rows[idx - 1].rank
            return
        }

        row.rank = idx + 1
    })

    return ranking
}
