<template>
    <section class="thirdPlace">
        <h2 class="thirdPlace-title">Meilleurs troisièmes</h2>

        <card wide class="thirdPlace-intro">
            <p>
                La Coupe du monde 2026 compte <strong>12 poules de 4 équipes</strong>.
                Les <strong>2 premiers</strong> de chaque poule sont qualifiés (24 équipes).
                Il reste <strong>8 places</strong> en 16<sup>e</sup> de finale pour les
                <strong>8 meilleurs troisièmes</strong> sur 12&nbsp;: les 4 autres sont éliminés.
            </p>
            <p>
                Les 3<sup>e</sup> sont classés entre eux selon les critères FIFA&nbsp;:
                points, différence de buts, buts marqués, fair-play (cartons), puis
                <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/groups-how-teams-qualify-tie-breakers"
                        rel="noopener noreferrer">classement FIFA</a>.
                Ici, seuls les trois premiers critères sont pris en compte pour l'instant.
                Une fois les 8 repêchés connus, la FIFA applique l'un des
                <strong>495 scénarios</strong> prédéfinis (Annexe C du
                <a href="https://www.wk2026voetbal.nl/wk-2026-reglement.pdf"
                        rel="noopener noreferrer">règlement officiel</a>)
                pour affecter chaque 3<sup>e</sup> à un match précis (colonne «&nbsp;Match&nbsp;»).
            </p>
            <p class="thirdPlace-introLink">
                <link-btn v-link="{ name: 'faq' }">Plus de détails dans la FAQ</link-btn>
            </p>
        </card>

        <card wide class="thirdPlace-card">
            <div class="thirdPlace-tables">
                <section class="thirdPlace-tableSection">
                    <h4 class="thirdPlace-tableSectionTitle">En direct</h4>
                    <p v-if="liveScenarioNumber != null" class="thirdPlace-meta thirdPlace-scenario">
                        Scénario FIFA n°&nbsp;{{* liveScenarioNumber }}
                    </p>
                    <p v-if="liveIncomplete" class="thirdPlace-meta">
                        Classement provisoire (toutes les poules ne sont pas terminées).
                    </p>
                    <table class="thirdPlace-table">
                        <thead>
                            <tr>
                                <th class="col-rank">Rang</th>
                                <th class="col-team">3<sup>e</sup></th>
                                <th>Pts</th>
                                <th>Diff</th>
                                <th>BP</th>
                                <th class="col-status">Statut</th>
                                <th class="col-slots">Match</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="entry in liveEntries"
                                    :class="thirdPlaceRowClass(entry)"
                                    track-by="group">
                                <td class="col-rank">{{* entry.rankAmongThirds }}</td>
                                <td class="col-team">
                                    <img v-if="entry.standing.team.countryCode"
                                            class="flag"
                                            :src="flagSrc(entry.standing.team.countryCode)"
                                            @error="onFlagError"/>
                                    <span>{{* entry.standing.team.countryName }}</span>
                                    <span class="thirdPlace-group">({{* entry.group }})</span>
                                </td>
                                <td>{{* entry.standing.points }}</td>
                                <td>{{* entry.standing.goalDifference }}</td>
                                <td>{{* entry.standing.goalsFor }}</td>
                                <td class="col-status">
                                    <span v-if="entry.qualifies" class="thirdPlace-badge thirdPlace-badge--in">Repêché</span>
                                    <span v-else class="thirdPlace-badge thirdPlace-badge--out">Éliminé</span>
                                </td>
                                <td class="col-slots">{{* formatEligibleMatches(entry.eligibleMatchNumbers) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section class="thirdPlace-tableSection">
                    <h4 class="thirdPlace-tableSectionTitle">Selon tes pronos</h4>
                    <p v-if="predictiveScenarioNumber != null" class="thirdPlace-meta thirdPlace-scenario">
                        Scénario FIFA n°&nbsp;{{* predictiveScenarioNumber }}
                    </p>
                    <p v-if="predictiveIncomplete" class="thirdPlace-meta">
                        Classement provisoire (tous les matchs de poule ne sont pas pronostiqués).
                    </p>
                    <table class="thirdPlace-table">
                        <thead>
                            <tr>
                                <th class="col-rank">Rang</th>
                                <th class="col-team">3<sup>e</sup></th>
                                <th>Pts</th>
                                <th>Diff</th>
                                <th>BP</th>
                                <th class="col-status">Statut</th>
                                <th class="col-slots">Match</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="entry in predictiveEntries"
                                    :class="thirdPlaceRowClass(entry)"
                                    track-by="group">
                                <td class="col-rank">{{* entry.rankAmongThirds }}</td>
                                <td class="col-team">
                                    <img v-if="entry.standing.team.countryCode"
                                            class="flag"
                                            :src="flagSrc(entry.standing.team.countryCode)"
                                            @error="onFlagError"/>
                                    <span>{{* entry.standing.team.countryName }}</span>
                                    <span class="thirdPlace-group">({{* entry.group }})</span>
                                </td>
                                <td>{{* entry.standing.points }}</td>
                                <td>{{* entry.standing.goalDifference }}</td>
                                <td>{{* entry.standing.goalsFor }}</td>
                                <td class="col-status">
                                    <span v-if="entry.qualifies" class="thirdPlace-badge thirdPlace-badge--in">Repêché</span>
                                    <span v-else class="thirdPlace-badge thirdPlace-badge--out">Éliminé</span>
                                </td>
                                <td class="col-slots">{{* formatEligibleMatches(entry.eligibleMatchNumbers) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>
        </card>
    </section>
</template>

<script type="text/babel">
    import { flagSrc, onFlagError } from '../flagSrc'

    export default {
        props: {
            liveEntries: {
                type: Array,
                required: true,
            },
            predictiveEntries: {
                type: Array,
                required: true,
            },
            expectedGroupCount: {
                type: Number,
                default: 12,
            },
        },
        computed: {
            liveIncomplete() {
                return this.liveEntries.length < this.expectedGroupCount
            },
            predictiveIncomplete() {
                return this.predictiveEntries.length < this.expectedGroupCount
            },
            liveScenarioNumber() {
                return this.scenarioNumberFromEntries(this.liveEntries)
            },
            predictiveScenarioNumber() {
                return this.scenarioNumberFromEntries(this.predictiveEntries)
            },
        },
        methods: {
            flagSrc,
            onFlagError,
            scenarioNumberFromEntries(entries) {
                if (entries == null || entries.length === 0) {
                    return null
                }

                const qualifiedCount = entries.filter((entry) => entry.qualifies).length
                if (qualifiedCount < 8) {
                    return null
                }

                return entries[0].scenarioNumber != null ? entries[0].scenarioNumber : null
            },
            formatEligibleMatches(matchNumbers) {
                if (matchNumbers == null || matchNumbers.length === 0) {
                    return '—'
                }

                return matchNumbers.map((n) => `M${n}`).join(', ')
            },
            thirdPlaceRowClass(entry) {
                return {
                    'thirdPlace-row--qualified': entry.qualifies,
                    'thirdPlace-row--eliminated': !entry.qualifies,
                }
            },
        },
    }
</script>

<style scoped>

    .thirdPlace {
        margin-bottom: 10px;
    }

    .thirdPlace-title {
        color: #999;
        font-size: 20px;
        font-weight: bold;
        margin: 0;
        padding: 10px;
    }

    .thirdPlace-intro {
        margin: 0 8px 15px 8px;
    }

    .thirdPlace-intro p {
        margin: 0 0 10px 0;
    }

    .thirdPlace-intro p:last-child {
        margin-bottom: 0;
    }

    .thirdPlace-introLink {
        margin-top: 12px;
        text-align: center;
    }

    .thirdPlace-card {
        margin-bottom: 15px;
    }

    .thirdPlace-tables {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    @media (min-width: 900px) {
        .thirdPlace-tables {
            flex-direction: row;
            align-items: flex-start;
        }

        .thirdPlace-tableSection {
            flex: 1 1 0;
            min-width: 0;
        }
    }

    .thirdPlace-tableSectionTitle {
        font-size: 15px;
        margin: 0 0 4px 0;
    }

    .thirdPlace-meta {
        color: #777;
        font-size: 12px;
        font-style: italic;
        margin: 0 0 8px 0;
    }

    .thirdPlace-scenario {
        color: #2d6a4f;
        font-style: normal;
        font-weight: bold;
    }

    .thirdPlace-table {
        border-collapse: collapse;
        font-size: 13px;
        width: 100%;
    }

    .thirdPlace-table th,
    .thirdPlace-table td {
        border-bottom: 1px solid #eee;
        padding: 6px 4px;
        text-align: center;
    }

    .thirdPlace-table th {
        color: #777;
        font-size: 11px;
        font-weight: bold;
    }

    .thirdPlace-table .col-rank {
        width: 36px;
    }

    .thirdPlace-table .col-team {
        text-align: left;
        white-space: nowrap;
    }

    .thirdPlace-table .col-status {
        width: 72px;
    }

    .thirdPlace-table .col-slots {
        font-size: 11px;
        text-align: left;
    }

    .thirdPlace-group {
        color: #777;
        font-size: 11px;
        margin-left: 4px;
    }

    .thirdPlace-table .flag {
        height: 18px;
        margin-right: 6px;
        vertical-align: middle;
        width: 28px;
    }

    .thirdPlace-badge {
        border-radius: 3px;
        display: inline-block;
        font-size: 10px;
        font-weight: bold;
        line-height: 1.2;
        padding: 2px 5px;
        text-transform: uppercase;
    }

    .thirdPlace-badge--in {
        background-color: #d4edda;
        color: #2d6a4f;
    }

    .thirdPlace-badge--out {
        background-color: #f8f9fa;
        color: #888;
    }

    .thirdPlace-row--qualified {
        background-color: #f0faf5;
    }

    .thirdPlace-row--eliminated {
        color: #888;
    }

</style>
