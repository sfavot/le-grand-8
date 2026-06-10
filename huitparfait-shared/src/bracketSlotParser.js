/**
 * Parse TeamUnknown countryName labels from tournament data.
 */

const GROUP_RANK_RE = /^(\d)(?:er|e) du Groupe ([A-Z])$/
const BEST_THIRD_RE = /^3e du Groupe (.+)$/
const WINNER_RE = /^Vainqueur du Match (\d+)$/
const LOSER_RE = /^Perdant du Match (\d+)$/

export function parseSlotLabel(countryName) {
    if (countryName == null || countryName === '') {
        return null
    }

    const groupRank = countryName.match(GROUP_RANK_RE)
    if (groupRank) {
        return {
            type: 'groupRank',
            rank: Number(groupRank[1]),
            group: groupRank[2],
        }
    }

    const bestThird = countryName.match(BEST_THIRD_RE)
    if (bestThird) {
        const groups = bestThird[1]
            .split(/\s*,\s*|\s+ou\s+/)
            .map((g) => g.replace(/^Groupe\s+/i, '').trim())
            .filter(Boolean)

        return {
            type: 'bestThird',
            groups,
        }
    }

    const winner = countryName.match(WINNER_RE)
    if (winner) {
        return {
            type: 'winner',
            matchNumber: Number(winner[1]),
        }
    }

    const loser = countryName.match(LOSER_RE)
    if (loser) {
        return {
            type: 'loser',
            matchNumber: Number(loser[1]),
        }
    }

    return null
}
