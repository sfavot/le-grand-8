#!/usr/bin/env node
/**
 * Injecte les résultats réels (poules + 8 premiers 16èmes) et remplit les pronostics
 * d'un utilisateur en LOCAL uniquement.
 *
 * Usage : node scripts/seed-wc2026-results.mjs --email vous@gmail.com [--calculate]
 *    ou : make data-wc2026-results USER_EMAIL=vous@gmail.com
 */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const require = createRequire(import.meta.url)

require(join(REPO_ROOT, 'scripts/load-env.js')).loadEnv({ root: REPO_ROOT })

const neo4j = require(join(REPO_ROOT, 'huitparfait-api/node_modules/neo4j-driver'))

const DAY = 24 * 60 * 60 * 1000
const RESULTS_FILE = join(REPO_ROOT, 'huitparfait-data/wc2026-real-results.json')
const RISKS_FILE = join(REPO_ROOT, 'huitparfait-data/wc2026-risks.json')

const LOCAL_URIS = new Set(['bolt://localhost:7687', 'neo4j://localhost:7687', 'bolt://127.0.0.1:7687'])

function parseArgs(argv) {
  let email = process.env.USER_EMAIL || null
  let calculate = false

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--calculate') {
      calculate = true
    } else if (arg === '--email' && argv[i + 1]) {
      email = argv[++i]
    } else if (arg.startsWith('--email=')) {
      email = arg.slice('--email='.length)
    }
  }

  return { email, calculate }
}

function assertLocalNeo4j() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687'
  if (!LOCAL_URIS.has(uri)) {
    console.error('')
    console.error(`Refus d'exécution : NEO4J_URI=${uri}`)
    console.error('Ce script ne s\'exécute que sur Neo4j local (bolt://localhost:7687).')
    console.error('')
    process.exit(1)
  }
}

function getDriver() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687'
  const username = process.env.NEO4J_USERNAME || 'neo4j'
  const password = process.env.NEO4J_PASSWORD || 'huitparfait-local'
  return neo4j.driver(uri, neo4j.auth.basic(username, password))
}

function sanitizeParams(params = {}) {
  const out = {}
  for (const [key, value] of Object.entries(params)) {
    out[key] = value === undefined ? null : value
  }
  return out
}

async function runQuery(session, query, params = {}) {
  const result = await session.run(query, sanitizeParams(params))
  return result.records.map((record) => {
    const row = {}
    for (const key of record.keys) {
      let value = record.get(key)
      if (neo4j.isInt(value)) {
        value = value.toNumber()
      }
      row[key] = value
    }
    return row
  })
}

async function runWrite(session, query, params = {}) {
  await session.run(query, sanitizeParams(params))
}

function stablePronosticId(gameId) {
  return `seed_${gameId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`
}

function guessRiskHappened(riskText, goalsA, goalsB) {
  const total = goalsA + goalsB
  const diff = Math.abs(goalsA - goalsB)

  switch (riskText) {
    case 'Au moins 2 buts d\'écart':
    case 'Au moins 2 buts d\'écart (prolongations incluses, hors tirs aux buts)':
      return diff >= 2
    case 'Chaque équipe marque au moins un but':
    case 'Chaque équipe marque au moins un but (prolongations incluses, hors tirs aux buts)':
      return goalsA > 0 && goalsB > 0
    case 'Score total impair':
      return total % 2 === 1
    case 'Score total pair':
      return total % 2 === 0
    default:
      return false
  }
}

function defaultPrediction(goalsA, goalsB, riskHappened) {
  return {
    scoreA: goalsA,
    scoreB: goalsB,
    risk: riskHappened,
    amount: 2,
  }
}

function upcomingPrediction(matchNumber) {
  const variants = [
    { scoreA: 2, scoreB: 1, risk: true, amount: 2 },
    { scoreA: 1, scoreB: 0, risk: false, amount: 1 },
    { scoreA: 1, scoreB: 1, risk: false, amount: 3 },
    { scoreA: 0, scoreB: 0, risk: false, amount: 1 },
    { scoreA: 3, scoreB: 1, risk: true, amount: 2 },
  ]
  return variants[matchNumber % variants.length]
}

async function assertUser(session, email) {
  const rows = await runQuery(
    session,
    'MATCH (u:User { email: $email }) RETURN u.id AS id, u.name AS name LIMIT 1',
    { email },
  )

  if (rows.length === 0) {
    console.error('')
    console.error(`Aucun utilisateur avec l'email : ${email}`)
    console.error('Connecte-toi une fois sur http://localhost:3000 (Google), puis relance ce script.')
    console.error('')
    process.exit(1)
  }

  return rows[0]
}

async function loadGames(session, userId = null) {
  return runQuery(
    session,
    `
    MATCH (g:Game)
    MATCH (ta:Team)-[piga:PLAYS_IN_GAME { order: 1 }]->(g)
    MATCH (tb:Team)-[pigb:PLAYS_IN_GAME { order: 2 }]->(g)
    MATCH (r:Risk)-[:USED_FOR_GAME]->(g)
    OPTIONAL MATCH (g)<-[:IS_ABOUT_GAME]-(p:Pronostic)-[:CREATED_BY_USER]->(u:User { id: $userId })
    OPTIONAL MATCH (p)-[sa:PREDICT_SCORE]->(ta)
    OPTIONAL MATCH (p)-[sb:PREDICT_SCORE]->(tb)
    RETURN g.id AS gameId,
           g.name AS gameName,
           g.phase AS phase,
           g.startsAt AS startsAt,
           r.text AS riskText,
           ta.id AS idTeamA,
           ta.countryCode AS countryCodeTeamA,
           ta.countryName AS countryNameTeamA,
           ta.group AS group,
           tb.id AS idTeamB,
           tb.countryCode AS countryCodeTeamB,
           tb.countryName AS countryNameTeamB,
           piga.goals AS goalsTeamA,
           pigb.goals AS goalsTeamB,
           piga.penalties AS penaltiesTeamA,
           pigb.penalties AS penaltiesTeamB,
           sa.goals AS predictionScoreTeamA,
           sb.goals AS predictionScoreTeamB
    ORDER BY g.startsAt
    `,
    { userId },
  )
}

async function setGameResult(session, gameId, goalsA, goalsB, riskHappened) {
  await runWrite(
    session,
    `
    MATCH (g:Game { id: $gameId })
    MATCH (ta:Team)-[piga:PLAYS_IN_GAME { order: 1 }]->(g)
    MATCH (tb:Team)-[pigb:PLAYS_IN_GAME { order: 2 }]->(g)
    MATCH (r:Risk)-[ufg:USED_FOR_GAME]->(g)
    SET piga.goals = $goalsA,
        pigb.goals = $goalsB,
        piga.penalties = null,
        pigb.penalties = null,
        ufg.happened = $riskHappened
    WITH g
    MATCH (g)<-[:IS_ABOUT_GAME]-(p:Pronostic)
    REMOVE p.classicPoints, p.riskPoints
    `,
    { gameId, goalsA, goalsB, riskHappened },
  )
}

async function markGamePast(session, gameId, now) {
  await runWrite(
    session,
    `
    MATCH (g:Game { id: $gameId })
    WHERE g.startsAt >= $now
    SET g.startsAt = $now - 3600000
    `,
    { gameId, now },
  )
}

async function clearUserPrediction(session, userId, gameId) {
  await runWrite(
    session,
    `
    MATCH (u:User { id: $userId })
    MATCH (g:Game { id: $gameId })<-[:IS_ABOUT_GAME]-(p:Pronostic)-[:CREATED_BY_USER]->(u)
    DETACH DELETE p
    `,
    { userId, gameId },
  )
}

async function mergePrediction(session, userId, gameId, prediction, now) {
  const { scoreA, scoreB, risk, amount } = prediction
  const pronosticId = stablePronosticId(gameId)

  await runWrite(
    session,
    `
    MATCH (u:User { id: $userId })
    MATCH (g:Game { id: $gameId })
    MATCH (ta:Team)-[:PLAYS_IN_GAME { order: 1 }]->(g)
    MATCH (tb:Team)-[:PLAYS_IN_GAME { order: 2 }]->(g)
    MATCH (r:Risk)-[:USED_FOR_GAME]->(g)

    MERGE (g)<-[:IS_ABOUT_GAME]-(p:Pronostic)-[:CREATED_BY_USER]->(u)
    ON CREATE SET p.createdAt = $now,
                  p.updatedAt = $now,
                  p.id = $pronosticId
    ON MATCH SET  p.updatedAt = $now

    MERGE (p)-[sa:PREDICT_SCORE]->(ta)
    SET sa.goals = $scoreA

    MERGE (p)-[sb:PREDICT_SCORE]->(tb)
    SET sb.goals = $scoreB

    MERGE (p)-[pr:PREDICT_RISK]->(r)
    SET pr.willHappen = $risk,
        pr.amount = $amount

    REMOVE p.classicPoints, p.riskPoints
    `,
    {
      userId,
      gameId,
      now,
      pronosticId,
      scoreA,
      scoreB,
      risk,
      amount,
    },
  )
}

function matchNumberFromName(gameName) {
  const match = /^Match (\d+)$/.exec(gameName)
  return match ? Number(match[1]) : null
}

async function runCalculate() {
  const { calculatePronostic } = await import(
    join(REPO_ROOT, 'huitparfait-api/src/services/pronosticService.js')
  )
  const { closeDriver } = await import(
    join(REPO_ROOT, 'huitparfait-api/src/infra/neo4j.js')
  )
  try {
    await calculatePronostic()
  } finally {
    await closeDriver()
  }
}

async function main() {
  const { email, calculate } = parseArgs(process.argv)

  if (!email) {
    console.error('Usage : node scripts/seed-wc2026-results.mjs --email vous@gmail.com [--calculate]')
    console.error('   ou : make data-wc2026-results USER_EMAIL=vous@gmail.com')
    process.exit(1)
  }

  assertLocalNeo4j()

  const resultsData = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'))
  readFileSync(RISKS_FILE, 'utf8')

  const resultByMatch = {
    ...resultsData.groupStage,
    ...resultsData.roundOf32,
  }

  const driver = getDriver()
  const session = driver.session()
  const now = Date.now()

  try {
    const user = await assertUser(session, email)
    const games = await loadGames(session)

    if (games.length < 104) {
      console.warn(`Attention : ${games.length} matchs en base (attendu 104). Lance : make data-import-wc2026-knockout`)
    }

    let resultsSet = 0

    console.log(`Utilisateur : ${user.name} (${email})`)
    console.log('Injection des résultats…')

    for (const game of games) {
      const matchNumber = matchNumberFromName(game.gameName)
      if (matchNumber == null) {
        continue
      }

      const score = resultByMatch[String(matchNumber)] ?? resultByMatch[matchNumber]
      if (score == null) {
        continue
      }

      const [goalsA, goalsB] = score
      const riskHappened = guessRiskHappened(game.riskText, goalsA, goalsB)
      await markGamePast(session, game.gameId, now)
      await setGameResult(session, game.gameId, goalsA, goalsB, riskHappened)
      resultsSet += 1
    }

    const { enrichGamesWithBracket, areProtagonistsConfirmed } = await import(
      join(REPO_ROOT, 'huitparfait-api/src/bracket-shared/bracketResolver.js')
    )

    const gamesAfterResults = await loadGames(session, user.id)
    const bracketMap = enrichGamesWithBracket(gamesAfterResults, now)

    let pronosSet = 0
    let pronosSkipped = 0

    console.log('Pronostics (uniquement si les deux équipes sont officiellement connues)…')

    for (const game of gamesAfterResults) {
      const matchNumber = matchNumberFromName(game.gameName)
      if (matchNumber == null) {
        continue
      }

      if (!areProtagonistsConfirmed(bracketMap, game)) {
        await clearUserPrediction(session, user.id, game.gameId)
        pronosSkipped += 1
        continue
      }

      const score = resultByMatch[String(matchNumber)] ?? resultByMatch[matchNumber]
      const prediction = score != null
        ? defaultPrediction(score[0], score[1], guessRiskHappened(game.riskText, score[0], score[1]))
        : upcomingPrediction(matchNumber)

      await mergePrediction(session, user.id, game.gameId, prediction, now)
      pronosSet += 1
    }

    await session.close()
    await driver.close()

    if (calculate) {
      console.log('Calcul des points…')
      await runCalculate()
    }

    console.log('')
    console.log(`Terminé : ${resultsSet} résultats injectés, ${pronosSet} pronostics, ${pronosSkipped} sans prono (participants incertains).`)
    console.log('Poules : 72/72 · 16èmes joués : 8/32 (M73–M80)')
    console.log('')
    console.log('À vérifier :')
    console.log('  http://localhost:3000/pronostics/matchs-precedents')
    console.log('  http://localhost:3000/admin')
    if (!calculate) {
      console.log('')
      console.log('Pour calculer les points : relance avec --calculate ou bouton Admin.')
    }
  } catch (err) {
    await session.close()
    await driver.close()
    console.error(err)
    process.exit(1)
  }
}

main()
