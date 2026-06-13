import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { displayDayKeyFromStartsAt } from '../src/infra/gameTimeUtils.js'

describe('displayDayKeyFromStartsAt', () => {
    it('groups late US East Coast kickoffs under the French calendar day', () => {
        const startsAt = 1781388000000 // 13 juin 18h EDT = 14 juin 00h Paris

        const dayKey = displayDayKeyFromStartsAt(startsAt)

        assert.equal(dayKey, startsAt)
        assert.equal(
            new Intl.DateTimeFormat('fr-FR', {
                timeZone: 'Europe/Paris',
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            }).format(new Date(dayKey)),
            'dimanche 14 juin',
        )
    })

    it('keeps evening French kickoffs on the same French day', () => {
        const startsAt = Date.UTC(2026, 5, 13, 19, 0, 0) // 13 juin 21h Paris

        const dayKey = displayDayKeyFromStartsAt(startsAt)

        assert.equal(
            new Intl.DateTimeFormat('fr-FR', {
                timeZone: 'Europe/Paris',
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            }).format(new Date(dayKey)),
            'samedi 13 juin',
        )
    })
})
