<template>
    <div class="bracketMatchRoot">
    <div v-if="mobile"
            class="bracketMatch bracketMatch--mobile"
            :class="mobileClass">
        <div class="bracketMatch-mobileGrid">
            <div class="bracketMatch-mobileTeam"
                    :class="teamClass('A')"
                    :title="teamTitle('A')">
                <img class="bracketMatch-mobileIcon"
                        :src="teamIcon('A')"
                        @error="onFlagError"/>
                <span v-if="showMobileLabel('A')" class="bracketMatch-mobileCode">{{ teamMobileLabel('A') }}</span>
                <span v-if="teamScore('A') != null" class="bracketMatch-mobileScore">{{ teamScore('A') }}</span>
            </div>
            <div class="bracketMatch-mobileTeam"
                    :class="teamClass('B')"
                    :title="teamTitle('B')">
                <img class="bracketMatch-mobileIcon"
                        :src="teamIcon('B')"
                        @error="onFlagError"/>
                <span v-if="showMobileLabel('B')" class="bracketMatch-mobileCode">{{ teamMobileLabel('B') }}</span>
                <span v-if="teamScore('B') != null" class="bracketMatch-mobileScore">{{ teamScore('B') }}</span>
            </div>
        </div>
        <div v-if="footerTag" class="bracketMatch-footerTag" :class="footerTagClass">{{* footerTag }}</div>
        <div v-else class="bracketMatch-date">{{ matchDateShortLabel }}</div>
    </div>

    <div v-else
            class="bracketMatch"
            :class="{ 'bracketMatch--expanded': expanded, 'bracketMatch--compact': compact }">
        <div class="bracketMatch-team"
                :class="teamClass('A')"
                :title="teamTitle('A')">
            <img v-if="teamFlag('A')"
                    class="bracketMatch-flag"
                    :src="teamFlag('A')"
                    @error="onFlagError"/>
            <span class="bracketMatch-label">{{ teamLabel('A') }}</span>
            <span v-if="teamScore('A') != null" class="bracketMatch-score">{{ teamScore('A') }}</span>
        </div>
        <div class="bracketMatch-team"
                :class="teamClass('B')"
                :title="teamTitle('B')">
            <img v-if="teamFlag('B')"
                    class="bracketMatch-flag"
                    :src="teamFlag('B')"
                    @error="onFlagError"/>
            <span class="bracketMatch-label">{{ teamLabel('B') }}</span>
            <span v-if="teamScore('B') != null" class="bracketMatch-score">{{ teamScore('B') }}</span>
        </div>
        <div class="bracketMatch-date">{{ matchDateLabel }}</div>
    </div>
    </div>
</template>

<script type="text/babel">
    import { flagSrc, onFlagError } from '../flagSrc'
    import {
        bracketTeamLabel,
        bracketTeamMobileLabel,
        bracketTeamTitle,
        formatBracketMatchDate,
        formatBracketMatchDateShort,
        scoreWinnerSide,
        toDisplayTeam,
    } from '../knockoutBracketLayout'

    const UNKNOWN_TEAM_ICON = '/static/unknown-team.svg'

    export default {
        props: {
            match: {
                type: Object,
                required: true,
            },
            mode: {
                type: String,
                required: true,
            },
            expanded: {
                type: Boolean,
                default: false,
            },
            compact: {
                type: Boolean,
                default: false,
            },
            mobile: {
                type: Boolean,
                default: false,
            },
            hideTeamNames: {
                type: Boolean,
                default: false,
            },
            footerTag: {
                type: String,
                default: null,
            },
            footerTagVariant: {
                type: String,
                default: null,
            },
        },
        computed: {
            sideData() {
                return this.match[this.mode]
            },
            matchDateLabel() {
                return formatBracketMatchDate(this.match.startsAt)
            },
            matchDateShortLabel() {
                return formatBracketMatchDateShort(this.match.startsAt)
            },
            mobileClass() {
                return {
                    'bracketMatch--hideNames': this.hideTeamNames,
                }
            },
            footerTagClass() {
                if (this.footerTagVariant === 'final') {
                    return 'bracketMatch-footerTag--final'
                }

                if (this.footerTagVariant === 'third') {
                    return 'bracketMatch-footerTag--third'
                }

                return null
            },
        },
        methods: {
            onFlagError,
            team(side) {
                return side === 'A' ? this.sideData.teamA : this.sideData.teamB
            },
            teamLabel(side) {
                return bracketTeamLabel(this.team(side))
            },
            teamMobileLabel(side) {
                return bracketTeamMobileLabel(this.team(side))
            },
            teamTitle(side) {
                return bracketTeamTitle(this.team(side))
            },
            teamFlag(side) {
                const displayTeam = toDisplayTeam(this.team(side))
                if (displayTeam == null || displayTeam.countryCode == null) {
                    return null
                }

                return flagSrc(displayTeam.countryCode)
            },
            teamIcon(side) {
                return this.teamFlag(side) || UNKNOWN_TEAM_ICON
            },
            showMobileLabel(side) {
                if (!this.hideTeamNames) {
                    return true
                }

                return toDisplayTeam(this.team(side)) == null
            },
            teamScore(side) {
                const score = this.sideData.score
                if (score == null) {
                    return null
                }

                return side === 'A' ? score.goalsA : score.goalsB
            },
            teamClass(side) {
                const winnerSide = scoreWinnerSide(this.sideData.score, this.mode)
                const team = this.team(side)
                const isSlot = team != null && team.type === 'slot' && toDisplayTeam(team) == null

                return {
                    'bracketMatch-team--winner': winnerSide === side,
                    'bracketMatch-team--slot': isSlot,
                    'bracketMatch-mobileTeam--winner': winnerSide === side,
                    'bracketMatch-mobileTeam--slot': isSlot,
                }
            },
        },
    }
</script>

<style scoped>

    .bracketMatchRoot {
        min-width: 0;
    }

    .bracketMatch {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        overflow: hidden;
    }

    .bracketMatch-team {
        align-items: center;
        border-bottom: 1px solid #eee;
        display: flex;
        gap: 4px;
        min-height: 24px;
        padding: 3px 6px;
    }

    .bracketMatch-team:last-of-type {
        border-bottom: none;
    }

    .bracketMatch-team--winner {
        background: #f0faf5;
        font-weight: bold;
    }

    .bracketMatch-team--slot .bracketMatch-label {
        color: #777;
        font-style: italic;
    }

    .bracketMatch-flag {
        flex-shrink: 0;
        height: 14px;
        width: 20px;
    }

    .bracketMatch-label {
        color: #333;
        flex: 1 1 0;
        font-size: 10px;
        line-height: 1.2;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .bracketMatch-score {
        color: #49996f;
        flex-shrink: 0;
        font-size: 12px;
        font-weight: bold;
        min-width: 12px;
        text-align: right;
    }

    .bracketMatch-date {
        background: #f8f8f8;
        color: #888;
        font-size: 10px;
        padding: 2px 6px 3px;
        text-align: center;
    }

    .bracketMatch--compact .bracketMatch-team {
        min-height: 22px;
        padding: 2px 5px;
    }

    .bracketMatch--compact .bracketMatch-date {
        font-size: 9px;
        padding: 1px 5px 2px;
    }

    .bracketMatch--expanded .bracketMatch-team {
        gap: 8px;
        min-height: 32px;
        padding: 6px 10px;
    }

    .bracketMatch--expanded .bracketMatch-flag {
        height: 18px;
        width: 28px;
    }

    .bracketMatch--expanded .bracketMatch-label {
        font-size: 13px;
        white-space: normal;
    }

    .bracketMatch--expanded .bracketMatch-score {
        font-size: 14px;
    }

    .bracketMatch--expanded .bracketMatch-date {
        font-size: 11px;
        padding: 4px 10px 5px;
    }

    .bracketMatch--mobile {
        text-align: center;
    }

    .bracketMatch-mobileGrid {
        display: grid;
        gap: 2px 4px;
        grid-template-columns: 1fr 1fr;
        padding: 6px 4px 4px;
    }

    .bracketMatch-mobileTeam {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        padding: 2px 1px;
    }

    .bracketMatch-mobileTeam--winner {
        background: #f0faf5;
        border-radius: 4px;
    }

    .bracketMatch-mobileIcon {
        display: block;
        height: 22px;
        object-fit: contain;
        width: 30px;
    }

    .bracketMatch-mobileCode {
        color: #333;
        font-size: 9px;
        font-weight: bold;
        line-height: 1.1;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .bracketMatch-mobileTeam--slot .bracketMatch-mobileCode {
        color: #777;
        font-style: italic;
        font-weight: normal;
    }

    .bracketMatch-mobileScore {
        color: #49996f;
        font-size: 11px;
        font-weight: bold;
        line-height: 1;
    }

    .bracketMatch--hideNames .bracketMatch-mobileGrid {
        padding-bottom: 2px;
    }

    .bracketMatch--hideNames .bracketMatch-mobileIcon {
        height: 20px;
        width: 28px;
    }

    .bracketMatch--mobile .bracketMatch-date {
        font-size: 9px;
        padding: 3px 4px 4px;
    }

    .bracketMatch-footerTag {
        color: #fff;
        font-size: 8px;
        font-weight: bold;
        letter-spacing: 0.03em;
        padding: 3px 4px 4px;
        text-transform: uppercase;
    }

    .bracketMatch-footerTag--final {
        background: #e6a800;
    }

    .bracketMatch-footerTag--third {
        background: #5b8def;
    }

</style>
