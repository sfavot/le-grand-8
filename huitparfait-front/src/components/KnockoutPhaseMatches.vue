<template>
    <section v-if="phaseEntry != null" class="phaseMatches">
        <h2 class="phaseMatches-title">{{* phaseEntry.phaseLabel }}</h2>
        <p class="phaseMatches-meta">
            {{* phaseEntry.playedMatches }} / {{* phaseEntry.totalMatches }} matchs joués
            · {{* phaseEntry.predictedMatches }} / {{* phaseEntry.totalMatches }} matchs pronostiqués
        </p>

        <div v-if="hasBracketSides" class="phaseMatches-columns">
            <div class="phaseMatches-column"
                    :class="'phaseMatches-column--' + column.side"
                    v-for="column in bracketColumns"
                    track-by="side">
                <card-list wide class="phaseMatches-list">
                    <card wide class="phaseMatch" v-for="match in column.matches" track-by="gameId">
                        <div class="phaseMatch-header">
                            <span class="phaseMatch-name">{{* match.gameName }}</span>
                            <span v-if="matchDateLabel(match)" class="phaseMatch-date">{{* matchDateLabel(match) }}</span>
                        </div>

                        <div class="phaseMatch-body">
                            <div class="phaseMatch-team phaseMatch-team--home"
                                    :class="teamClass(match, 'A')">
                                <team-display side="home" :team="match.live.teamA"></team-display>
                            </div>

                            <div class="phaseMatch-center">
                                <template v-if="isMatchPlayed(match)">
                                    <div class="phaseMatch-score phaseMatch-score--live">
                                        {{* match.live.score.goalsA }} - {{* match.live.score.goalsB }}
                                    </div>
                                    <div v-if="hasPenalties(match.live.score)" class="phaseMatch-penalties">
                                        tab. {{* match.live.score.penaltiesA }} - {{* match.live.score.penaltiesB }}
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="phaseMatch-scoreRow">
                                        <span class="phaseMatch-scoreLabel">Selon tes pronos</span>
                                        <span class="phaseMatch-score">
                                            <template v-if="match.predictive.score">
                                                {{* match.predictive.score.goalsA }} - {{* match.predictive.score.goalsB }}
                                            </template>
                                            <span v-else class="phaseMatch-pending">—</span>
                                        </span>
                                    </div>
                                </template>
                            </div>

                            <div class="phaseMatch-team phaseMatch-team--away"
                                    :class="teamClass(match, 'B')">
                                <team-display side="away" :team="match.live.teamB"></team-display>
                            </div>
                        </div>
                    </card>
                </card-list>
            </div>
        </div>

        <card-list v-else wide class="phaseMatches-list">
            <card wide class="phaseMatch" v-for="match in phaseEntry.matches" track-by="gameId">
                <div class="phaseMatch-header">
                    <span class="phaseMatch-name">{{* match.gameName }}</span>
                    <span v-if="matchDateLabel(match)" class="phaseMatch-date">{{* matchDateLabel(match) }}</span>
                </div>

                <div class="phaseMatch-body">
                    <div class="phaseMatch-team phaseMatch-team--home"
                            :class="teamClass(match, 'A')">
                        <team-display side="home" :team="match.live.teamA"></team-display>
                    </div>

                    <div class="phaseMatch-center">
                        <template v-if="isMatchPlayed(match)">
                            <div class="phaseMatch-score phaseMatch-score--live">
                                {{* match.live.score.goalsA }} - {{* match.live.score.goalsB }}
                            </div>
                            <div v-if="hasPenalties(match.live.score)" class="phaseMatch-penalties">
                                tab. {{* match.live.score.penaltiesA }} - {{* match.live.score.penaltiesB }}
                            </div>
                        </template>
                        <template v-else>
                            <div class="phaseMatch-scoreRow">
                                <span class="phaseMatch-scoreLabel">Selon tes pronos</span>
                                <span class="phaseMatch-score">
                                    <template v-if="match.predictive.score">
                                        {{* match.predictive.score.goalsA }} - {{* match.predictive.score.goalsB }}
                                    </template>
                                    <span v-else class="phaseMatch-pending">—</span>
                                </span>
                            </div>
                        </template>
                    </div>

                    <div class="phaseMatch-team phaseMatch-team--away"
                            :class="teamClass(match, 'B')">
                        <team-display side="away" :team="match.live.teamB"></team-display>
                    </div>
                </div>
            </card>
        </card-list>
    </section>
</template>

<script type="text/babel">
    import { formatBracketMatchDate, scoreWinnerSide } from '../knockoutBracketLayout'
    import TeamDisplay from './TeamDisplay'

    export default {
        components: {
            TeamDisplay,
        },
        props: {
            phaseEntry: {
                default: null,
            },
            bracketSideMatches: {
                default: null,
            },
        },
        computed: {
            hasBracketSides() {
                return this.bracketSideMatches != null
                    && (this.bracketSideMatches.left.length > 0
                        || this.bracketSideMatches.right.length > 0)
            },
            bracketColumns() {
                if (!this.hasBracketSides) {
                    return []
                }

                return [
                    {
                        side: 'left',
                        matches: this.bracketSideMatches.left,
                    },
                    {
                        side: 'right',
                        matches: this.bracketSideMatches.right,
                    },
                ]
            },
        },
        methods: {
            matchDateLabel(match) {
                return formatBracketMatchDate(match.startsAt)
            },
            isMatchPlayed(match) {
                return match.live.score != null
            },
            hasPenalties(score) {
                return score.penaltiesA != null && score.penaltiesB != null
            },
            teamClass(match, side) {
                if (!this.isMatchPlayed(match)) {
                    return {}
                }

                const winnerSide = scoreWinnerSide(match.live.score, 'live')

                return {
                    'phaseMatch-team--winner': winnerSide === side,
                }
            },
        },
    }
</script>

<style scoped>

    .phaseMatches {
        margin-bottom: 10px;
    }

    .phaseMatches-title {
        color: #999;
        font-size: 20px;
        font-weight: bold;
        margin: 0;
        padding: 10px;
        text-transform: capitalize;
    }

    .phaseMatches-meta {
        color: #777;
        font-size: 12px;
        font-style: italic;
        margin: 0 0 8px 0;
        padding: 0 10px;
    }

    .phaseMatches-columns {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    @media (min-width: 900px) {
        .phaseMatches-columns {
            align-items: flex-start;
            flex-direction: row;
            gap: 16px;
        }

        .phaseMatches-column {
            flex: 1 1 0;
            min-width: 0;
        }
    }

    .phaseMatch {
        margin-bottom: 12px;
    }

    .phaseMatch-header {
        align-items: baseline;
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .phaseMatch-name {
        color: #333;
        font-size: 14px;
        font-weight: bold;
    }

    .phaseMatch-date {
        color: #888;
        font-size: 12px;
        font-style: italic;
    }

    .phaseMatch-body {
        align-items: center;
        display: flex;
        gap: 10px;
    }

    .phaseMatch-team {
        flex: 1 1 0;
        min-width: 0;
    }

    .phaseMatch-team--home {
        display: flex;
        justify-content: flex-end;
    }

    .phaseMatch-team--away {
        display: flex;
        justify-content: flex-start;
    }

    .phaseMatch-team--winner >>> .teamDisplay {
        font-weight: bold;
    }

    .phaseMatch-center {
        flex: 0 0 auto;
        min-width: 88px;
        text-align: center;
    }

    .phaseMatch-scoreRow {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .phaseMatch-scoreLabel {
        color: #888;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.03em;
        text-transform: uppercase;
    }

    .phaseMatch-score {
        color: #333;
        font-size: 16px;
        font-weight: bold;
    }

    .phaseMatch-score--live {
        color: #49996f;
        font-size: 18px;
    }

    .phaseMatch-pending {
        color: #bbb;
        font-weight: normal;
    }

    .phaseMatch-penalties {
        color: #777;
        font-size: 11px;
        margin-top: 4px;
    }

</style>
