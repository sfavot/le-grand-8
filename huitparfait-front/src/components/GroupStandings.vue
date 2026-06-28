<template>
    <div class="page--results" :class="{ 'page--results--knockout': displayedPhase === 'knockout' }">

        <card-title>Résultats</card-title>

        <card v-if="predictionsAllGames == null" class="results-empty">
            <p>Chargement des matchs…</p>
        </card>

        <template v-else>
            <div v-if="showPhaseTabs" class="results-tabs">
                <btn class="results-tab"
                        :class="{ 'results-tab--active': activeTab === 'groups' }"
                        @click="activeTab = 'groups'">
                    Phase de groupes
                </btn>
                <btn class="results-tab"
                        :class="{ 'results-tab--active': activeTab === 'knockout' }"
                        @click="activeTab = 'knockout'">
                    Phase finale
                </btn>
            </div>

            <template v-if="displayedPhase === 'groups'">
            <section v-if="groupEntries.length > 0" class="results-section">
                <card-list wide class="results-list">
                    <card wide class="results-card" v-for="entry in groupEntries" track-by="group">
                        <h3 class="results-groupTitle">Groupe {{* entry.group }}</h3>

                        <div class="results-tables"
                                :class="{ 'results-tables--single': isPhaseComplete(entry.playedGames, entry.totalGames) }">
                            <section class="results-tableSection">
                                <h4 class="results-tableSectionTitle">En direct</h4>
                                <p class="results-meta">
                                    {{* entry.playedGames }} / {{* entry.totalGames }} matchs joués
                                </p>
                                <table class="results-table">
                                    <thead>
                                        <tr>
                                            <th class="col-rank">#</th>
                                            <th class="col-team">Équipe</th>
                                            <th>J</th>
                                            <th>G</th>
                                            <th>N</th>
                                            <th>P</th>
                                            <th>BP</th>
                                            <th>BC</th>
                                            <th>Diff</th>
                                            <th>Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="row in entry.live"
                                                :class="standingRowClass(row.rank)"
                                                track-by="team.id">
                                            <td class="col-rank">{{* row.rank }}</td>
                                            <td class="col-team">
                                                <img v-if="row.team.countryCode"
                                                        class="flag"
                                                        :src="flagSrc(row.team.countryCode)"
                                                        @error="onFlagError"/>
                                                <span>{{* row.team.countryName }}</span>
                                            </td>
                                            <td>{{* row.played }}</td>
                                            <td>{{* row.won }}</td>
                                            <td>{{* row.drawn }}</td>
                                            <td>{{* row.lost }}</td>
                                            <td>{{* row.goalsFor }}</td>
                                            <td>{{* row.goalsAgainst }}</td>
                                            <td>{{* row.goalDifference }}</td>
                                            <td class="col-points">{{* row.points }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>

                            <section v-if="!isPhaseComplete(entry.playedGames, entry.totalGames)"
                                    class="results-tableSection">
                                <h4 class="results-tableSectionTitle">Selon tes pronos</h4>
                                <p class="results-meta">
                                    {{* entry.predictedGames }} / {{* entry.totalGames }} matchs renseignés
                                </p>
                                <table class="results-table">
                                    <thead>
                                        <tr>
                                            <th class="col-rank">#</th>
                                            <th class="col-team">Équipe</th>
                                            <th>J</th>
                                            <th>G</th>
                                            <th>N</th>
                                            <th>P</th>
                                            <th>BP</th>
                                            <th>BC</th>
                                            <th>Diff</th>
                                            <th>Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="row in entry.predictive"
                                                :class="standingRowClass(row.rank)"
                                                track-by="team.id">
                                            <td class="col-rank">{{* row.rank }}</td>
                                            <td class="col-team">
                                                <img v-if="row.team.countryCode"
                                                        class="flag"
                                                        :src="flagSrc(row.team.countryCode)"
                                                        @error="onFlagError"/>
                                                <span>{{* row.team.countryName }}</span>
                                            </td>
                                            <td>{{* row.played }}</td>
                                            <td>{{* row.won }}</td>
                                            <td>{{* row.drawn }}</td>
                                            <td>{{* row.lost }}</td>
                                            <td>{{* row.goalsFor }}</td>
                                            <td>{{* row.goalsAgainst }}</td>
                                            <td>{{* row.goalDifference }}</td>
                                            <td class="col-points">{{* row.points }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        </div>
                    </card>
                </card-list>
            </section>

            <third-place-ranking
                v-if="showThirdPlaceRanking"
                :live-entries="thirdPlaceLiveEntries"
                :predictive-entries="thirdPlacePredictiveEntries"
                :expected-group-count="expectedGroupCount"
                :show-predictive="!isGroupPhaseComplete">
            </third-place-ranking>
            </template>

            <template v-if="displayedPhase === 'knockout'">
            <section v-if="knockoutPhaseEntries.length > 0" class="results-section results-section--bracket">
                <div class="results-sectionHeader">
                    <h2 class="results-sectionTitle">Tableau des phases finales</h2>
                    <div class="results-metaRow">
                        <p class="results-meta">
                            {{* knockoutPlayedMatches }} / {{* knockoutTotalMatches }} matchs joués
                        </p>
                        <p v-if="!isKnockoutComplete" class="results-meta">
                            {{* knockoutPredictedMatches }} / {{* knockoutTotalMatches }} matchs pronostiqués
                        </p>
                    </div>
                </div>
                <card wide class="results-card results-card--bracket">
                    <knockout-bracket
                            :all-games="predictionsAllGames"
                            :bracket-map="bracketMap"
                            :show-predictive-toggle="!isKnockoutComplete">
                    </knockout-bracket>
                </card>
            </section>

            <knockout-phase-matches
                    v-if="roundOf32Entry != null"
                    :phase-entry="roundOf32Entry"
                    :bracket-side-matches="roundOf32BracketSides">
            </knockout-phase-matches>
            </template>

            <card v-if="!showGroupsContent && !showKnockoutContent" class="results-empty">
                <p>Aucun résultat disponible pour le moment.</p>
            </card>
        </template>

    </div>
</template>

<script type="text/babel">
    import store from '../state/configureStore'
    import { fetchAllPredictionsGames } from '../state/actions/predictions'
    import { flagSrc, onFlagError } from '../flagSrc'
    import {
        computeAllGroupStandings,
        listGroupPhaseGroups,
        rankLiveThirdPlacedTeams,
        rankPredictiveThirdPlacedTeams,
    } from '../bracket-shared/groupStandings'
    import { enrichGamesWithBracket } from '../bracketUtils'
    import { buildKnockoutBracketData, splitRoundOf16MatchesByBracket } from '../knockoutBracketLayout'
    import { buildKnockoutPhaseEntries, isPhaseResultsComplete } from '../resultsUtils'
    import ThirdPlaceRanking from './ThirdPlaceRanking'
    import KnockoutBracket from './KnockoutBracket'
    import KnockoutPhaseMatches from './KnockoutPhaseMatches'

    export default {
        components: {
            ThirdPlaceRanking,
            KnockoutBracket,
            KnockoutPhaseMatches,
        },
        data() {
            return {
                predictionsAllGames: this.$select('predictionsAllGames'),
                activeTab: 'groups',
            }
        },
        computed: {
            bracketMap() {
                if (this.predictionsAllGames == null) {
                    return null
                }

                return enrichGamesWithBracket(this.predictionsAllGames)
            },
            groupEntries() {
                if (this.predictionsAllGames == null) {
                    return []
                }

                const standingsByGroup = computeAllGroupStandings(this.predictionsAllGames)
                const groups = listGroupPhaseGroups(this.predictionsAllGames)

                return groups.map((group) => {
                    const entry = standingsByGroup[group]
                    return {
                        group,
                        live: entry.live,
                        predictive: entry.predictive,
                        playedGames: entry.playedGames,
                        predictedGames: entry.predictedGames,
                        totalGames: entry.totalGames,
                    }
                })
            },
            knockoutPhaseEntries() {
                if (this.predictionsAllGames == null) {
                    return []
                }

                return buildKnockoutPhaseEntries(this.predictionsAllGames, this.bracketMap)
            },
            roundOf32Entry() {
                return this.knockoutPhaseEntries.find((entry) => entry.phase === '16èmes de finale') || null
            },
            knockoutBracketData() {
                return buildKnockoutBracketData(this.predictionsAllGames, this.bracketMap)
            },
            roundOf32BracketSides() {
                if (this.roundOf32Entry == null) {
                    return null
                }

                return splitRoundOf16MatchesByBracket(
                    this.roundOf32Entry.matches,
                    this.knockoutBracketData,
                )
            },
            expectedGroupCount() {
                if (this.predictionsAllGames == null) {
                    return 12
                }

                return listGroupPhaseGroups(this.predictionsAllGames).length
            },
            showThirdPlaceRanking() {
                return this.expectedGroupCount >= 4
                    && (this.thirdPlaceLiveEntries.length > 0
                        || this.thirdPlacePredictiveEntries.length > 0)
            },
            thirdPlaceLiveEntries() {
                if (this.predictionsAllGames == null) {
                    return []
                }

                return rankLiveThirdPlacedTeams(this.predictionsAllGames)
            },
            thirdPlacePredictiveEntries() {
                if (this.predictionsAllGames == null) {
                    return []
                }

                return rankPredictiveThirdPlacedTeams(this.predictionsAllGames)
            },
            isGroupPhaseComplete() {
                if (this.groupEntries.length === 0) {
                    return false
                }

                return this.groupEntries.every((entry) => isPhaseResultsComplete(
                    entry.playedGames,
                    entry.totalGames,
                ))
            },
            isKnockoutComplete() {
                if (this.knockoutPhaseEntries.length === 0) {
                    return false
                }

                return this.knockoutPhaseEntries.every((phase) => isPhaseResultsComplete(
                    phase.playedMatches,
                    phase.totalMatches,
                ))
            },
            knockoutTotalMatches() {
                return this.knockoutPhaseEntries.reduce(
                    (total, phase) => total + phase.totalMatches,
                    0,
                )
            },
            knockoutPlayedMatches() {
                return this.knockoutPhaseEntries.reduce(
                    (total, phase) => total + phase.playedMatches,
                    0,
                )
            },
            knockoutPredictedMatches() {
                return this.knockoutPhaseEntries.reduce(
                    (total, phase) => total + phase.predictedMatches,
                    0,
                )
            },
            showGroupsContent() {
                return this.groupEntries.length > 0 || this.showThirdPlaceRanking
            },
            showKnockoutContent() {
                return this.knockoutPhaseEntries.length > 0
            },
            showPhaseTabs() {
                return this.showGroupsContent && this.showKnockoutContent
            },
            displayedPhase() {
                if (this.showPhaseTabs) {
                    return this.activeTab
                }

                if (this.showKnockoutContent && !this.showGroupsContent) {
                    return 'knockout'
                }

                return 'groups'
            },
        },
        watch: {
            showGroupsContent(hasGroups) {
                if (!hasGroups && this.activeTab === 'groups' && this.showKnockoutContent) {
                    this.activeTab = 'knockout'
                }
            },
            showKnockoutContent(hasKnockout) {
                if (!hasKnockout && this.activeTab === 'knockout' && this.showGroupsContent) {
                    this.activeTab = 'groups'
                }
            },
        },
        route: {
            data() {
                return store.dispatch(fetchAllPredictionsGames())
                    .then(() => this.setInitialActiveTab())
            },
        },
        methods: {
            setInitialActiveTab() {
                if (this.isGroupPhaseComplete && this.showKnockoutContent) {
                    this.activeTab = 'knockout'
                    return
                }

                if (this.showGroupsContent) {
                    this.activeTab = 'groups'
                    return
                }

                if (this.showKnockoutContent) {
                    this.activeTab = 'knockout'
                }
            },
            flagSrc,
            onFlagError,
            standingRowClass(rank) {
                return {
                    'results-row--qualified': rank <= 2,
                    'results-row--third': rank === 3,
                }
            },
            isPhaseComplete(playedCount, totalCount) {
                return isPhaseResultsComplete(playedCount, totalCount)
            },
        },
    }
</script>

<style scoped>

    .page--results {
        padding-bottom: 20px;
    }

    @media (min-width: 850px) {
        .page--results--knockout {
            box-sizing: border-box;
            margin-left: -10px;
            margin-right: -10px;
            padding-left: 10px;
            padding-right: 10px;
            width: calc(100% + 20px);
        }
    }

    @media (min-width: 1320px) {
        .page--results--knockout {
            margin-left: -30px;
            margin-right: -30px;
            padding-left: 30px;
            padding-right: 30px;
            width: calc(100% + 60px);
        }
    }

    .results-empty {
        margin: 0 8px 15px 8px;
    }

    .results-empty p {
        margin: 0;
        text-align: center;
        color: #555;
        font-style: italic;
    }

    .results-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin: 0 8px 16px 8px;
    }

    @media (min-width: 500px) {
        .results-tabs {
            justify-content: flex-start;
        }
    }

    .btn.results-tab {
        margin: 0;
    }

    .btn.results-tab.results-tab--active {
        background: #4db788;
        border-color: #49996f;
        box-shadow: 0 2px 0 #49996f;
        color: #fff;
    }

    .results-section {
        margin-bottom: 10px;
    }

    .results-sectionTitle {
        color: #999;
        font-size: 20px;
        font-weight: bold;
        margin: 0;
        padding: 10px;
        text-transform: capitalize;
    }

    .results-sectionHeader .results-sectionTitle {
        padding-bottom: 4px;
    }

    .results-metaRow {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 0 10px 10px 10px;
    }

    .results-metaRow .results-meta {
        margin: 0;
    }

    .results-card {
        margin-bottom: 15px;
    }

    .results-card--bracket {
        box-sizing: border-box;
        padding-bottom: 8px;
    }

    @media (min-width: 500px) {
        .page--results--knockout .results-card--bracket {
            margin-left: 0;
            margin-right: 0;
            width: 100%;
        }
    }

    .results-groupTitle {
        color: #49996f;
        font-size: 18px;
        margin: 0 0 12px 0;
    }

    .results-tables {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    @media (min-width: 900px) {
        .results-tables {
            flex-direction: row;
            align-items: flex-start;
        }

        .results-tableSection {
            flex: 1 1 0;
            min-width: 0;
        }

        .results-tables--single .results-tableSection {
            flex-basis: 100%;
            max-width: 100%;
        }
    }

    .results-tableSectionTitle {
        font-size: 15px;
        margin: 0 0 4px 0;
    }

    .results-meta {
        color: #777;
        font-size: 12px;
        font-style: italic;
        margin: 0 0 8px 0;
    }

    .results-table {
        border-collapse: collapse;
        font-size: 13px;
        width: 100%;
    }

    .results-table th,
    .results-table td {
        border-bottom: 1px solid #eee;
        padding: 6px 4px;
        text-align: center;
    }

    .results-table th {
        color: #777;
        font-size: 11px;
        font-weight: bold;
    }

    .results-table .col-rank {
        width: 28px;
    }

    .results-table .col-team {
        text-align: left;
        white-space: nowrap;
    }

    .results-table .col-points {
        font-weight: bold;
    }

    .results-table .flag {
        height: 18px;
        margin-right: 6px;
        vertical-align: middle;
        width: 28px;
    }

    .results-row--qualified {
        background-color: #f0faf5;
    }

    .results-row--third {
        background-color: #fff9e8;
    }

</style>
