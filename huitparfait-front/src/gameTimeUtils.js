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
    if (city == null || city === '') {
        return null
    }
    return CITY_TIMEZONES[city] || null
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

    const venueTime = formatHHmm(date, timeZone)
    const localTime = formatHHmm(date)

    if (venueTime === localTime) {
        return null
    }

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
