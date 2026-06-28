import { parseSlotLabel } from './bracket-shared/bracketSlotParser'
import { isKnockoutPhase } from './bracket-shared/knockoutWinner'
import { applyBracketStateToGame } from './bracketUtils'
import { DISPLAY_TIMEZONE } from './gameTimeUtils'
import { buildMatchEntry, buildTeamDisplay } from './resultsUtils'

const ROUND_PHASES = [
    '16èmes de finale',
    '8èmes de finale',
    'Quart de finale',
    'Demi-finale',
]

const PHASE_DEPTH = {
    'Demi-finale': 0,
    'Quart de finale': 1,
    '8èmes de finale': 2,
    '16èmes de finale': 3,
}

function parseMatchNumber(gameName) {
    const match = String(gameName).match(/Match\s+(\d+)/i)
    return match ? Number(match[1]) : null
}

function getFeederMatchNumbers(game) {
    const numbers = []

    for (const countryName of [game.countryNameTeamA, game.countryNameTeamB]) {
        const parsed = parseSlotLabel(countryName)
        if (parsed != null && (parsed.type === 'winner' || parsed.type === 'loser')) {
            numbers.push(parsed.matchNumber)
        }
    }

    return numbers
}

function collectRoundOrder(semiNumber, targetPhase, childrenOf, byNumber) {
    const targetDepth = PHASE_DEPTH[targetPhase]
    if (targetDepth == null) {
        return []
    }

    function collectAtDepth(matchNumber, depth) {
        if (depth === targetDepth) {
            return [matchNumber]
        }

        const children = childrenOf.get(matchNumber)
        if (children == null || children.length === 0) {
            return []
        }

        return children.reduce(
            (acc, child) => acc.concat(collectAtDepth(child, depth + 1)),
            [],
        )
    }

    return collectAtDepth(semiNumber, 0)
        .map((matchNumber) => byNumber.get(matchNumber))
        .filter((match) => match != null)
}

function buildSideRounds(semiNumber, side, childrenOf, byNumber) {
    return ROUND_PHASES
        .map((phase) => {
            const matches = collectRoundOrder(semiNumber, phase, childrenOf, byNumber)
            if (matches.length === 0) {
                return null
            }

            return {
                phase,
                side,
                matches,
            }
        })
        .filter((round) => round != null)
}

export function scoreWinnerSide(score, mode = 'live') {
    if (score == null) {
        return null
    }

    if (score.goalsA > score.goalsB) {
        return 'A'
    }

    if (score.goalsB > score.goalsA) {
        return 'B'
    }

    if (mode === 'live'
            && score.penaltiesA != null
            && score.penaltiesB != null) {
        if (score.penaltiesA > score.penaltiesB) {
            return 'A'
        }

        if (score.penaltiesB > score.penaltiesA) {
            return 'B'
        }
    }

    return null
}

function getWinnerTeam(match, mode) {
    const side = match[mode]
    let winnerSide = scoreWinnerSide(side.score, mode)

    if (winnerSide == null && mode === 'predictive') {
        winnerSide = scoreWinnerSide(match.live.score, 'live')
    }

    if (winnerSide == null) {
        return null
    }

    return winnerSide === 'A' ? side.teamA : side.teamB
}

const MAX_BRACKET_TEAM_LABEL_LENGTH = 15

function truncateBracketLabel(label, maxLength = MAX_BRACKET_TEAM_LABEL_LENGTH) {
    if (label == null || label.length <= maxLength) {
        return label
    }

    return `${label.slice(0, maxLength - 1)}…`
}

function countryCodeLabel(countryCode) {
    return countryCode.toUpperCase().replace('GB-SCT', 'SCO').slice(0, 3)
}

function isBracketSlotLabel(label) {
    return label != null && parseSlotLabel(label) != null
}

export function toDisplayTeam(team) {
    if (team == null) {
        return null
    }

    if (team.type === 'team') {
        if (team.countryName && !isBracketSlotLabel(team.countryName)) {
            return team
        }

        if (team.countryCode) {
            return {
                type: 'team',
                countryCode: team.countryCode,
                countryName: team.countryName && !isBracketSlotLabel(team.countryName)
                    ? team.countryName
                    : null,
            }
        }
    }

    if (team.countryCode || (team.countryName && !isBracketSlotLabel(team.countryName))) {
        return {
            type: 'team',
            countryCode: team.countryCode || null,
            countryName: team.countryName && !isBracketSlotLabel(team.countryName)
                ? team.countryName
                : null,
        }
    }

    return null
}

export function bracketTeamTitle(team) {
    if (team == null) {
        return 'À déterminer'
    }

    const displayTeam = toDisplayTeam(team)
    if (displayTeam != null) {
        return displayTeam.countryName || countryCodeLabel(displayTeam.countryCode)
    }

    if (team.type === 'slot') {
        return team.label
    }

    return team.label || 'À déterminer'
}

export function bracketTeamLabel(team) {
    if (team == null) {
        return 'À déterminer'
    }

    const displayTeam = toDisplayTeam(team)
    if (displayTeam != null) {
        if (displayTeam.countryName) {
            return truncateBracketLabel(displayTeam.countryName)
        }

        if (displayTeam.countryCode) {
            return countryCodeLabel(displayTeam.countryCode)
        }
    }

    if (team.type === 'slot') {
        const parsed = parseSlotLabel(team.label)
        if (parsed != null && parsed.type === 'groupRank') {
            const rankLabel = parsed.rank === 1 ? '1er' : `${parsed.rank}e`
            return `${rankLabel} G.${parsed.group}`
        }

        if (parsed != null && parsed.type === 'winner') {
            return `Vainq. M${parsed.matchNumber}`
        }

        if (parsed != null && parsed.type === 'loser') {
            return `Perd. M${parsed.matchNumber}`
        }

        if (parsed != null && parsed.type === 'bestThird') {
            return 'Meilleur 3e'
        }

        return truncateBracketLabel(team.label)
    }

    return team.label || 'À déterminer'
}

function getLoserTeam(match, mode) {
    const winner = getWinnerTeam(match, mode)
    if (winner == null) {
        return null
    }

    const side = match[mode]
    if (winner === side.teamA) {
        return side.teamB
    }

    if (winner === side.teamB) {
        return side.teamA
    }

    return null
}

function resolveSlotFromTree(team, byNumber, mode, visiting) {
    if (team == null || team.type !== 'slot') {
        return team
    }

    const parsed = parseSlotLabel(team.label)
    if (parsed == null || (parsed.type !== 'winner' && parsed.type !== 'loser')) {
        return team
    }

    const feederNumber = parsed.matchNumber
    if (visiting.has(feederNumber)) {
        return team
    }

    visiting.add(feederNumber)

    const feeder = byNumber.get(feederNumber)
    if (feeder == null) {
        return team
    }

    const enrichedFeeder = enrichMatchFromTree(feeder, byNumber, mode, visiting)
    let resolved = parsed.type === 'winner'
        ? getWinnerTeam(enrichedFeeder, mode)
        : getLoserTeam(enrichedFeeder, mode)

    if (resolved != null && resolved.type === 'slot') {
        resolved = resolveSlotFromTree(resolved, byNumber, mode, visiting)
    }

    const displayTeam = toDisplayTeam(resolved)
    if (displayTeam != null) {
        return displayTeam
    }

    return team
}

function enrichMatchFromTree(match, byNumber, mode, visiting) {
    const side = match[mode]
    const teamA = resolveSlotFromTree(side.teamA, byNumber, mode, visiting)
    const teamB = resolveSlotFromTree(side.teamB, byNumber, mode, visiting)

    if (teamA === side.teamA && teamB === side.teamB) {
        return match
    }

    return Object.assign({}, match, {
        [mode]: Object.assign({}, side, {
            teamA,
            teamB,
        }),
    })
}

function enrichBracketFromTree(byNumber) {
    const matchNumbers = Array.from(byNumber.keys()).sort((a, b) => a - b)

    for (let pass = 0; pass < matchNumbers.length; pass++) {
        let changed = false

        for (const matchNumber of matchNumbers) {
            const match = byNumber.get(matchNumber)
            const enrichedLive = enrichMatchFromTree(match, byNumber, 'live', new Set())
            const enrichedBoth = enrichMatchFromTree(enrichedLive, byNumber, 'predictive', new Set())

            if (enrichedBoth !== match) {
                changed = true
            }

            byNumber.set(matchNumber, enrichedBoth)
        }

        if (!changed) {
            break
        }
    }
}

function preferDisplayTeam(current, rebuilt) {
    const currentTeam = toDisplayTeam(current)
    const rebuiltTeam = toDisplayTeam(rebuilt)

    if (rebuiltTeam != null && rebuiltTeam.countryName) {
        return rebuiltTeam
    }

    if (currentTeam != null && currentTeam.countryName) {
        return currentTeam
    }

    if (rebuiltTeam != null) {
        return rebuiltTeam
    }

    if (currentTeam != null) {
        return currentTeam
    }

    return rebuilt || current
}

function mergeSideTeamsFromGame(match, game, mode) {
    const side = match[mode]
    const teamA = preferDisplayTeam(side.teamA, buildTeamDisplay(game, 'A', mode))
    const teamB = preferDisplayTeam(side.teamB, buildTeamDisplay(game, 'B', mode))

    if (teamA === side.teamA && teamB === side.teamB) {
        return match
    }

    return Object.assign({}, match, {
        [mode]: Object.assign({}, side, {
            teamA,
            teamB,
        }),
    })
}

function mergeBracketCandidatesIntoTree(byNumber, enrichedGames) {
    for (const game of enrichedGames) {
        const matchNumber = parseMatchNumber(game.gameName)
        if (matchNumber == null) {
            continue
        }

        let match = byNumber.get(matchNumber)
        if (match == null) {
            continue
        }

        match = mergeSideTeamsFromGame(match, game, 'live')
        match = mergeSideTeamsFromGame(match, game, 'predictive')
        byNumber.set(matchNumber, match)
    }
}

export function formatBracketMatchDate(startsAt) {
    if (startsAt == null) {
        return ''
    }

    const date = new Date(startsAt)
    if (isNaN(date.getTime())) {
        return ''
    }

    const now = new Date()
    const dayKey = (value) => new Intl.DateTimeFormat('en-CA', {
        timeZone: DISPLAY_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(value)

    const timeLabel = formatBracketMatchTime(date)
    const todayKey = dayKey(now)
    const matchKey = dayKey(date)

    if (matchKey === todayKey) {
        return `Aujourd'hui - ${timeLabel}`
    }

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (matchKey === dayKey(tomorrow)) {
        return `Demain - ${timeLabel}`
    }

    const dateLabel = new Intl.DateTimeFormat('fr-FR', {
        timeZone: DISPLAY_TIMEZONE,
        day: 'numeric',
        month: 'short',
    }).format(date).replace('.', '')

    return `${dateLabel} - ${timeLabel}`
}

export function formatBracketMatchDateShort(startsAt) {
    if (startsAt == null) {
        return ''
    }

    const date = new Date(startsAt)
    if (isNaN(date.getTime())) {
        return ''
    }

    const now = new Date()
    const dayKey = (value) => new Intl.DateTimeFormat('en-CA', {
        timeZone: DISPLAY_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(value)

    const todayKey = dayKey(now)
    const matchKey = dayKey(date)

    if (matchKey === todayKey) {
        return 'Aujourd\'hui'
    }

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (matchKey === dayKey(tomorrow)) {
        return 'Demain'
    }

    return new Intl.DateTimeFormat('fr-FR', {
        timeZone: DISPLAY_TIMEZONE,
        day: 'numeric',
        month: 'short',
    }).format(date).replace('.', '')
}

export function bracketTeamMobileLabel(team) {
    if (team == null) {
        return '–'
    }

    const displayTeam = toDisplayTeam(team)
    if (displayTeam != null) {
        if (displayTeam.countryCode) {
            return countryCodeLabel(displayTeam.countryCode)
        }

        return '–'
    }

    if (team.type === 'slot') {
        const parsed = parseSlotLabel(team.label)
        if (parsed != null && parsed.type === 'groupRank') {
            return `${parsed.rank}${parsed.group}`
        }

        if (parsed != null && parsed.type === 'winner') {
            return `V${parsed.matchNumber}`
        }

        if (parsed != null && parsed.type === 'loser') {
            return `P${parsed.matchNumber}`
        }

        if (parsed != null && parsed.type === 'bestThird') {
            return '3e'
        }

        const label = team.label || '–'
        return label.length > 5 ? `${label.slice(0, 4)}…` : label
    }

    return team.label || '–'
}

function formatBracketMatchTime(date) {
    const parts = new Intl.DateTimeFormat('fr-FR', {
        timeZone: DISPLAY_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date)
    const hour = Number(parts.find((part) => part.type === 'hour').value)
    const minute = parts.find((part) => part.type === 'minute').value

    if (minute === '00') {
        return `${hour}h`
    }

    return `${hour}h${minute}`
}

export function buildKnockoutBracketData(allGames, bracketMap) {
    if (allGames == null || allGames.length === 0) {
        return null
    }

    const enrichedGames = allGames
        .filter((game) => isKnockoutPhase(game.phase))
        .map((game) => applyBracketStateToGame(game, bracketMap))

    const byNumber = new Map()
    for (const game of enrichedGames) {
        const matchNumber = parseMatchNumber(game.gameName)
        if (matchNumber == null) {
            continue
        }

        const entry = buildMatchEntry(game)
        byNumber.set(matchNumber, {
            matchNumber,
            phase: game.phase,
            startsAt: game.startsAt,
            gameId: game.gameId,
            live: entry.live,
            predictive: entry.predictive,
        })
    }

    enrichBracketFromTree(byNumber)
    mergeBracketCandidatesIntoTree(byNumber, enrichedGames)

    const finalMatch = Array.from(byNumber.values()).find((match) => match.phase === 'Finale')
    if (finalMatch == null) {
        return null
    }

    const thirdPlaceMatch = Array.from(byNumber.values()).find((match) => match.phase === 'Petite finale')

    const childrenOf = new Map()
    for (const game of enrichedGames) {
        const matchNumber = parseMatchNumber(game.gameName)
        const feeders = getFeederMatchNumbers(game)
        if (matchNumber != null && feeders.length === 2) {
            childrenOf.set(matchNumber, feeders)
        }
    }

    const finalFeeders = childrenOf.get(finalMatch.matchNumber) || []
    const leftSemiNumber = finalFeeders[0]
    const rightSemiNumber = finalFeeders[1]

    if (leftSemiNumber == null || rightSemiNumber == null) {
        return null
    }

    const leafCount = collectRoundOrder(leftSemiNumber, '16èmes de finale', childrenOf, byNumber).length
    if (leafCount === 0) {
        return null
    }

    return {
        leafCount,
        leftRounds: buildSideRounds(leftSemiNumber, 'left', childrenOf, byNumber),
        rightRounds: buildSideRounds(rightSemiNumber, 'right', childrenOf, byNumber),
        final: finalMatch,
        thirdPlace: thirdPlaceMatch,
        getChampion(mode) {
            return getWinnerTeam(finalMatch, mode)
        },
    }
}

export function bracketSlotStyle(index, matchCount, leafCount) {
    const span = leafCount / matchCount
    const start = index * span + 1

    return {
        gridRow: `${start} / span ${span}`,
    }
}

export function verticalRoundColumnCount(matchCount) {
    return Math.min(4, Math.max(1, matchCount))
}

export function verticalRoundRowCount(matchCount) {
    const columns = verticalRoundColumnCount(matchCount)

    return Math.ceil(matchCount / columns)
}

export function verticalRoundGridStyle(matchCount) {
    const columns = verticalRoundColumnCount(matchCount)

    return {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    }
}

export function verticalBridgeRowCount(matchCount) {
    return verticalRoundRowCount(matchCount)
}

export function verticalBridgeGridStyle(matchCount) {
    const columns = verticalRoundColumnCount(matchCount)
    const rows = verticalBridgeRowCount(matchCount)

    return {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        height: `${24 * rows}px`,
    }
}

export function verticalBridgePairStyle(pairIndex, matchCount) {
    const columns = verticalRoundColumnCount(matchCount)
    const pairsPerRow = columns / 2
    const rowIndex = Math.floor(pairIndex / pairsPerRow)
    const colPairIndex = pairIndex % pairsPerRow
    const colStart = colPairIndex * 2 + 1

    return {
        gridColumn: `${colStart} / span 2`,
        gridRow: `${rowIndex + 1}`,
    }
}

export function verticalTopStageGridStyle(matchCount, hasBridge) {
    const columns = verticalRoundColumnCount(matchCount)
    const matchRows = verticalRoundRowCount(matchCount)
    const bridgeRows = hasBridge ? verticalBridgeRowCount(matchCount) : 0

    return {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: hasBridge
            ? `repeat(${matchRows}, auto) repeat(${bridgeRows}, 24px)`
            : `repeat(${matchRows}, auto)`,
    }
}

export function verticalTopStageSlotStyle(index, matchCount) {
    const columns = verticalRoundColumnCount(matchCount)

    return {
        gridColumn: `${(index % columns) + 1}`,
        gridRow: `${Math.floor(index / columns) + 1}`,
    }
}

export function verticalTopStageBridgePairStyle(pairIndex, matchCount) {
    const columns = verticalRoundColumnCount(matchCount)
    const pairsPerRow = columns / 2
    const rowIndex = Math.floor(pairIndex / pairsPerRow)
    const colPairIndex = pairIndex % pairsPerRow
    const colStart = colPairIndex * 2 + 1
    const matchRows = verticalRoundRowCount(matchCount)

    return {
        gridColumn: `${colStart} / span 2`,
        gridRow: `${matchRows + rowIndex + 1}`,
    }
}

export function verticalBottomStageGridStyle(matchCount, bridgeKind) {
    const columns = verticalRoundColumnCount(matchCount)
    const matchRows = verticalRoundRowCount(matchCount)
    const bridgeRows = bridgeKind != null ? verticalBridgeRowCount(matchCount) : 0

    return {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: bridgeKind != null
            ? `repeat(${bridgeRows}, 24px) repeat(${matchRows}, auto)`
            : `repeat(${matchRows}, auto)`,
    }
}

export function verticalBottomStageSlotStyle(index, matchCount, hasBridge) {
    const columns = verticalRoundColumnCount(matchCount)
    const bridgeRows = hasBridge ? verticalBridgeRowCount(matchCount) : 0

    return {
        gridColumn: `${(index % columns) + 1}`,
        gridRow: `${bridgeRows + Math.floor(index / columns) + 1}`,
    }
}

export function verticalBottomStageBridgePairStyle(pairIndex, matchCount) {
    const columns = verticalRoundColumnCount(matchCount)
    const pairsPerRow = columns / 2
    const rowIndex = Math.floor(pairIndex / pairsPerRow)
    const colPairIndex = pairIndex % pairsPerRow
    const colStart = colPairIndex * 2 + 1

    return {
        gridColumn: `${colStart} / span 2`,
        gridRow: `${rowIndex + 1}`,
    }
}

export function verticalBottomStageBridgeSplitStyle(matchCount) {
    return {
        gridColumn: `1 / span ${verticalRoundColumnCount(matchCount)}`,
        gridRow: '1',
    }
}

function orderPhaseMatchesByBracketSide(phaseMatches, bracketSideMatches) {
    if (bracketSideMatches == null || bracketSideMatches.length === 0) {
        return []
    }

    const byGameId = new Map(phaseMatches.map((match) => [match.gameId, match]))

    return bracketSideMatches
        .map((match) => byGameId.get(match.gameId))
        .filter((match) => match != null)
}

export function splitRoundOf16MatchesByBracket(phaseMatches, bracketData) {
    if (phaseMatches == null || phaseMatches.length === 0 || bracketData == null) {
        return null
    }

    const leftRound = bracketData.leftRounds.find((round) => round.phase === '16èmes de finale')
    const rightRound = bracketData.rightRounds.find((round) => round.phase === '16èmes de finale')

    if (leftRound == null && rightRound == null) {
        return null
    }

    return {
        left: orderPhaseMatchesByBracketSide(phaseMatches, leftRound != null ? leftRound.matches : []),
        right: orderPhaseMatchesByBracketSide(phaseMatches, rightRound != null ? rightRound.matches : []),
    }
}
