<template>
    <div class="knockoutBracketV">
        <div class="knockoutBracketV-watermark" aria-hidden="true"></div>
        <div class="knockoutBracketV-content">
        <div class="knockoutBracketV-half knockoutBracketV-half--top">
            <div class="knockoutBracketV-step"
                    v-for="round in topRounds"
                    track-by="phase">
                <div class="knockoutBracketV-stage"
                        :class="{ 'knockoutBracketV-stage--narrow': isNarrowRound(round) }">
                    <div class="knockoutBracketV-round"
                            :class="roundClass(round.matches.length)">
                        <div class="knockoutBracketV-pairCol"
                                v-for="pair in matchPairs(round.matches)"
                                track-by="$index">
                            <div class="knockoutBracketV-pairRow">
                                <div class="knockoutBracketV-slot"
                                        v-for="match in pair"
                                        track-by="gameId">
                                    <knockout-bracket-match
                                            :key="match.gameId + '-' + effectiveMode"
                                            :match="match"
                                            :mode="matchMode(match)"
                                            :mobile="true">
                                    </knockout-bracket-match>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="$index < topRounds.length - 1"
                        class="knockoutBracketV-between">
                    <div v-if="betweenUsesMerge(round.matches.length, topRounds[$index + 1].matches.length)"
                            class="knockoutBracketV-betweenMerge knockoutBracketV-betweenMerge--joinDown">
                        <div class="knockoutBracketV-betweenBar"></div>
                        <div class="knockoutBracketV-betweenArm knockoutBracketV-betweenArm--left"></div>
                        <div class="knockoutBracketV-betweenArm knockoutBracketV-betweenArm--right"></div>
                        <div class="knockoutBracketV-betweenStem"></div>
                    </div>
                    <div v-else
                            class="knockoutBracketV-betweenCol"
                            :class="{ 'knockoutBracketV-betweenCol--expand': betweenUsesExpand(round.matches.length, topRounds[$index + 1].matches.length) }"
                            v-for="colIndex in betweenColCount(round.matches.length, topRounds[$index + 1].matches.length)"
                            track-by="$index">
                        <div class="knockoutBracketV-betweenBar"></div>
                        <div class="knockoutBracketV-betweenStem"></div>
                        <div v-if="betweenUsesExpand(round.matches.length, topRounds[$index + 1].matches.length)"
                                class="knockoutBracketV-betweenArm knockoutBracketV-betweenArm--innerLeft"></div>
                        <div v-if="betweenUsesExpand(round.matches.length, topRounds[$index + 1].matches.length)"
                                class="knockoutBracketV-betweenArm knockoutBracketV-betweenArm--innerRight"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="knockoutBracketV-between knockoutBracketV-between--center">
            <div class="knockoutBracketV-betweenStem"></div>
        </div>

        <div class="knockoutBracketV-center">
            <div class="knockoutBracketV-centerRow">
                <div class="knockoutBracketV-centerMatches">
                    <div class="knockoutBracketV-centerMain">
                        <knockout-bracket-match
                                :key="bracketData.final.gameId + '-' + effectiveMode"
                                :match="bracketData.final"
                                :mode="matchMode(bracketData.final)"
                                :mobile="true"
                                footer-tag="Finale"
                                footer-tag-variant="final">
                        </knockout-bracket-match>
                    </div>

                    <div v-if="bracketData.thirdPlace != null"
                            class="knockoutBracketV-centerSide knockoutBracketV-centerSide--third">
                        <knockout-bracket-match
                                :key="bracketData.thirdPlace.gameId + '-' + effectiveMode"
                                :match="bracketData.thirdPlace"
                                :mode="matchMode(bracketData.thirdPlace)"
                                :mobile="true"
                                footer-tag="Petite finale"
                                footer-tag-variant="third">
                        </knockout-bracket-match>
                    </div>
                </div>

                <div class="knockoutBracketV-centerSide knockoutBracketV-centerSide--champion">
                    <div class="knockoutBracketV-championLabel">Champion</div>
                    <div class="knockoutBracketV-championBadge"
                            :class="{ 'knockoutBracketV-championBadge--pending': championFlag == null }">
                        <template v-if="championFlag">
                            <img class="knockoutBracketV-championFlag"
                                    :src="championFlag"
                                    @error="onFlagError"/>
                            <div class="knockoutBracketV-championName"
                                    :title="championTitle">{{ championCode }}</div>
                        </template>
                        <img v-else
                                class="knockoutBracketV-championUnknown"
                                src="/static/unknown-team.svg"
                                alt=""
                                :title="championTitle"/>
                    </div>
                </div>
            </div>
        </div>

        <div class="knockoutBracketV-between knockoutBracketV-between--center">
            <div class="knockoutBracketV-betweenStem"></div>
        </div>

        <div class="knockoutBracketV-half knockoutBracketV-half--bottom">
            <div class="knockoutBracketV-step"
                    v-for="round in bottomRounds"
                    track-by="phase">
                <div v-if="$index > 0"
                        class="knockoutBracketV-between">
                    <div v-if="betweenUsesMerge(bottomRounds[$index - 1].matches.length, round.matches.length)"
                            class="knockoutBracketV-betweenMerge knockoutBracketV-betweenMerge--splitUp">
                        <div class="knockoutBracketV-betweenStem"></div>
                        <div class="knockoutBracketV-betweenBar"></div>
                        <div class="knockoutBracketV-betweenArm knockoutBracketV-betweenArm--left"></div>
                        <div class="knockoutBracketV-betweenArm knockoutBracketV-betweenArm--right"></div>
                    </div>
                    <div v-else
                            class="knockoutBracketV-betweenCol"
                            :class="{ 'knockoutBracketV-betweenCol--expand': betweenUsesExpand(bottomRounds[$index - 1].matches.length, round.matches.length) }"
                            v-for="colIndex in betweenColCount(bottomRounds[$index - 1].matches.length, round.matches.length)"
                            track-by="$index">
                        <div class="knockoutBracketV-betweenStem"></div>
                        <div class="knockoutBracketV-betweenBar"></div>
                        <div v-if="betweenUsesExpand(bottomRounds[$index - 1].matches.length, round.matches.length)"
                                class="knockoutBracketV-betweenArm knockoutBracketV-betweenArm--innerLeft"></div>
                        <div v-if="betweenUsesExpand(bottomRounds[$index - 1].matches.length, round.matches.length)"
                                class="knockoutBracketV-betweenArm knockoutBracketV-betweenArm--innerRight"></div>
                    </div>
                </div>
                <div class="knockoutBracketV-stage"
                        :class="{ 'knockoutBracketV-stage--narrow': isNarrowRound(round) }">
                    <div class="knockoutBracketV-round"
                            :class="roundClass(round.matches.length)">
                        <div class="knockoutBracketV-pairCol"
                                v-for="pair in matchPairs(round.matches)"
                                track-by="$index">
                            <div class="knockoutBracketV-pairRow"
                                    :class="{ 'knockoutBracketV-pairRow--single': pair.length === 1 }">
                                <div class="knockoutBracketV-slot"
                                        v-for="match in pair"
                                        track-by="gameId">
                                    <knockout-bracket-match
                                            :key="match.gameId + '-' + effectiveMode"
                                            :match="match"
                                            :mode="matchMode(match)"
                                            :mobile="true">
                                    </knockout-bracket-match>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </div>
</template>

<script type="text/babel">
    import { flagSrc, onFlagError } from '../flagSrc'
    import { bracketTeamLabel, bracketTeamTitle, matchDisplayMode } from '../knockoutBracketLayout'
    import KnockoutBracketMatch from './KnockoutBracketMatch'

    export default {
        components: {
            KnockoutBracketMatch,
        },
        props: {
            bracketData: {
                type: Object,
                required: true,
            },
            effectiveMode: {
                type: String,
                required: true,
            },
            championTeam: {
                default: null,
            },
        },
        computed: {
            topRounds() {
                return this.bracketData.leftRounds.filter((round) => !this.isRoundOf16(round.phase))
            },
            bottomRounds() {
                return this.bracketData.rightRounds
                    .slice()
                    .reverse()
                    .filter((round) => !this.isRoundOf16(round.phase))
            },
            championFlag() {
                if (this.championTeam == null
                        || this.championTeam.type !== 'team'
                        || this.championTeam.countryCode == null) {
                    return null
                }

                return flagSrc(this.championTeam.countryCode)
            },
            championCode() {
                if (this.championTeam == null) {
                    return '?'
                }

                return bracketTeamLabel(this.championTeam)
            },
            championTitle() {
                if (this.championTeam == null) {
                    return 'À déterminer'
                }

                return bracketTeamTitle(this.championTeam)
            },
        },
        methods: {
            onFlagError,
            matchMode(match) {
                return matchDisplayMode(match, this.effectiveMode)
            },
            matchPairs(matches) {
                const pairs = []

                for (let index = 0; index < matches.length; index += 2) {
                    pairs.push(matches.slice(index, index + 2))
                }

                return pairs
            },
            roundClass(matchCount) {
                return `knockoutBracketV-round--${matchCount}`
            },
            betweenColCount(fromCount, toCount) {
                if (this.betweenUsesMerge(fromCount, toCount)) {
                    return 0
                }

                return Math.max(fromCount, toCount) / 2
            },
            betweenUsesMerge(fromCount, toCount) {
                return (fromCount === 2 && toCount === 1) || (fromCount === 1 && toCount === 2)
            },
            betweenUsesExpand(fromCount, toCount) {
                return fromCount === 2 && toCount === 4
            },
            isRoundOf16(phase) {
                return phase === '16èmes de finale'
            },
            isNarrowRound(round) {
                return round.phase === 'Demi-finale' || round.matches.length <= 1
            },
        },
    }
</script>

<style scoped>

    .knockoutBracketV {
        margin: 0 auto;
        max-width: 100%;
        padding: 4px 2px 8px;
        position: relative;
    }

    .knockoutBracketV-watermark {
        background: url('/static/wc2026-trophy.webp') center 48% / min(220px, 58vw) no-repeat;
        inset: 0;
        opacity: 0.1;
        pointer-events: none;
        position: absolute;
        z-index: 0;
    }

    .knockoutBracketV-content {
        position: relative;
        z-index: 1;
    }

    .knockoutBracketV-half {
        display: flex;
        flex-direction: column;
    }

    .knockoutBracketV-step {
        width: 100%;
    }

    .knockoutBracketV-stage {
        width: 100%;
    }

    .knockoutBracketV-stage--narrow {
        display: flex;
        justify-content: center;
    }

    .knockoutBracketV-stage--narrow .knockoutBracketV-round--1 {
        max-width: 172px;
        width: 100%;
    }

    .knockoutBracketV-round {
        display: flex;
        gap: 4px;
        width: 100%;
    }

    .knockoutBracketV-pairCol {
        flex: 1 1 0;
        min-width: 0;
    }

    .knockoutBracketV-pairRow {
        display: flex;
        gap: 4px;
    }

    .knockoutBracketV-pairRow--single {
        justify-content: center;
    }

    .knockoutBracketV-slot {
        flex: 1 1 0;
        min-width: 0;
    }

    .knockoutBracketV-between {
        display: flex;
        gap: 4px;
        height: 20px;
        width: 100%;
    }

    .knockoutBracketV-between--center {
        height: 16px;
        justify-content: center;
    }

    .knockoutBracketV-between--center .knockoutBracketV-betweenStem {
        position: relative;
    }

    .knockoutBracketV-betweenCol {
        flex: 1 1 0;
        min-width: 0;
        position: relative;
    }

    .knockoutBracketV-betweenBar {
        border-top: 1px solid #ccc;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
    }

    .knockoutBracketV-betweenStem {
        border-left: 1px solid #ccc;
        height: 100%;
        left: 50%;
        position: absolute;
        top: 0;
        transform: translateX(-50%);
        width: 0;
    }

    .knockoutBracketV-betweenArm {
        border-left: 1px solid #ccc;
        position: absolute;
        transform: translateX(-50%);
        width: 0;
    }

    .knockoutBracketV-betweenMerge {
        flex: 1 1 auto;
        height: 100%;
        position: relative;
        width: 100%;
    }

    .knockoutBracketV-betweenMerge--joinDown .knockoutBracketV-betweenBar {
        top: 0;
    }

    .knockoutBracketV-betweenMerge--joinDown .knockoutBracketV-betweenArm {
        height: 50%;
        top: 0;
    }

    .knockoutBracketV-betweenMerge--joinDown .knockoutBracketV-betweenArm--left {
        left: 25%;
    }

    .knockoutBracketV-betweenMerge--joinDown .knockoutBracketV-betweenArm--right {
        left: 75%;
    }

    .knockoutBracketV-betweenMerge--joinDown .knockoutBracketV-betweenStem {
        bottom: 0;
        height: 50%;
        top: auto;
    }

    .knockoutBracketV-betweenMerge--splitUp .knockoutBracketV-betweenStem {
        height: 50%;
        top: 0;
    }

    .knockoutBracketV-betweenMerge--splitUp .knockoutBracketV-betweenBar {
        border-top: none;
        border-bottom: 1px solid #ccc;
        bottom: 0;
        top: auto;
    }

    .knockoutBracketV-betweenMerge--splitUp .knockoutBracketV-betweenArm {
        bottom: 0;
        height: 50%;
    }

    .knockoutBracketV-betweenMerge--splitUp .knockoutBracketV-betweenArm--left {
        left: 25%;
    }

    .knockoutBracketV-betweenMerge--splitUp .knockoutBracketV-betweenArm--right {
        left: 75%;
    }

    .knockoutBracketV-betweenCol--expand .knockoutBracketV-betweenBar {
        border-top: none;
        border-bottom: 1px solid #ccc;
        bottom: 0;
        top: auto;
    }

    .knockoutBracketV-betweenCol--expand .knockoutBracketV-betweenStem {
        height: 50%;
        top: 0;
    }

    .knockoutBracketV-betweenCol--expand .knockoutBracketV-betweenArm--innerLeft {
        bottom: 0;
        height: 50%;
        left: 25%;
    }

    .knockoutBracketV-betweenCol--expand .knockoutBracketV-betweenArm--innerRight {
        bottom: 0;
        height: 50%;
        left: 75%;
    }

    .knockoutBracketV-center {
        margin: 2px 0;
        padding: 4px 0;
        width: 100%;
    }

    .knockoutBracketV-centerRow {
        align-items: stretch;
        display: flex;
        gap: 4px;
        justify-content: center;
        width: 100%;
    }

    .knockoutBracketV-centerMatches {
        display: flex;
        flex: 0 1 172px;
        flex-direction: column;
        gap: 4px;
        max-width: 172px;
        min-width: 0;
        width: 100%;
    }

    .knockoutBracketV-centerSide {
        min-width: 0;
    }

    .knockoutBracketV-centerMain {
        min-width: 0;
    }

    .knockoutBracketV-centerSide--third,
    .knockoutBracketV-centerMain {
        display: flex;
        flex-direction: column;
    }

    .knockoutBracketV-centerSide--champion {
        align-items: center;
        display: flex;
        flex: 0 0 88px;
        flex-direction: column;
        justify-content: flex-end;
        min-width: 0;
    }

    .knockoutBracketV-championLabel {
        color: #777;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.04em;
        margin-bottom: 6px;
        text-transform: uppercase;
    }

    .knockoutBracketV-championBadge {
        align-items: center;
        background: #fff;
        border: 2px solid #e6c200;
        border-radius: 8px;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 4px;
        justify-content: center;
        min-height: 72px;
        overflow: hidden;
        padding: 8px 6px;
        width: 100%;
    }

    .knockoutBracketV-championBadge--pending {
        padding: 0;
    }

    .knockoutBracketV-championUnknown {
        display: block;
        height: 100%;
        min-height: 72px;
        object-fit: cover;
        width: 100%;
    }

    .knockoutBracketV-championFlag {
        height: 26px;
        width: 40px;
    }

    .knockoutBracketV-championName {
        color: #333;
        font-size: 11px;
        font-weight: bold;
        text-align: center;
    }

    @media (min-width: 600px) and (max-width: 1023px) {
        .knockoutBracketV {
            max-width: 720px;
            padding-left: 8px;
            padding-right: 8px;
        }

        .knockoutBracketV-round,
        .knockoutBracketV-between,
        .knockoutBracketV-pairRow {
            gap: 6px;
        }

        .knockoutBracketV-centerRow {
            gap: 8px;
        }
    }

</style>
