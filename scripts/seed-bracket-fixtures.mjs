#!/usr/bin/env node
/**
 * Fixtures locales non destructives pour tester les protagonistes incertains.
 * Ne modifie que les matchs listés ci-dessous (dates, scores, pronos de l'utilisateur cible).
 *
 * Usage : node scripts/seed-bracket-fixtures.mjs --email vous@gmail.com
 *    ou : make data-bracket-fixtures USER_EMAIL=vous@gmail.com
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

/** Après la fin des poules au calendrier CDM 2026 (27 juin). */
const KNOCKOUT_OFFSET_MS = 18 * DAY

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
 * @typedef {object} FixtureGame
 * @property {string} id
 * @property {string} name
 * @property {string} caseLabel
 * @property {number} offsetMs
 * @property {ResultSeed | null | undefined} result
 * @property {boolean} [clearResult]
 * @property {PredictionSeed | null | undefined} prediction
 * @property {boolean} [clearPrediction]
 */

/** @type {FixtureGame[]} */
const FIXTURES = [
  // —— Poule A partielle (1 seul résultat réel) ——
  {
    id: 'jyIc_YPpX',
    name: 'Match 1',
    caseLabel: 'poule A · résultat réel',
    offsetMs: -5 * DAY,
    result: { goalsA: 2, goalsB: 0, riskHappened: true },
    prediction: { scoreA: 2, scoreB: 0, risk: true, amount: 2 },
  },
  {
    id: 'Jb-N1v4tL',
    name: 'Match 2',
    caseLabel: 'poule A · prono seulement',
    offsetMs: -4 * DAY,
    clearResult: true,
    prediction: { scoreA: 2, scoreB: 0, risk: false, amount: 1 },
  },
  {
    id: 'l_Rjl0Yi8',
    name: 'Match 25',
    caseLabel: 'poule A · prono seulement',
    offsetMs: -3 * DAY,
    clearResult: true,
    prediction: { scoreA: 1, scoreB: 0, risk: false, amount: 1 },
  },
  {
    id: 'Yhjg-utIm',
    name: 'Match 28',
    caseLabel: 'poule A · prono seulement',
    offsetMs: -2 * DAY,
    clearResult: true,
    prediction: { scoreA: 0, scoreB: 0, risk: false, amount: 1 },
  },
  {
    id: 'Qak65FFhR',
    name: 'Match 53',
    caseLabel: 'poule A · prono seulement',
    offsetMs: -1 * DAY,
    clearResult: true,
    prediction: { scoreA: 3, scoreB: 0, risk: true, amount: 2 },
  },
  {
    id: 'mP626oJZX',
    name: 'Match 54',
    caseLabel: 'poule A · prono seulement',
    offsetMs: -12 * HOUR,
    clearResult: true,
    prediction: { scoreA: 0, scoreB: 1, risk: false, amount: 1 },
  },

  // —— Poule B partielle ——
  {
    id: 'CKMOESJ4h',
    name: 'Match 3',
    caseLabel: 'poule B · résultat réel',
    offsetMs: -5 * DAY,
    result: { goalsA: 2, goalsB: 1, riskHappened: false },
    prediction: { scoreA: 2, scoreB: 1, risk: false, amount: 2 },
  },
  {
    id: 'xOkx33uxO',
    name: 'Match 8',
    caseLabel: 'poule B · prono seulement',
    offsetMs: -4 * DAY,
    clearResult: true,
    prediction: { scoreA: 1, scoreB: 0, risk: true, amount: 1 },
  },
  {
    id: 'zNCN7Me9h',
    name: 'Match 26',
    caseLabel: 'poule B · prono seulement',
    offsetMs: -3 * DAY,
    clearResult: true,
    prediction: { scoreA: 2, scoreB: 0, risk: false, amount: 2 },
  },
  {
    id: '9M_u-aW3G',
    name: 'Match 27',
    caseLabel: 'poule B · prono seulement',
    offsetMs: -2 * DAY,
    clearResult: true,
    prediction: { scoreA: 1, scoreB: 1, risk: false, amount: 1 },
  },
  {
    id: '8TX2F8Cp6',
    name: 'Match 51',
    caseLabel: 'poule B · prono seulement',
    offsetMs: -1 * DAY,
    clearResult: true,
    prediction: { scoreA: 0, scoreB: 1, risk: false, amount: 1 },
  },
  {
    id: 'MItzaoOR1',
    name: 'Match 52',
    caseLabel: 'poule B · prono seulement',
    offsetMs: -12 * HOUR,
    clearResult: true,
    prediction: { scoreA: 0, scoreB: 2, risk: true, amount: 3 },
  },

  // —— Poule H terminée (1er confirmé pour Match 84) ——
  {
    id: '5VAQD-uZd',
    name: 'Match 13',
    caseLabel: 'poule H · terminée',
    offsetMs: -10 * DAY,
    result: { goalsA: 1, goalsB: 0, riskHappened: true },
    prediction: { scoreA: 1, scoreB: 0, risk: true, amount: 2 },
  },
  {
    id: 'lkPbySqSo',
    name: 'Match 14',
    caseLabel: 'poule H · terminée',
    offsetMs: -10 * DAY,
    result: { goalsA: 3, goalsB: 0, riskHappened: false },
    prediction: { scoreA: 3, scoreB: 0, risk: false, amount: 1 },
  },
  {
    id: 'ev5G4wBpW',
    name: 'Match 37',
    caseLabel: 'poule H · terminée',
    offsetMs: -9 * DAY,
    result: { goalsA: 0, goalsB: 1, riskHappened: false },
    prediction: { scoreA: 0, scoreB: 1, risk: false, amount: 1 },
  },
  {
    id: 'Fx_FsNLca',
    name: 'Match 38',
    caseLabel: 'poule H · terminée',
    offsetMs: -9 * DAY,
    result: { goalsA: 2, goalsB: 0, riskHappened: true },
    prediction: { scoreA: 2, scoreB: 0, risk: true, amount: 2 },
  },
  {
    id: 'BDK_gURbt',
    name: 'Match 65',
    caseLabel: 'poule H · terminée',
    offsetMs: -8 * DAY,
    result: { goalsA: 0, goalsB: 2, riskHappened: false },
    prediction: { scoreA: 0, scoreB: 2, risk: false, amount: 1 },
  },
  {
    id: '4GQRVcl2K',
    name: 'Match 66',
    caseLabel: 'poule H · terminée',
    offsetMs: -8 * DAY,
    result: { goalsA: 0, goalsB: 1, riskHappened: false },
    prediction: { scoreA: 0, scoreB: 1, risk: false, amount: 1 },
  },

  // —— Cas à tester côté UI ——
  {
    id: '--fe4dl3u',
    name: 'Match 7',
    caseLabel: 'équipes connues · prono ouvert',
    offsetMs: 2 * DAY,
    clearResult: true,
    prediction: null,
    clearPrediction: true,
  },
  {
    id: '-rHEVryTv',
    name: 'Match 73',
    caseLabel: '2e A vs 2e B · dual + bloqué',
    offsetMs: KNOCKOUT_OFFSET_MS,
    clearResult: true,
    prediction: null,
    clearPrediction: true,
  },
  {
    id: 'u1iJXGTua',
    name: 'Match 74',
    caseLabel: 'qualifiés inconnus · en attente',
    offsetMs: KNOCKOUT_OFFSET_MS + DAY,
    clearResult: true,
    prediction: null,
    clearPrediction: true,
  },
  {
    id: '15zThn1Gd',
    name: 'Match 84',
    caseLabel: '1er H confirmé · 2e J incertain · bloqué',
    offsetMs: KNOCKOUT_OFFSET_MS + 2 * DAY,
    clearResult: true,
    prediction: null,
    clearPrediction: true,
  },
]

const FIXTURE_IDS = FIXTURES.map((game) => game.id)

function parseArgs(argv) {
  let email = process.env.USER_EMAIL || null

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--email' && argv[i + 1]) {
      email = argv[++i]
    } else if (arg.startsWith('--email=')) {
      email = arg.slice('--email='.length)
    }
  }

  return { email }
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
  return `bfix_${gameId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`
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

async function assertKnockoutGames(session) {
  const rows = await runQuery(
    session,
    `
    MATCH (g:Game)
    WHERE g.name IN ['Match 73', 'Match 74', 'Match 84']
    RETURN count(g) AS count
    `,
  )

  if ((rows[0]?.count || 0) < 3) {
    console.error('')
    console.error('Les matchs à élimination directe (73–104) sont absents.')
    console.error('Lance : make data-import-wc2026-knockout')
    console.error('')
    process.exit(1)
  }
}

async function rescheduleGame(session, gameId, startsAt) {
  await runWrite(
    session,
    'MATCH (g:Game { id: $gameId }) SET g.startsAt = $startsAt',
    { gameId, startsAt },
  )
}

async function clearGameResults(session, gameId) {
  await runWrite(
    session,
    `
    MATCH (g:Game { id: $gameId })
    MATCH (ta:Team)-[piga:PLAYS_IN_GAME { order: 1 }]->(g)
    MATCH (tb:Team)-[pigb:PLAYS_IN_GAME { order: 2 }]->(g)
    MATCH (r:Risk)-[ufg:USED_FOR_GAME]->(g)
    REMOVE piga.goals, pigb.goals, ufg.happened
    `,
    { gameId },
  )
}

async function setGameResults(session, gameId, result) {
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
    {
      gameId,
      goalsA: result.goalsA,
      goalsB: result.goalsB,
      riskHappened: result.riskHappened,
    },
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

async function mergeUserPrediction(session, userId, game, now) {
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

async function applyFixture(session, userId, game, now) {
  await rescheduleGame(session, game.id, now + game.offsetMs)

  if (game.clearResult) {
    await clearGameResults(session, game.id)
  }
  if (game.result != null) {
    await setGameResults(session, game.id, game.result)
  }

  if (game.clearPrediction) {
    await clearUserPrediction(session, userId, game.id)
  } else if (game.prediction != null) {
    await mergeUserPrediction(session, userId, game, now)
  }
}

function printSummary(now) {
  console.log('')
  console.log('Cas à vérifier sur http://localhost:3000/pronostics/prochains-matchs :')
  console.log('')
  console.log('  1. Match 73 — 2e Groupe A vs 2e Groupe B')
  console.log('     → deux protagonistes par slot (résultats temporaires + prono)')
  console.log('     → formulaire grisé, message « qualifiés pas encore officiels »')
  console.log('')
  console.log('  2. Match 74 — 1er Groupe E vs 3e repêché')
  console.log('     → « En attente des qualifiés », pas de protagonistes déduits')
  console.log('')
  console.log('  3. Match 84 — 1er Groupe H vs 2e Groupe J')
  console.log('     → Espagne confirmée (poule H terminée) à gauche')
  console.log('     → 2e du groupe J encore incertain à droite, prono bloqué')
  console.log('')
  console.log('  4. Match 7 — Brésil vs Maroc')
  console.log('     → équipes connues, prono ouvert normalement')
  console.log('')
  console.log('Les 16èmes+ sont calés ~18 jours après aujourd’hui (après la phase de groupes).')
  console.log(`Horizon : ${new Date(now - 10 * DAY).toLocaleString('fr-FR')} → ${new Date(now + KNOCKOUT_OFFSET_MS + 2 * DAY).toLocaleString('fr-FR')}`)
  console.log('')
  console.log(`Matchs touchés (${FIXTURE_IDS.length}) : les autres données de la base sont inchangées.`)
}

async function main() {
  const { email } = parseArgs(process.argv)

  if (!email) {
    console.error('Usage : node scripts/seed-bracket-fixtures.mjs --email vous@gmail.com')
    console.error('   ou : make data-bracket-fixtures USER_EMAIL=vous@gmail.com')
    process.exit(1)
  }

  const driver = getDriver()
  const session = driver.session()
  const now = Date.now()

  try {
    const user = await assertUser(session, email)
    await assertKnockoutGames(session)

    console.log(`Utilisateur : ${user.name} (${email})`)
    console.log('Application des fixtures bracket (non destructif)…')

    for (const game of FIXTURES) {
      await applyFixture(session, user.id, game, now)
      console.log(`  • ${game.name} — ${game.caseLabel}`)
    }

    await session.close()
    await driver.close()

    printSummary(now)
  } catch (err) {
    await session.close()
    await driver.close()
    console.error(err)
    process.exit(1)
  }
}

main()
