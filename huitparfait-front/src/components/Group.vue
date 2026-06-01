<template>

    <card class="group" v-if="group != null">
        <a class="details" v-if="mode !== 'rejoin'"
                v-link="{ name: link ? link : 'group', params: { groupId: group.id, groupName: group.slug } }">
            <div class="avatar--wrapper">
                <img class="avatar" :src="group.avatarUrl">
            </div>
            <div class="infos">
                <div class="name">{{group.name}}</div>
                <div class="size" v-if="group.userCount != null"><strong>{{group.userCount}}</strong> {{ group.userCount | frenchPlural 'joueur' }}
                </div>
            </div>
        </a>
        <div class="details" v-else>
            <div class="avatar--wrapper">
                <img class="avatar" :src="group.avatarUrl">
            </div>
            <div class="infos">
                <div class="name">{{group.name}}</div>
                <div class="size" v-if="group.userCount != null"><strong>{{group.userCount}}</strong> {{ group.userCount | frenchPlural 'joueur' }}
                </div>
            </div>
        </div>
        <div class="btnBar" v-if="mode === 'delete'">
            <btn @click="deleteGroup">Supprimer</btn>
        </div>
        <div class="btnBar" v-if="mode === 'leave'">
            <btn @click="leaveGroup">Quitter le groupe</btn>
        </div>
        <div class="btnBar" v-if="mode === 'rejoin'">
            <btn :disabled="rejoinInProgress" @click="rejoinGroup">Réintégrer le groupe</btn>
        </div>
    </card>

</template>

<script type="text/babel">

    import store from '../state/configureStore'
    import { deleteGroup, leaveGroup as leaveGroupAction, joinGroup as joinGroupAction } from '../state/actions/groups'

    export default {
        props: ['group', 'mode', 'loader', 'link'],
        data() {
            return {
                rejoinInProgress: false,
            }
        },
        methods: {
            deleteGroup() {

                // eslint-disable-next-line no-alert
                if (window.confirm('Êtes-vous certain de vouloir supprimer ce groupe ?')) {
                    store.dispatch(deleteGroup(this.group))
                }
            },
            leaveGroup() {

                // eslint-disable-next-line no-alert
                if (window.confirm('Êtes-vous certain de vouloir quitter ce groupe ?')) {
                    store.dispatch(leaveGroupAction(this.group))
                }
            },
            rejoinGroup() {

                this.rejoinInProgress = true

                store.dispatch(joinGroupAction(this.group))
                    .then(() => {
                        this.$router.go({
                            name: 'groupRanking',
                            params: { groupId: this.group.id, groupName: this.group.slug },
                        })
                    })
                    .catch(() => {
                        this.rejoinInProgress = false
                    })
            },
        },
    }

</script>

<style scoped>

    .group {
        overflow: hidden;
    }

    @supports (flex-wrap: wrap) {
        .group {
            align-items: flex-start;
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
        }
    }

    .details {
        align-items: center;
        display: flex;
        flex: 1 1 250px;
        text-decoration: none;
    }

    .avatar--wrapper {
        border-radius: 3px;
        flex-shrink: 0;
        height: 70px;
        margin-right: 15px;
        overflow: hidden;
        width: 70px;
    }

    .avatar {
        display: block;
        height: 100%;
        object-fit: cover;
        width: 100%;
    }

    .infos {
        flex: 1 1 auto;
    }

    .name {
        color: #333;
        font-weight: bold;
    }

    .size {
        color: #555;
    }

    .btnBar {
        align-self: flex-end;
        margin-left: 10px;
        margin-top: 10px;
        float: right;
    }

</style>
