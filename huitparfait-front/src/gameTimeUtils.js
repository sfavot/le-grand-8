/** Villes hôte → fuseau IANA (heure sur place au moment du match). */
const CITY_TIMEZONES = {
    // Coupe du monde 2026
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
    // Euro 2016
    'Saint-Denis': 'Europe/Paris',
    'Paris': 'Europe/Paris',
    'Lens': 'Europe/Paris',
    'Bordeaux': 'Europe/Paris',
    'Marseille': 'Europe/Paris',
    'Nice': 'Europe/Paris',
    'Villeneuve-d\'Ascq': 'Europe/Paris',
    'Toulouse': 'Europe/Paris',
    'Décines-Charpieu': 'Europe/Paris',
    'Saint-Étienne': 'Europe/Paris',
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

/**
 * Résout une ville saisie vers le nom canonique et le fuseau IANA.
 */
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

export function parseStartsAt(startsAt) {
    const timestamp = Number(startsAt)
    if (isNaN(timestamp)) {
        return null
    }
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? null : date
}

export function formatLocalTime(startsAt) {
    const date = parseStartsAt(startsAt)
    if (date == null) {
        return ''
    }
    return formatHHmm(date)
}

function formatHHmm(date, timeZone) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }
    if (timeZone != null) {
        options.timeZone = timeZone
    }
    const parts = new Intl.DateTimeFormat('fr-FR', options).formatToParts(date)
    const hour = parts.find((p) => p.type === 'hour').value
    const minute = parts.find((p) => p.type === 'minute').value
    return `${hour}h${minute}`
}

/**
 * Abréviation du fuseau (EDT, CST, HEC…), ou décalage UTC si l’API n’en fournit pas.
 */
function formatTimeZoneName(date, timeZone) {
    const shortName = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short',
    })
        .formatToParts(date)
        .find((p) => p.type === 'timeZoneName')

    if (shortName != null && /^[A-Z]{2,5}$/.test(shortName.value)) {
        return shortName.value
    }

    const offset = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset',
    })
        .formatToParts(date)
        .find((p) => p.type === 'timeZoneName')

    if (offset != null) {
        return offset.value.replace(/^GMT/, 'UTC')
    }

    return null
}

function calendarDateKey(date, timeZone) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }
    if (timeZone != null) {
        options.timeZone = timeZone
    }
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date)
    const year = parts.find((p) => p.type === 'year').value
    const month = parts.find((p) => p.type === 'month').value
    const day = parts.find((p) => p.type === 'day').value
    return `${year}-${month}-${day}`
}

function formatVenueDate(date, timeZone) {
    return new Intl.DateTimeFormat('fr-FR', {
        timeZone,
        day: 'numeric',
        month: 'long',
    }).format(date)
}

function formatVenueClock(date, timeZone) {
    const parts = new Intl.DateTimeFormat('fr-FR', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date)
    const hour = Number(parts.find((p) => p.type === 'hour').value)
    const minute = parts.find((p) => p.type === 'minute').value

    if (minute === '00') {
        return `${hour}h`
    }

    return `${hour}h${minute}`
}

export function timezoneForCity(city) {
    const resolved = resolveScheduleCity(city)
    return resolved != null ? resolved.timeZone : null
}

export const KNOWN_CITIES = Object.keys(CITY_TIMEZONES).sort()

/**
 * Epoch ms → date et heure locales au lieu du match (YYYY-MM-DD, HH:mm).
 */
export function startsAtToVenueDateTime(startsAt, city) {
    const timeZone = timezoneForCity(city)
    if (timeZone == null) {
        return null
    }

    const date = parseStartsAt(startsAt)
    if (date == null) {
        return null
    }

    const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)

    const timeParts = new Intl.DateTimeFormat('fr-FR', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date)
    const hour = timeParts.find((p) => p.type === 'hour').value
    const minute = timeParts.find((p) => p.type === 'minute').value

    return { date: dateStr, time: `${hour}:${minute}` }
}

/**
 * Date et heure locales (fuseau du lieu) → epoch ms.
 */
export function venueDateTimeToStartsAtMs(date, time, city) {
    const timeZone = timezoneForCity(city)
    if (timeZone == null) {
        return null
    }

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

/**
 * Libellé du fuseau au moment du match (ex. EDT, UTC-6).
 */
export function formatVenueTimeZoneLabel(startsAt, city) {
    const timeZone = timezoneForCity(city)
    if (timeZone == null) {
        return null
    }

    const date = parseStartsAt(startsAt)
    if (date == null) {
        return null
    }

    return formatTimeZoneName(date, timeZone)
}

/**
 * Heure équivalente dans un autre fuseau (ex. Paris pour l’admin).
 */
export function formatTimeInZone(startsAt, timeZone) {
    const date = parseStartsAt(startsAt)
    if (date == null) {
        return ''
    }

    const clock = formatVenueClock(date, timeZone)
    const label = formatTimeZoneName(date, timeZone)
    const dateLabel = new Intl.DateTimeFormat('fr-FR', {
        timeZone,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    }).format(date)

    if (label == null) {
        return `${clock} · ${dateLabel}`
    }

    return `${clock} ${label} · ${dateLabel}`
}

function buildVenueTimeLabel(date, timeZone) {
    const timeZoneLabel = formatTimeZoneName(date, timeZone)
    if (timeZoneLabel == null) {
        return null
    }

    let label = `${formatVenueClock(date, timeZone)} ${timeZoneLabel}`
    if (calendarDateKey(date) !== calendarDateKey(date, timeZone)) {
        label += ` · ${formatVenueDate(date, timeZone)}`
    }

    return label
}

/**
 * Heure au lieu du match, ou null si ville inconnue ou identique à l’heure locale affichée.
 */
export function formatGameVenueTime(startsAt, city) {
    const timeZone = timezoneForCity(city)
    if (timeZone == null) {
        return null
    }

    const date = parseStartsAt(startsAt)
    if (date == null) {
        return null
    }

    if (formatHHmm(date, timeZone) === formatHHmm(date)) {
        return null
    }

    return buildVenueTimeLabel(date, timeZone)
}
