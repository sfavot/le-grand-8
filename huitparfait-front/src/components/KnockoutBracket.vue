<template>
    <div class="knockoutBracket" v-if="bracketData != null">
        <div v-if="showPredictiveToggle" class="knockoutBracket-modeToggle">
            <btn class="knockoutBracket-modeBtn"
                    :class="{ 'knockoutBracket-modeBtn--active': mode === 'live' }"
                    @click="mode = 'live'">
                En direct
            </btn>
            <btn class="knockoutBracket-modeBtn"
                    :class="{ 'knockoutBracket-modeBtn--active': mode === 'predictive' }"
                    @click="mode = 'predictive'">
                Selon tes pronos
            </btn>
        </div>

        <div class="knockoutBracket-scroll knockoutBracket-boardWrap">
            <div class="knockoutBracket-watermark" aria-hidden="true"></div>
            <div class="knockoutBracket-board">

                <div class="knockoutBracket-side knockoutBracket-side--left">
                        <div class="knockoutBracket-round"
                                :class="roundColumnClass(round, 'left')"
                                v-for="round in leftRoundsWithIndex"
                                track-by="phase">
                        <div class="knockoutBracket-slot"
                                v-for="match in round.matches"
                                track-by="gameId"
                                :style="slotStyle($index, round.matches.length)">
                            <div class="knockoutBracket-connector"
                                    :class="connectorClass($index, round.matches.length, round.roundIndex, bracketData.leftRounds.length, 'left')">
                            </div>
                            <div class="knockoutBracket-matchCard">
                                <knockout-bracket-match
                                        :key="match.gameId + '-' + effectiveMode"
                                        :match="match"
                                        :mode="matchMode(match)"
                                        :compact="true">
                                </knockout-bracket-match>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="knockoutBracket-center">
                    <div class="knockoutBracket-champion">
                        <div class="knockoutBracket-championLabel">Champion</div>
                        <div class="knockoutBracket-championBadge"
                                :class="{ 'knockoutBracket-championBadge--pending': championFlag == null }">
                            <template v-if="championFlag">
                                <img class="knockoutBracket-championFlag"
                                        :src="championFlag"
                                        @error="onFlagError"/>
                                <div class="knockoutBracket-championCode"
                                        :title="championTitle">{{ championCode }}</div>
                            </template>
                            <img v-else
                                    class="knockoutBracket-championUnknown"
                                    src="/static/unknown-team.svg"
                                    alt=""
                                    :title="championTitle"/>
                        </div>
                    </div>

                    <div class="knockoutBracket-centerMatch knockoutBracket-centerMatch--final">
                        <div class="knockoutBracket-phaseTag knockoutBracket-phaseTag--final">Finale</div>
                        <knockout-bracket-match
                                :key="bracketData.final.gameId + '-' + effectiveMode"
                                :match="bracketData.final"
                                :mode="matchMode(bracketData.final)"
                                :compact="true">
                        </knockout-bracket-match>
                    </div>

                    <div v-if="bracketData.thirdPlace != null"
                            class="knockoutBracket-centerMatch knockoutBracket-centerMatch--third">
                        <div class="knockoutBracket-phaseTag knockoutBracket-phaseTag--third">Petite finale</div>
                        <knockout-bracket-match
                                :key="bracketData.thirdPlace.gameId + '-' + effectiveMode"
                                :match="bracketData.thirdPlace"
                                :mode="matchMode(bracketData.thirdPlace)"
                                :compact="true">
                        </knockout-bracket-match>
                    </div>
                </div>

                <div class="knockoutBracket-side knockoutBracket-side--right">
                        <div class="knockoutBracket-round"
                                :class="roundColumnClass(round, 'right')"
                                v-for="round in rightRoundsWithIndex"
                                track-by="phase">
                        <div class="knockoutBracket-slot"
                                v-for="match in round.matches"
                                track-by="gameId"
                                :style="slotStyle($index, round.matches.length)">
                            <div class="knockoutBracket-connector"
                                    :class="connectorClass($index, round.matches.length, round.roundIndex, bracketData.rightRounds.length, 'right')">
                            </div>
                            <div class="knockoutBracket-matchCard">
                                <knockout-bracket-match
                                        :key="match.gameId + '-' + effectiveMode"
                                        :match="match"
                                        :mode="matchMode(match)"
                                        :compact="true">
                                </knockout-bracket-match>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div class="knockoutBracket-verticalTree">
            <knockout-bracket-vertical
                    :bracket-data="bracketData"
                    :effective-mode="effectiveMode"
                    :champion-team="championTeam">
            </knockout-bracket-vertical>
        </div>
    </div>
</template>

<script type="text/babel">
    import { flagSrc, onFlagError } from '../flagSrc'
    import {
        bracketSlotStyle,
        bracketTeamLabel,
        bracketTeamTitle,
        buildKnockoutBracketData,
    } from '../knockoutBracketLayout'
    import KnockoutBracketMatch from './KnockoutBracketMatch'
    import KnockoutBracketVertical from './KnockoutBracketVertical'

    export default {
        components: {
            KnockoutBracketMatch,
            KnockoutBracketVertical,
        },
        props: {
            allGames: {
                type: Array,
                default: null,
            },
            bracketMap: {
                default: null,
            },
            showPredictiveToggle: {
                type: Boolean,
                default: true,
            },
        },
        data() {
            return {
                mode: 'live',
            }
        },
        computed: {
            bracketData() {
                return buildKnockoutBracketData(this.allGames, this.bracketMap)
            },
            rightRoundsReversed() {
                if (this.bracketData == null) {
                    return []
                }

                return this.bracketData.rightRounds.slice().reverse()
            },
            leftRoundsWithIndex() {
                if (this.bracketData == null) {
                    return []
                }

                return this.bracketData.leftRounds.map((round, roundIndex) => Object.assign({}, round, { roundIndex }))
            },
            rightRoundsWithIndex() {
                return this.rightRoundsReversed.map((round, roundIndex) => Object.assign({}, round, { roundIndex }))
            },
            championTeam() {
                if (this.bracketData == null) {
                    return null
                }

                return this.bracketData.getChampion(this.effectiveMode)
            },
            effectiveMode() {
                return this.showPredictiveToggle ? this.mode : 'live'
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
            slotStyle(index, matchCount) {
                if (this.bracketData == null) {
                    return {}
                }

                return bracketSlotStyle(index, matchCount, this.bracketData.leafCount)
            },
            matchMode(match) {
                if (this.effectiveMode === 'predictive') {
                    return 'predictive'
                }

                return 'live'
            },
            connectorClass(index, matchCount, roundIndex, totalRounds, side) {
                const isFirstRound = roundIndex === 0
                const isLastRound = roundIndex === totalRounds - 1
                const isLeafRound = side === 'left' ? isFirstRound : isLastRound
                const isSemiRound = side === 'left' ? isLastRound : isFirstRound
                const isPairTop = !isLeafRound
                    && !isSemiRound
                    && index % 2 === 0
                    && index + 1 < matchCount

                return {
                    [`knockoutBracket-connector--${side}`]: true,
                    'knockoutBracket-connector--leaf': isLeafRound,
                    'knockoutBracket-connector--semi': isSemiRound,
                    'knockoutBracket-connector--pairTop': isPairTop,
                }
            },
            roundColumnClass(round, side) {
                const isLeaf = side === 'left'
                    ? round.roundIndex === 0
                    : round.roundIndex === this.rightRoundsWithIndex.length - 1

                return {
                    'knockoutBracket-round--leaf': isLeaf,
                }
            },
        },
    }
</script>

<style scoped>

    .knockoutBracket {
        --bracket-row-height: 80px;
        --bracket-round-width: 130px;
        --bracket-leaf-width: 172px;
        margin-bottom: 15px;
    }

    .knockoutBracket-modeToggle {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 12px;
    }

    .btn.knockoutBracket-modeBtn {
        margin: 0;
    }

    .btn.knockoutBracket-modeBtn.knockoutBracket-modeBtn--active {
        background: #4db788;
        border-color: #49996f;
        box-shadow: 0 2px 0 #49996f;
        color: #fff;
    }

    .knockoutBracket-boardWrap {
        position: relative;
    }

    .knockoutBracket-watermark {
        background: url('/static/wc2026-trophy.webp') center 42% / min(280px, 34vw) no-repeat;
        inset: 0;
        opacity: 0.1;
        pointer-events: none;
        position: absolute;
        z-index: 0;
    }

    .knockoutBracket-board {
        display: inline-flex;
        flex-shrink: 0;
        gap: 0;
        padding: 8px 12px 16px;
        position: relative;
        text-align: left;
        vertical-align: top;
        width: max-content;
        z-index: 1;
    }

    .knockoutBracket-scroll {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;
        text-align: center;
        width: 100%;
    }

    .knockoutBracket-side {
        display: flex;
        flex: 0 0 auto;
        flex-shrink: 0;
        gap: 10px;
    }

    .knockoutBracket-side--left {
        justify-content: flex-end;
        margin-right: 6px;
    }

    .knockoutBracket-side--right {
        justify-content: flex-start;
        margin-left: 6px;
    }

    .knockoutBracket-round {
        display: grid;
        flex: 0 0 var(--bracket-round-width);
        flex-shrink: 0;
        grid-template-rows: repeat(8, var(--bracket-row-height));
        position: relative;
        width: var(--bracket-round-width);
    }

    .knockoutBracket-round--leaf {
        flex-basis: var(--bracket-leaf-width);
        width: var(--bracket-leaf-width);
    }

    .knockoutBracket-round--leaf >>> .bracketMatch-label {
        line-height: 1.15;
        white-space: normal;
    }

    .knockoutBracket-slot {
        align-items: center;
        align-self: stretch;
        display: flex;
        height: 100%;
        min-height: 0;
        overflow: visible;
        position: relative;
    }

    .knockoutBracket-matchCard {
        position: relative;
        width: 100%;
        z-index: 1;
    }

    .knockoutBracket-connector {
        pointer-events: none;
        position: absolute;
        top: 0;
        z-index: 0;
    }

    .knockoutBracket-connector--left {
        height: 100%;
        right: -5px;
        width: 10px;
    }

    .knockoutBracket-connector--right {
        height: 100%;
        left: -5px;
        width: 10px;
    }

    .knockoutBracket-connector--left::before,
    .knockoutBracket-connector--right::before {
        border-top: 1px solid #ccc;
        content: '';
        position: absolute;
        top: 50%;
        width: 100%;
    }

    .knockoutBracket-connector--left::before {
        left: 0;
    }

    .knockoutBracket-connector--right::before {
        right: 0;
    }

    .knockoutBracket-connector--leaf::before,
    .knockoutBracket-connector--semi::before {
        display: block;
    }

    .knockoutBracket-connector--semi.knockoutBracket-connector--left {
        right: -8px;
        width: 14px;
    }

    .knockoutBracket-connector--semi.knockoutBracket-connector--right {
        left: -8px;
        width: 14px;
    }

    .knockoutBracket-connector--left.knockoutBracket-connector--pairTop {
        border-right: 1px solid #ccc;
        border-top: 1px solid #ccc;
        border-top-right-radius: 4px;
        height: 50%;
        top: 50%;
    }

    .knockoutBracket-connector--left.knockoutBracket-connector--pairTop::before {
        display: none;
    }

    .knockoutBracket-connector--left:not(.knockoutBracket-connector--pairTop):not(.knockoutBracket-connector--leaf):not(.knockoutBracket-connector--semi) {
        border-bottom: 1px solid #ccc;
        border-bottom-right-radius: 4px;
        border-right: 1px solid #ccc;
        height: 50%;
        top: 0;
    }

    .knockoutBracket-connector--left:not(.knockoutBracket-connector--pairTop):not(.knockoutBracket-connector--leaf):not(.knockoutBracket-connector--semi)::before {
        display: none;
    }

    .knockoutBracket-connector--right.knockoutBracket-connector--pairTop {
        border-left: 1px solid #ccc;
        border-top: 1px solid #ccc;
        border-top-left-radius: 4px;
        height: 50%;
        top: 50%;
    }

    .knockoutBracket-connector--right.knockoutBracket-connector--pairTop::before {
        display: none;
    }

    .knockoutBracket-connector--right:not(.knockoutBracket-connector--pairTop):not(.knockoutBracket-connector--leaf):not(.knockoutBracket-connector--semi) {
        border-bottom: 1px solid #ccc;
        border-bottom-left-radius: 4px;
        border-left: 1px solid #ccc;
        height: 50%;
        top: 0;
    }

    .knockoutBracket-connector--right:not(.knockoutBracket-connector--pairTop):not(.knockoutBracket-connector--leaf):not(.knockoutBracket-connector--semi)::before {
        display: none;
    }

    .knockoutBracket-center {
        align-items: stretch;
        display: flex;
        flex: 0 0 172px;
        flex-shrink: 0;
        flex-direction: column;
        gap: 20px;
        justify-content: center;
        padding: 8px 4px;
    }

    .knockoutBracket-champion {
        align-items: center;
        display: flex;
        flex-direction: column;
    }

    .knockoutBracket-championLabel {
        color: #777;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 0.04em;
        margin-bottom: 6px;
        text-transform: uppercase;
    }

    .knockoutBracket-championBadge {
        align-items: center;
        background: #fff;
        border: 2px solid #e6c200;
        border-radius: 8px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 72px;
        justify-content: center;
        overflow: hidden;
        padding: 8px 12px;
        width: 100%;
    }

    .knockoutBracket-championBadge--pending {
        padding: 0;
    }

    .knockoutBracket-championUnknown {
        display: block;
        height: 100%;
        min-height: 72px;
        object-fit: cover;
        width: 100%;
    }

    .knockoutBracket-championFlag {
        height: 28px;
        width: 42px;
    }

    .knockoutBracket-championCode {
        color: #333;
        font-size: 13px;
        font-weight: bold;
    }

    .knockoutBracket-centerMatch {
        align-items: stretch;
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
    }

    .knockoutBracket-phaseTag {
        align-self: center;
        border-radius: 4px;
        color: #fff;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.03em;
        margin: 0;
        padding: 2px 8px;
        position: static;
        text-transform: uppercase;
        transform: none;
        white-space: nowrap;
    }

    .knockoutBracket-phaseTag--final {
        background: #e6a800;
    }

    .knockoutBracket-phaseTag--third {
        background: #5b8def;
    }

    .knockoutBracket-verticalTree {
        display: none;
    }

    @media (max-width: 1023px) {
        .knockoutBracket-boardWrap {
            display: none;
        }

        .knockoutBracket-verticalTree {
            display: block;
        }
    }

</style>
