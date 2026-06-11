<template>

    <div class="page--groupRanking">

        <card-title v-if="group != null && group.id != 'general'">Classement de <em>{{ group.name }}</em>&nbsp;</card-title>
        <card-title v-else>Classement général</em>&nbsp;</card-title>

        <card>
            <p>Les scores et les classements sont mis à jour chaque lendemain de match à <strong>8h08</strong> (heure de Paris).</p>
        </card>

        <card v-if="canLeaveGroup">
            <p>Vous ne souhaitez plus participer à ce groupe ?</p>
            <div class="btnBar">
                <btn :disabled="leaveGroupInProgress" @click="leaveGroup">Quitter le groupe</btn>
            </div>
        </card>

        <ranked-player v-for="rankedPlayer in groupRanking.ranking" :ranked-player="rankedPlayer"></ranked-player>

        <div v-show="loaders === 0 && groupRanking.ranking.length === 0"
            class="noPlayerOnThisPage">
            Pas de joueur sur cette page :(
        </div>

        <div v-if="group && hasPagination" class="pageSelectors" v-show="loaders === 0">
            <link-btn
                v-if="hasPreviousPage"
                class="pageSelector"
                v-link="{ name: 'groupRanking', params: { groupId:  group.id, groupName: group.name }, query: { page: groupRanking.page - 1 } }">
                Page précédente
            </link-btn>

            <link-btn
                v-if="hasNextPage"
                class="pageSelector"
                v-link="{ name: 'groupRanking', params: { groupId: group.id, groupName: group.name }, query: { page: groupRanking.page + 1 } }">
                Page suivante
            </link-btn>
        </div>
    </div>

</template>

<script type="text/babel">
    import RankedPlayer from './RankedPlayer'
    import store from '../state/configureStore'
    import { fetchGroup, leaveGroup as leaveGroupAction } from '../state/actions/groups'
    import { fetchGroupRanking } from '../state/actions/ranking'

    const RANKING_PAGE_SIZE = 50

    export default {
        components: {
            RankedPlayer,
        },
        data() {
            return {
                group: this.$select('group'),
                groupRanking: this.$select('groupRanking'),
                loaders: this.$select('loaders'),
                leaveGroupInProgress: false,
            }
        },
        computed: {
            canLeaveGroup() {
                return this.group != null
                    && this.group.id !== 'general'
                    && this.group.isAdmin === false
            },
            hasPreviousPage() {
                return this.groupRanking.page > 1
            },
            hasNextPage() {
                return this.groupRanking.ranking.length >= RANKING_PAGE_SIZE
            },
            hasPagination() {
                return this.hasPreviousPage || this.hasNextPage
            },
        },
        route: {
            data: ({ to: { params: { groupId }, query: { page = 1 } } }) => {
                store.dispatch(fetchGroup(groupId))
                store.dispatch(fetchGroupRanking(groupId, parseInt(page)))
            },
        },
        methods: {
            leaveGroup() {

                // eslint-disable-next-line no-alert
                if (!window.confirm('Êtes-vous certain de vouloir quitter ce groupe ?')) {
                    return
                }

                this.leaveGroupInProgress = true

                store.dispatch(leaveGroupAction(this.group))
                    .then(() => {
                        this.$router.go({ name: 'groupList' })
                    })
                    .catch(() => {
                        this.leaveGroupInProgress = false
                    })
            },
        },
    }

</script>

<style scoped>

    .noPlayerOnThisPage {
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

    .btnBar {
        text-align: right;
        margin-top: 15px;
    }

</style>
