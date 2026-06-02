#!/usr/bin/env node
/**
 * Scénario de test local : 10 matchs autour d'aujourd'hui, pronostics, scores partiels.
 * Usage : node scripts/seed-dev-scenario.mjs --email vous@gmail.com [--calculate]
 *    ou : make data-dev-scenario USER_EMAIL=vous@gmail.com
 */

import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const require = createRequire(import.meta.url)

require(join(REPO_ROOT, 'scripts/load-env.js')).loadEnv({ root: REPO_ROOT })

const neo4j = require(join(REPO_ROOT, 'huitparfait-api/node_modules/neo4j-driver'))

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/** IDs stables des matchs 1–10 (init-data-2026wc.cql). */
const KEEP_GAME_IDS = [
  'jyIc_YPpX',
  'Jb-N1v4tL',
  'CKMOESJ4h',
  'pKIXU5Op7',
  'PzTgmkZ26',
  'aHSxa7f-v',
  '--fe4dl3u',
  'xOkx33uxO',
  '_NrqgdN0D',
  '34sdlOwrL',
]

/**
 * @typedef {object} PredictionSeed
 * @property {number} scoreA
 * @property {number} scoreB
 * @property {boolean} risk
 * @property {number} amount
 */

/**
 * @typedef {object} ResultSeed
 * @property {number} goalsA
 * @property {number} goalsB
 * @property {boolean} riskHappened
 */

/**
 * @typedef {object} GameScenario
 * @property {string} id
 * @property {string} name
 * @property {number} offsetMs
 * @property {PredictionSeed | null} prediction
 * @property {ResultSeed | null} [result]
 */

/** @type {GameScenario[]} */
const SCENARIO = [
  {
    id: 'jyIc_YPpX',
    name: 'Match 1',
    offsetMs: DAY + 2 * HOUR,
    prediction: null,
  },
  {
    id: 'Jb-N1v4tL',
    name: 'Match 2',
    offsetMs: DAY + 5 * HOUR,
    prediction: { scoreA: 2, scoreB: 1, risk: true, amount: 2 },
  },
  {
    id: 'CKMOESJ4h',
    name: 'Match 3',
    offsetMs: -3 * HOUR,
    prediction: { scoreA: 1, scoreB: 1, risk: false, amount: 3 },
  },
  {
    id: 'pKIXU5Op7',
    name: 'Match 4',
    offsetMs: -5 * HOUR,
    prediction: null,
  },
  {
    id: 'PzTgmkZ26',
    name: 'Match 5',
    offsetMs: -2 * DAY,
    prediction: { scoreA: 2, scoreB: 0, risk: true, amount: 2 },
    result: { goalsA: 2, goalsB: 1, riskHappened: true },
  },
  {
    id: 'aHSxa7f-v',
    name: 'Match 6',
    offsetMs: -4 * DAY,
    prediction: { scoreA: 2, scoreB: 1, risk: true, amount: 3 },
    result: { goalsA: 2, goalsB: 1, riskHappened: true },
  },
  {
    id: '--fe4dl3u',
    name: 'Match 7',
    offsetMs: 4 * HOUR,
    prediction: { scoreA: 0, scoreB: 0, risk: false, amount: 1 },
  },
  {
    id: 'xOkx33uxO',
    name: 'Match 8',
    offsetMs: 8 * HOUR,
    prediction: null,
  },
  {
    id: '_NrqgdN0D',
    name: 'Match 9',
    offsetMs: -1 * HOUR,
    prediction: { scoreA: 3, scoreB: 2, risk: true, amount: 2 },
  },
  {
    id: '34sdlOwrL',
    name: 'Match 10',
    offsetMs: DAY + 1 * HOUR,
    prediction: null,
  },
]

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
  return `dev_${gameId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`
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

async function deleteExtraGames(session) {
  await runWrite(
    session,
    `
    MATCH (g:Game)
    WHERE NOT g.id IN $keepIds
    DETACH DELETE g
    `,
    { keepIds: KEEP_GAME_IDS },
  )
}

async function rescheduleGames(session, now) {
  for (const game of SCENARIO) {
    const startsAt = now + game.offsetMs
    await runWrite(
      session,
      'MATCH (g:Game { id: $gameId }) SET g.startsAt = $startsAt',
      { gameId: game.id, startsAt },
    )
  }
}

async function clearPointsForScoredGames(session) {
  await runWrite(
    session,
    `
    MATCH (g:Game)<-[:IS_ABOUT_GAME]-(p:Pronostic)
    WHERE g.id IN $gameIds
    REMOVE p.classicPoints, p.riskPoints
    `,
    { gameIds: SCENARIO.filter((g) => g.result).map((g) => g.id) },
  )
}

async function mergePrediction(session, userId, game, now) {
  if (game.prediction == null) {
    await runWrite(
      session,
      `
      MATCH (u:User { id: $userId })
      MATCH (g:Game { id: $gameId })<-[:IS_ABOUT_GAME]-(p:Pronostic)-[:CREATED_BY_USER]->(u)
      DETACH DELETE p
      `,
      { userId, gameId: game.id },
    )
    return
  }

  const { scoreA, scoreB, risk, amount } = game.prediction
  const pronosticId = stablePronosticId(game.id)

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
      gameId: game.id,
      now,
      pronosticId,
      scoreA,
      scoreB,
      risk,
      amount,
    },
  )
}

async function setGameResults(session, game) {
  if (game.result == null) {
    await runWrite(
      session,
      `
      MATCH (g:Game { id: $gameId })
      MATCH (ta:Team)-[piga:PLAYS_IN_GAME { order: 1 }]->(g)
      MATCH (tb:Team)-[pigb:PLAYS_IN_GAME { order: 2 }]->(g)
      MATCH (r:Risk)-[ufg:USED_FOR_GAME]->(g)
      REMOVE piga.goals, pigb.goals, ufg.happened
      `,
      { gameId: game.id },
    )
    return
  }

  const { goalsA, goalsB, riskHappened } = game.result
  await runWrite(
    session,
    `
    MATCH (g:Game { id: $gameId })
    MATCH (ta:Team)-[piga:PLAYS_IN_GAME { order: 1 }]->(g)
    MATCH (tb:Team)-[pigb:PLAYS_IN_GAME { order: 2 }]->(g)
    MATCH (r:Risk)-[ufg:USED_FOR_GAME]->(g)
    SET piga.goals = $goalsA,
        pigb.goals = $goalsB,
        ufg.happened = $riskHappened
    `,
    { gameId: game.id, goalsA, goalsB, riskHappened },
  )
}

function describeGame(game, now) {
  const startsAt = now + game.offsetMs
  const when = startsAt > now ? 'à venir' : 'passé'
  const prono = game.prediction
    ? `prono ${game.prediction.scoreA}-${game.prediction.scoreB}`
    : 'sans prono'
  const score = game.result
    ? `noté ${game.result.goalsA}-${game.result.goalsB}`
    : 'non noté'
  return `${game.name} (${game.id}) : ${when}, ${prono}, ${score}`
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
    console.error('Usage : node scripts/seed-dev-scenario.mjs --email vous@gmail.com [--calculate]')
    console.error('   ou : make data-dev-scenario USER_EMAIL=vous@gmail.com')
    process.exit(1)
  }

  const driver = getDriver()
  const session = driver.session()
  const now = Date.now()

  try {
    const user = await assertUser(session, email)
    console.log(`Utilisateur : ${user.name} (${email})`)

    const gameCount = await runQuery(session, 'MATCH (g:Game) RETURN count(g) AS count')
    if (gameCount[0]?.count < 72) {
      console.warn('Attention : la base ne contient pas 72 matchs. Lance : make data-import-wc2026')
    }

    console.log('Suppression des matchs 11–72…')
    await deleteExtraGames(session)

    console.log('Recalage des dates…')
    await rescheduleGames(session, now)

    console.log('Pronostics…')
    await clearPointsForScoredGames(session)
    for (const game of SCENARIO) {
      await mergePrediction(session, user.id, game, now)
      await setGameResults(session, game)
    }

    await session.close()
    await driver.close()

    if (calculate) {
      console.log('Calcul des points (matchs notés sans points)…')
      await runCalculate()
    }

    console.log('')
    console.log('Scénario dev prêt :')
    for (const game of SCENARIO) {
      console.log(`  • ${describeGame(game, now)}`)
    }
    console.log('')
    console.log('À tester :')
    console.log('  http://localhost:3000/pronostics/prochains-matchs')
    console.log('  http://localhost:3000/pronostics/matchs-precedents')
    console.log('  http://localhost:3000/admin')
    if (!calculate) {
      console.log('')
      console.log('Pour calculer les points du match 6 : relance avec --calculate ou bouton Admin.')
    }
  } catch (err) {
    await session.close()
    await driver.close()
    console.error(err)
    process.exit(1)
  }
}

main()
