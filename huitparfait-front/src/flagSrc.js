/**
 * Chemin drapeau pour countryCode API / Neo4j.
 * Fichiers : /static/flags/{code}.svg (voir make flags-wc2026)
 */

const FLAG_ALIASES = {
  // Ancien seed Euro 2016 → fichiers WC 2026
  en: 'gb-eng',
}

const UNKNOWN_FLAG = '/static/flags/unknown.svg'

export function flagSrc(countryCode) {
  if (!countryCode) {
    return null
  }
  const file = FLAG_ALIASES[countryCode] || countryCode
  return `/static/flags/${file}.svg`
}

export function flagErrorSrc() {
  return UNKNOWN_FLAG
}

export function onFlagError(event) {
  const img = event.target
  if (img && img.src && !img.src.endsWith('/unknown.svg')) {
    img.src = UNKNOWN_FLAG
  }
}
