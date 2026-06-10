<template>
    <div class="page--results">

        <card-title>Résultats</card-title>

        <card v-if="predictionsAllGames == null" class="results-empty">
            <p>Chargement des matchs…</p>
        </card>

        <template v-else>
            <section v-if="groupEntries.length > 0" class="results-section">
                <h2 class="results-sectionTitle">Phase de groupes</h2>

                <card-list wide class="results-list">
                    <card wide class="results-card" v-for="entry in groupEntries" track-by="group">
                        <h3 class="results-groupTitle">Groupe {{* entry.group }}</h3>

                        <div class="results-tables">
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

                            <section class="results-tableSection">
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
                :expected-group-count="expectedGroupCount">
            </third-place-ranking>

            <section v-for="phase in knockoutPhaseEntries" class="results-section" track-by="phase">
                <h2 class="results-sectionTitle">{{* phase.phaseLabel }}</h2>

                <card wide class="results-card">
                    <div class="results-tables">
                        <section class="results-tableSection">
                            <h4 class="results-tableSectionTitle">En direct</h4>
                            <p class="results-meta">
                                {{* phase.playedMatches }} / {{* phase.totalMatches }} matchs joués
                            </p>
                            <div class="results-matches">
                                <div class="results-match" v-for="match in phase.matches" track-by="gameId">
                                    <div class="results-matchName">{{* match.gameName }}</div>
                                    <div class="results-matchLine">
                                        <div class="results-matchTeam results-matchTeam--home">
                                            <team-display side="home" :team="match.live.teamA"></team-display>
                                        </div>
                                        <div class="results-matchScore">
                                            <template v-if="match.live.score">
                                                {{* match.live.score.goalsA }} - {{* match.live.score.goalsB }}
                                                <span v-if="hasPenalties(match.live.score)" class="results-penalties">
                                                    (tab. {{* match.live.score.penaltiesA }} - {{* match.live.score.penaltiesB }})
                                                </span>
                                            </template>
                                            <span v-else class="results-matchPending">—</span>
                                        </div>
                                        <div class="results-matchTeam results-matchTeam--away">
                                            <team-display side="away" :team="match.live.teamB"></team-display>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="results-tableSection">
                            <h4 class="results-tableSectionTitle">Selon tes pronos</h4>
                            <p class="results-meta">
                                {{* phase.predictedMatches }} / {{* phase.totalMatches }} matchs renseignés
                            </p>
                            <div class="results-matches">
                                <div class="results-match" v-for="match in phase.matches" track-by="gameId">
                                    <div class="results-matchName">{{* match.gameName }}</div>
                                    <div class="results-matchLine">
                                        <div class="results-matchTeam results-matchTeam--home">
                                            <team-display side="home" :team="match.predictive.teamA"></team-display>
                                        </div>
                                        <div class="results-matchScore">
                                            <template v-if="match.predictive.score">
                                                {{* match.predictive.score.goalsA }} - {{* match.predictive.score.goalsB }}
                                            </template>
                                            <span v-else class="results-matchPending">—</span>
                                        </div>
                                        <div class="results-matchTeam results-matchTeam--away">
                                            <team-display side="away" :team="match.predictive.teamB"></team-display>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </card>
            </section>

            <card v-if="groupEntries.length === 0 && knockoutPhaseEntries.length === 0" class="results-empty">
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
    import { buildKnockoutPhaseEntries } from '../resultsUtils'
    import TeamDisplay from './TeamDisplay'
    import ThirdPlaceRanking from './ThirdPlaceRanking'

    export default {
        components: {
            TeamDisplay,
            ThirdPlaceRanking,
        },
        data() {
            return {
                predictionsAllGames: this.$select('predictionsAllGames'),
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
        },
        route: {
            data() {
                return store.dispatch(fetchAllPredictionsGames())
            },
        },
        methods: {
            flagSrc,
            onFlagError,
            hasPenalties(score) {
                return score.penaltiesA != null && score.penaltiesB != null
            },
            standingRowClass(rank) {
                return {
                    'results-row--qualified': rank <= 2,
                    'results-row--third': rank === 3,
                }
            },
        },
    }
</script>

<style scoped>

    .page--results {
        padding-bottom: 20px;
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

    .results-card {
        margin-bottom: 15px;
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

    .results-matches {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .results-match {
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }

    .results-match:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }

    .results-matchName {
        color: #777;
        font-size: 12px;
        margin-bottom: 6px;
    }

    .results-matchLine {
        align-items: center;
        display: flex;
        gap: 8px;
    }

    .results-matchTeam {
        flex: 1 1 0;
        min-width: 0;
    }

    .results-matchTeam--home {
        display: flex;
        justify-content: flex-end;
    }

    .results-matchTeam--away {
        display: flex;
        justify-content: flex-start;
    }

    .results-matchScore {
        flex: 0 0 auto;
        font-size: 15px;
        font-weight: bold;
        min-width: 52px;
        text-align: center;
    }

    .results-matchPending {
        color: #bbb;
        font-weight: normal;
    }

    .results-penalties {
        color: #777;
        display: block;
        font-size: 11px;
        font-weight: normal;
    }

</style>
