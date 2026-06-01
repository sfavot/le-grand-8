#!/usr/bin/env node
/**
 * Génère huitparfait-data/init-data-2026wc.cql à partir des JSON wc2026-*.
 * Usage : node scripts/generate-wc2026-cql.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const DATA_DIR = join(REPO_ROOT, 'huitparfait-data')
const OUT_FILE = join(DATA_DIR, 'init-data-2026wc.cql')

const teamsData = JSON.parse(readFileSync(join(DATA_DIR, 'wc2026-teams.json'), 'utf8'))
const matchesData = JSON.parse(readFileSync(join(DATA_DIR, 'wc2026-group-matches.json'), 'utf8'))
const risksData = JSON.parse(readFileSync(join(DATA_DIR, 'wc2026-risks.json'), 'utf8'))

const SHORTID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-'

/** Identifiant stable (9 car.) pour ne pas changer le CQL à chaque génération. */
function stableId(seed) {
  const digest = createHash('sha256').update(seed).digest()
  let id = ''
  for (let i = 0; i < 9; i++) {
    id += SHORTID_CHARS[digest[i] % SHORTID_CHARS.length]
  }
  return id
}

/** Variable Cypher stable à partir du code pays (ex. gb-eng → _gb_eng). */
function teamVar(countryCode) {
  return `_${countryCode.replace(/-/g, '_')}`
}

function cypherString(value) {
  return JSON.stringify(value)
}

/**
 * Heure locale America/New_York → epoch ms (prise en charge heure d'été US).
 */
function toStartsAtMs(date, time) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(guessUtc)).map((p) => [p.type, p.value]),
  )
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    0,
  )
  const offset = asUtc - guessUtc
  return guessUtc - offset
}

const teamByCode = new Map()
const teamIds = new Map()

for (const [group, teams] of Object.entries(teamsData.groups)) {
  for (const team of teams) {
    teamByCode.set(team.countryCode, { ...team, group })
    teamIds.set(team.countryCode, stableId(`wc2026-team-${team.countryCode}`))
  }
}

const gameIds = new Map()
for (const match of matchesData.matches) {
  gameIds.set(match.n, stableId(`wc2026-game-${match.n}`))
}

const lines = []

lines.push('// Le Grand 8 : Coupe du monde 2026 (phase de groupes)')
lines.push('// Généré par scripts/generate-wc2026-cql.mjs : ne pas éditer à la main')
lines.push(`// Source calendrier : ${matchesData.source}`)
lines.push('')

lines.push('////////////////////////////////')
lines.push('// Teams (48)')
lines.push('////////////////////////////////')
lines.push('')

for (const [group, teams] of Object.entries(teamsData.groups)) {
  for (const team of teams) {
    const v = teamVar(team.countryCode)
    const id = teamIds.get(team.countryCode)
    lines.push(
      `CREATE (${v}:Team { id: ${cypherString(id)}, countryName: ${cypherString(team.name)}, countryCode: ${cypherString(team.countryCode)}, group: ${cypherString(group)} })`,
    )
  }
}
lines.push('')

lines.push('////////////////////////////////')
lines.push('// Games (72 : phase de groupes)')
lines.push('////////////////////////////////')
lines.push('')

for (const match of matchesData.matches) {
  const v = `_Game${match.n}`
  const id = gameIds.get(match.n)
  const startsAt = toStartsAtMs(match.date, match.time)
  lines.push(
    `CREATE (${v}:Game { id: ${cypherString(id)}, name: ${cypherString(`Match ${match.n}`)}, phase: "Groupes", startsAt: ${startsAt}, stadium: ${cypherString(match.stadium)}, city: ${cypherString(match.city)} })`,
  )
}
lines.push('')

lines.push('////////////////////////////////')
lines.push('// Risks (phase de groupes)')
lines.push('////////////////////////////////')
lines.push('')

for (const risk of risksData.risks) {
  lines.push(
    `CREATE (_Risk${risk.n}:Risk { id: ${cypherString(risk.id)}, text: ${cypherString(risk.text)} })`,
  )
}
lines.push('')

lines.push('////////////////////////////////')
lines.push('// Plays_in_game')
lines.push('////////////////////////////////')
lines.push('')

for (const match of matchesData.matches) {
  const game = `_Game${match.n}`
  const home = teamVar(match.home)
  const away = teamVar(match.away)
  lines.push(`CREATE (${home})-[:PLAYS_IN_GAME {order: 1}]->(${game})`)
  lines.push(`CREATE (${away})-[:PLAYS_IN_GAME {order: 2}]->(${game})`)
}
lines.push('')

lines.push('////////////////////////////////')
lines.push('// Used_for_game')
lines.push('////////////////////////////////')
lines.push('')

const riskOrder = risksData.groupStageRiskOrder
for (const match of matchesData.matches) {
  const riskNum = riskOrder[(match.n - 1) % riskOrder.length]
  lines.push(`CREATE (_Risk${riskNum})-[:USED_FOR_GAME]->(_Game${match.n})`)
}
lines.push('')

const output = `${lines.join('\n')}\n`
writeFileSync(OUT_FILE, output, 'utf8')

console.log(`Écrit ${OUT_FILE}`)
console.log(`  ${teamByCode.size} équipes, ${matchesData.matches.length} matchs, ${risksData.risks.length} risques`)
