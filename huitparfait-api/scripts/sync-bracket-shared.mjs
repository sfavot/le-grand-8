#!/usr/bin/env node
/**
 * Copie huitparfait-shared/src → huitparfait-api/src/bracket-shared
 * (l'image Docker n'inclut que huitparfait-api, pas le monorepo entier)
 */

import { cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const API_ROOT = join(__dirname, '..')
const SHARED_SRC = join(API_ROOT, '../huitparfait-shared/src')
const OUT_DIR = join(API_ROOT, 'src/bracket-shared')

mkdirSync(OUT_DIR, { recursive: true })

for (const file of [
  'bracketResolver.js',
  'bracketSlotParser.js',
  'groupStandings.js',
  'knockoutWinner.js',
  'thirdPlaceScenarios.js',
  'thirdPlaceScenariosData.js',
]) {
  cpSync(join(SHARED_SRC, file), join(OUT_DIR, file))
}

console.log('Synchronisé bracket-shared depuis huitparfait-shared/src')
