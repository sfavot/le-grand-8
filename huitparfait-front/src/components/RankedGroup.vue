<template>

    <card class="rankedGroup" :class="{ 'memberGroup': rankedGroup.isMember }">
        <div class="rankingAvatar">
            <div class="ranking">{{ rankedGroup.rank | rank }}</div>
            <div class="avatar--wrapper">
                <img class="avatar" :src="rankedGroup.group.avatarUrl">
            </div>
        </div>
        <div class="nameDetails">
            <div class="name">{{ rankedGroup.group.name }}</div>
            <div class="details">
                <div class="scoreMembers">
                    <span class="score"><strong>{{ rankedGroup.stats.averageScore }}</strong> {{ rankedGroup.stats.averageScore | frenchPlural 'pt' }} en moyenne</span>
                    <span class="with">pour</span>
                    <span class="members"><strong>{{ rankedGroup.stats.memberCount }}</strong> {{ rankedGroup.stats.memberCount | frenchPlural 'joueur' }}</span>
                </div>
            </div>
        </div>
    </card>

</template>

<script type="text/babel">

    export default {
        props: ['rankedGroup'],
    }

</script>

<style scoped>

    .rankedGroup {
        align-items: center;
        display: flex;
        position: relative;
        overflow: hidden;
    }

    .rankedGroup.memberGroup {
        background-color: #FFD;
    }

    @media (min-width: 700px) {
        .rankedGroup {
            padding: 0 15px !important;
        }
    }

    .rankingAvatar {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }

    @media (min-width: 700px) {
        .rankingAvatar {
            flex-direction: row;
            align-items: center;
        }
    }

    .ranking {
        color: #49996f;
        font-size: 16px;
        font-weight: bold;
        margin-right: 15px;
        margin-bottom: 5px;
    }

    @media (min-width: 700px) {
        .ranking {
            margin-bottom: 0;
            text-align: right;
            width: 80px;
        }
    }

    .avatar--wrapper {
        border-radius: 3px;
        height: 60px;
        margin-right: 15px;
        overflow: hidden;
        width: 60px;
    }

    @media (min-width: 700px) {
        .avatar--wrapper {
            border-radius: 0;
        }
    }

    .avatar {
        display: block;
        height: 100%;
        object-fit: cover;
        width: 100%;
    }

    .nameDetails {
        overflow: hidden;
    }

    @media (min-width: 700px) {
        .nameDetails {
            display: flex;
            flex: 1 1 0;
        }
    }

    .name {
        color: #333;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media (min-width: 700px) {
        .name {
            flex: 1 1 0;
            margin-bottom: 0;
            overflow: visible;
            text-overflow: ellipsis;
            white-space: normal;
        }
    }

    .details {
        color: #777;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 60px;
    }

    @media (min-width: 700px) {
        .details {
            align-items: center;
            flex-direction: row;
            height: auto;
        }
    }

    @media (min-width: 700px) {
        .scoreMembers {
            display: flex;
        }
    }

    .score {
        color: #333;
    }

    @media (min-width: 700px) {
        .score {
            display: block;
            text-align: right;
            width: 180px;
        }
    }

    @media (min-width: 700px) {
        .with {
            display: none;
        }
    }

    @media (min-width: 700px) {
        .members {
            display: block;
            text-align: right;
            width: 100px;
        }
    }

</style>
