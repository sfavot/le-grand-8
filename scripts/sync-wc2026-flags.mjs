#!/usr/bin/env node
/**
 * Copie les drapeaux WC 2026 depuis le paquet flag-icons vers huitparfait-front/static/flags/.
 * Prérequis : npm install flag-icons (devDependency racine)
 *
 * Usage : node scripts/sync-wc2026-flags.mjs
 */

import { readFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const TEAMS_FILE = join(REPO_ROOT, 'huitparfait-data', 'wc2026-teams.json')
const FLAGS_DIR = join(REPO_ROOT, 'huitparfait-front', 'static', 'flags')
const FLAG_ICONS_DIR = join(REPO_ROOT, 'node_modules', 'flag-icons', 'flags', '4x3')

/** Codes app → fichier flag-icons (la plupart sont identiques). */
const FLAG_ICON_ALIASES = {
  'gb-eng': 'gb-eng',
  'gb-sct': 'gb-sct',
}

function collectCountryCodes() {
  const data = JSON.parse(readFileSync(TEAMS_FILE, 'utf8'))
  const codes = new Set()
  for (const teams of Object.values(data.groups)) {
    for (const team of teams) {
      codes.add(team.countryCode)
    }
  }
  return [...codes].sort()
}

if (!existsSync(FLAG_ICONS_DIR)) {
  console.error('Paquet flag-icons introuvable. Lance : npm install')
  process.exit(1)
}

mkdirSync(FLAGS_DIR, { recursive: true })

const codes = collectCountryCodes()
let copied = 0
let missing = []

for (const code of codes) {
  const iconName = FLAG_ICON_ALIASES[code] || code
  const src = join(FLAG_ICONS_DIR, `${iconName}.svg`)
  const dest = join(FLAGS_DIR, `${code}.svg`)

  if (!existsSync(src)) {
    missing.push({ code, iconName })
    continue
  }

  copyFileSync(src, dest)
  copied++
}

console.log(`Drapeaux : ${copied}/${codes.length} copiés vers ${FLAGS_DIR}`)

if (missing.length) {
  console.error('Manquants dans flag-icons :')
  for (const { code, iconName } of missing) {
    console.error(`  ${code} (cherché : ${iconName}.svg)`)
  }
  process.exit(1)
}
