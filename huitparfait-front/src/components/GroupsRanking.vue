<template>

    <div class="page--groupsRanking">

        <card-title>Classement des groupes</card-title>

        <card>
            <p>Les groupes sont classés selon la <strong>moyenne des points</strong> de leurs membres actifs.</p>
            <p>Les scores sont mis à jour chaque lendemain de match à <strong>8:08</strong> ;-)</p>
        </card>

        <ranked-group v-for="rankedGroup in groupsRanking.ranking" :ranked-group="rankedGroup"></ranked-group>

        <div v-show="loaders === 0 && groupsRanking.ranking.length === 0"
            class="noGroupOnThisPage">
            Aucun groupe sur cette page :(
        </div>

        <div v-if="hasPagination" class="pageSelectors" v-show="loaders === 0">
            <link-btn
                v-if="hasPreviousPage"
                class="pageSelector"
                v-link="{ name: 'groupsRanking', query: { page: groupsRanking.page - 1 } }">
                Page précédente
            </link-btn>

            <link-btn
                v-if="hasNextPage"
                class="pageSelector"
                v-link="{ name: 'groupsRanking', query: { page: groupsRanking.page + 1 } }">
                Page suivante
            </link-btn>
        </div>
    </div>

</template>

<script type="text/babel">
    import RankedGroup from './RankedGroup'
    import store from '../state/configureStore'
    import { fetchGroupsRanking } from '../state/actions/ranking'

    const RANKING_PAGE_SIZE = 50

    export default {
        components: {
            RankedGroup,
        },
        data() {
            return {
                groupsRanking: this.$select('groupsRanking'),
                loaders: this.$select('loaders'),
            }
        },
        computed: {
            hasPreviousPage() {
                return this.groupsRanking.page > 1
            },
            hasNextPage() {
                return this.groupsRanking.ranking.length >= RANKING_PAGE_SIZE
            },
            hasPagination() {
                return this.hasPreviousPage || this.hasNextPage
            },
        },
        route: {
            data: ({ to: { query: { page = 1 } } }) => {
                store.dispatch(fetchGroupsRanking(parseInt(page)))
            },
        },
    }

</script>

<style scoped>

    .noGroupOnThisPage {
        text-align: center;
        color: #555;
        font-style: italic;
        margin: 30px 15px;
    }

    .pageSelectors {
        text-align: center;
    }

    .pageSelector {
        margin: 15px 1px;
    }

</style>
