#!/usr/bin/env node
/**
 * Importe uniquement les matchs éliminatoires (73–104) dans Neo4j local.
 * N'efface pas les users, groupes ni pronostics existants.
 *
 * Usage : node scripts/import-wc2026-knockout.mjs
 *    ou : make data-import-wc2026-knockout
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const require = createRequire(import.meta.url)

require(join(REPO_ROOT, 'scripts/load-env.js')).loadEnv({ root: REPO_ROOT })

const neo4j = require(join(REPO_ROOT, 'huitparfait-api/node_modules/neo4j-driver'))

const KNOCKOUT_CQL = join(REPO_ROOT, 'huitparfait-data/init-data-2026wc-knockout.cql')
const GENERATE_SCRIPT = join(REPO_ROOT, 'scripts/generate-wc2026-cql.mjs')

function getDriver() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687'
  const username = process.env.NEO4J_USERNAME || 'neo4j'
  const password = process.env.NEO4J_PASSWORD || 'huitparfait-local'
  return neo4j.driver(uri, neo4j.auth.basic(username, password))
}

async function countKnockoutGames(session) {
  const result = await session.run(`
    MATCH (g:Game)
    WHERE g.name STARTS WITH 'Match '
      AND toInteger(substring(g.name, 6)) >= 73
    RETURN count(g) AS count
  `)
  return result.records[0].get('count').toNumber()
}

async function countPronostics(session) {
  const result = await session.run('MATCH (p:Pronostic) RETURN count(p) AS count')
  return result.records[0].get('count').toNumber()
}

function ensureKnockoutCql() {
  if (!existsSync(KNOCKOUT_CQL)) {
    const result = spawnSync(process.execPath, [GENERATE_SCRIPT], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    })
    if (result.status !== 0) {
      process.exit(result.status ?? 1)
    }
  }
}

function runCypherShell() {
  const password = process.env.NEO4J_PASSWORD || 'huitparfait-local'
  const composeFiles = [
    '-f', join(REPO_ROOT, 'docker-compose.yml'),
    '-f', join(REPO_ROOT, 'docker-compose-local.yml'),
  ]

  const check = spawnSync('docker', ['compose', ...composeFiles, 'ps', '-q', 'huitparfait-data'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })

  if (check.status !== 0 || !check.stdout.trim()) {
    console.error('Neo4j ne tourne pas : lance make neo4j-up')
    process.exit(1)
  }

  const cql = readFileSync(KNOCKOUT_CQL, 'utf8')
  const importResult = spawnSync(
    'docker',
    ['compose', ...composeFiles, 'exec', '-T', 'huitparfait-data', 'cypher-shell', '-u', 'neo4j', '-p', password],
    {
      cwd: REPO_ROOT,
      input: cql,
      encoding: 'utf8',
    },
  )

  if (importResult.status !== 0) {
    if (importResult.stdout) {
      process.stdout.write(importResult.stdout)
    }
    if (importResult.stderr) {
      process.stderr.write(importResult.stderr)
    }
    process.exit(importResult.status ?? 1)
  }
}

async function main() {
  ensureKnockoutCql()

  const driver = getDriver()
  const session = driver.session()

  try {
    const beforeKnockout = await countKnockoutGames(session)
    const pronosBefore = await countPronostics(session)

    if (beforeKnockout >= 32) {
      console.log(`Déjà importé : ${beforeKnockout} matchs éliminatoires en base.`)
      console.log(`Pronostics inchangés : ${pronosBefore}`)
      return
    }

    console.log(`Avant import : ${beforeKnockout} match(s) éliminatoire(s), ${pronosBefore} pronostic(s)`)
    console.log('Import des phases finales (MERGE, sans reset)…')

    await session.close()
    await driver.close()

    runCypherShell()

    const driverAfter = getDriver()
    const sessionAfter = driverAfter.session()

    try {
      const afterKnockout = await countKnockoutGames(sessionAfter)
      const pronosAfter = await countPronostics(sessionAfter)

      console.log(`Après import : ${afterKnockout} matchs éliminatoires, ${pronosAfter} pronostic(s)`)

      if (afterKnockout < 32) {
        console.error(`ERREUR : seulement ${afterKnockout} matchs éliminatoires (attendu 32)`)
        process.exit(1)
      }

      if (pronosAfter !== pronosBefore) {
        console.warn(`Attention : le nombre de pronostics a changé (${pronosBefore} → ${pronosAfter})`)
      } else {
        console.log('Les pronostics existants sont intacts.')
      }
    } finally {
      await sessionAfter.close()
      await driverAfter.close()
    }
  } finally {
    try {
      await session.close()
    } catch {
      // session may already be closed
    }
    try {
      await driver.close()
    } catch {
      // driver may already be closed
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
