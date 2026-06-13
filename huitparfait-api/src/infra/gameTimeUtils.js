/** Villes hôte → fuseau IANA (heure sur place au moment du match). */
const CITY_TIMEZONES = {
    'Mexico City': 'America/Mexico_City',
    'Guadalajara': 'America/Mexico_City',
    'Monterrey': 'America/Monterrey',
    'Toronto': 'America/Toronto',
    'Vancouver': 'America/Vancouver',
    'Los Angeles': 'America/Los_Angeles',
    'San Francisco Bay Area': 'America/Los_Angeles',
    'Seattle': 'America/Los_Angeles',
    'Boston': 'America/New_York',
    'New York/New Jersey': 'America/New_York',
    'Philadelphia': 'America/New_York',
    'Miami': 'America/New_York',
    'Atlanta': 'America/New_York',
    'Houston': 'America/Chicago',
    'Dallas': 'America/Chicago',
    'Kansas City': 'America/Chicago',
}

const CITY_LOOKUP = new Map(
    Object.keys(CITY_TIMEZONES).map((city) => [city.toLowerCase(), city]),
)

function normalizeCityInput(city) {
    if (city == null) {
        return ''
    }

    return String(city).trim().replace(/\s+/g, ' ')
}

export function resolveScheduleCity(city) {
    const normalized = normalizeCityInput(city)
    if (normalized === '') {
        return null
    }

    if (CITY_TIMEZONES[normalized] != null) {
        return {
            city: normalized,
            timeZone: CITY_TIMEZONES[normalized],
        }
    }

    const canonical = CITY_LOOKUP.get(normalized.toLowerCase())
    if (canonical != null) {
        return {
            city: canonical,
            timeZone: CITY_TIMEZONES[canonical],
        }
    }

    return null
}

export function canonicalCityName(city) {
    const resolved = resolveScheduleCity(city)
    return resolved != null ? resolved.city : null
}

export function timezoneForCity(city) {
    const resolved = resolveScheduleCity(city)
    return resolved != null ? resolved.timeZone : null
}

export const DISPLAY_TIMEZONE = 'Europe/Paris'

function calendarDateKey(timestamp, timeZone) {
    const date = new Date(Number(timestamp))
    if (isNaN(date.getTime())) {
        return null
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date)
    const year = parts.find((p) => p.type === 'year').value
    const month = parts.find((p) => p.type === 'month').value
    const day = parts.find((p) => p.type === 'day').value
    return `${year}-${month}-${day}`
}

function calendarDateToZoneMidnightMs(date, timeZone) {
    const [year, month, day] = date.split('-').map(Number)
    const guessUtc = Date.UTC(year, month - 1, day, 0, 0, 0)
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
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

/** Epoch ms du début de journée (heure française) pour un coup d’envoi. */
export function displayDayKeyFromStartsAt(startsAt) {
    const dateKey = calendarDateKey(startsAt, DISPLAY_TIMEZONE)
    if (dateKey == null) {
        return null
    }

    return calendarDateToZoneMidnightMs(dateKey, DISPLAY_TIMEZONE)
}

/**
 * Date et heure locales (fuseau du lieu) → epoch ms.
 */
export function venueDateTimeToStartsAtMs(date, time, city) {
    const resolved = resolveScheduleCity(city)
    if (resolved == null) {
        throw new Error(`Ville inconnue pour le fuseau horaire : ${city}`)
    }

    const timeZone = resolved.timeZone
    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = time.split(':').map(Number)
    const guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
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
