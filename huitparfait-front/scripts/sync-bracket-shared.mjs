#!/usr/bin/env node
/**
 * Copie huitparfait-shared/src → huitparfait-front/src/bracket-shared
 * (Webpack 1 / Babel 6 ne transpile pas les fichiers hors src/)
 */

import { cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONT_ROOT = join(__dirname, '..')
const SHARED_SRC = join(FRONT_ROOT, '../huitparfait-shared/src')
const OUT_DIR = join(FRONT_ROOT, 'src/bracket-shared')

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
