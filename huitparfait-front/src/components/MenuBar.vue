<template>

    <div class="main-menubar">
        <a class="menuitem" v-link="{ name: 'rankings', activeClass: 'menuitem--active' }">
            <img class="menuitem-icon menuitem-icon--white" src="../assets/rankings.svg" alt="">
            <img class="menuitem-icon menuitem-icon--green" src="../assets/rankings-green.svg" alt="">
            <span class="menuitem-label">Classements</span>
        </a>
        <div class="menuitem menuitem-category" @click="togglePredictionsSubmenu">
            <img class="menuitem-icon menuitem-icon--white" src="../assets/predictions.svg" alt="">
            <img class="menuitem-icon menuitem-icon--green" src="../assets/predictions-green.svg" alt="">
            <span class="menuitem-label">Pronostics</span>
        </div>
        <div class="sub-menubar" :class="{ 'visible': submenu.predictions }">
            <a class="sub-menuitem" v-link="{ name: 'predictions', activeClass: 'sub-menuitem--active', params: { period: 'matchs-precedents' } }">
                Matchs précédents
            </a>
            <a class="sub-menuitem" v-link="{ name: 'predictions', activeClass: 'sub-menuitem--active', params: { period: 'prochains-matchs' } }">
                Prochains matchs
                <span v-if="unfilledPredictionsCount > 0" class="sub-menuitem-badge">{{ unfilledPredictionsCount }}</span>
            </a>
            <a class="sub-menuitem" v-link="{ name: 'results', activeClass: 'sub-menuitem--active' }">
                Résultats
            </a>
        </div>
        <a class="menuitem" v-link="{ name: 'groupList', activeClass: 'menuitem--active' }">
            <img class="menuitem-icon menuitem-icon--white" src="../assets/groups.svg" alt="">
            <img class="menuitem-icon menuitem-icon--green" src="../assets/groups-green.svg" alt="">
            <span class="menuitem-label">Groupes</span>
        </a>
        <a class="menuitem" v-link="{ name: 'faq', activeClass: 'menuitem--active' }">
            <img class="menuitem-icon menuitem-icon--white" src="../assets/faq.svg" alt="">
            <img class="menuitem-icon menuitem-icon--green" src="../assets/faq-green.svg" alt="">
            <span class="menuitem-label">FAQ</span>
        </a>
        <a class="menuitem" v-link="{ name: 'profile', activeClass: 'menuitem--active' }">
            <img class="menuitem-icon menuitem-icon--white" src="../assets/profile.svg" alt="">
            <img class="menuitem-icon menuitem-icon--green" src="../assets/profile-green.svg" alt="">
            <span class="menuitem-label">Profil</span>
        </a>
        <div class="sub-menubar">
            <a class="sub-menuitem" href="/auth/logout">Déconnexion</a>
        </div>
    </div>

</template>

<script type="text/babel">

    import store from '../state/configureStore'
    import { showSubmenu, hideSubmenu } from '../state/actions/submenu'
    import { fetchUnfilledPredictionsBadge } from '../state/actions/predictions'

    export default {
        data() {
            return {
                submenu: this.$select('submenu'),
                user: this.$select('user'),
                unfilledPredictionsCount: 0,
            }
        },
        created() {
            this.$select('predictionsBadge as unfilledPredictionsCount')
        },
        ready() {
            this.loadBadgeCount()
        },
        watch: {
            user(user) {
                if (user != null) {
                    this.loadBadgeCount()
                }
            },
        },
        methods: {
            loadBadgeCount() {
                if (store.state.user == null) {
                    return
                }
                return store.dispatch(fetchUnfilledPredictionsBadge())
            },
            togglePredictionsSubmenu() {

                if (this.submenu === false) {
                    return store.dispatch(showSubmenu('predictions'))
                }

                return store.dispatch(hideSubmenu())
            },
        },
    }
</script>

<style scoped>

    .main-menubar {
        background: #4db788;
        border-color: #49996f;
        color: #fff;
        display: flex;
    }

    @media (min-width: 850px) {
        .main-menubar {
            background: #f9f9f9;
            flex-direction: column;
            flex-wrap: nowrap;
            flex-shrink: 0;
        }
    }

    .menuitem {
        align-items: center;
        background: #4db788;
        color: #fff;
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        text-decoration: none;
        height: 100%;
        z-index: 3;
    }

    @media (min-width: 850px) {
        .menuitem {
            background: #f9f9f9;
            flex: 0 0 auto;
            flex-direction: row;
            flex-shrink: 0;
            height: auto;
            padding: 10px 0;
            text-align: left;
        }
    }

    .menuitem:hover {
        background-color: #4baf81;
    }

    @media (min-width: 850px) {
        .menuitem:hover {
            background-color: #eee;
        }

        .menuitem.menuitem-category:hover {
            background-color: #f9f9f9;
        }
    }

    .menuitem.menuitem--active {
        background-color: #49996f;
    }

    @media (min-width: 850px) {
        .menuitem.menuitem--active {
            background-color: #eee;
            border-right: 3px solid #4db788;
        }
    }

    .menuitem-icon {
        height: 36px;
        margin: 5px 0;
        width: 36px;
        display: none;
    }

    .menuitem-icon.menuitem-icon--green {
        display: none;
    }

    @media (min-height: 550px) {
        .menuitem-icon {
            display: block;
        }
    }

    @media (min-width: 850px) {
        .menuitem-icon {
            margin: 0 15px;
            height: 30px;
            width: 30px;
        }

        .menuitem-icon.menuitem-icon--white {
            display: none;
        }

        .menuitem-icon.menuitem-icon--green {
            display: block;
        }
    }

    .menuitem-label {
        font-size: 10px;
        font-size: 3vw;
        font-weight: bold;
        height: 24px;
        line-height: 24px;
        margin-bottom: 1px;
        width: 100%;
    }

    .sub-menuitem-badge {
        background-color: #d9534f;
        border-radius: 9px;
        color: #fff;
        display: inline-block;
        font-size: 11px;
        font-weight: bold;
        line-height: 18px;
        margin-left: 6px;
        min-width: 18px;
        padding: 0 5px;
        text-align: center;
        vertical-align: middle;
    }

    @media (min-width: 500px) {
        .menuitem-label {
            font-size: 15px;
        }
    }

    @media (min-width: 850px) {
        .menuitem-label {
            color: #49996f;
            flex: 1 1 0;
            font-size: 16px;
            height: 30px;
            line-height: 30px;
            width: auto;
        }

        .menuitem-category .menuitem-label {
            font-size: 14px;
            font-style: italic;
            font-weight: normal;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
    }

    .sub-menubar {
        background-color: #4db788;
        bottom: 41px;
        left: 0;
        overflow: hidden;
        position: absolute;
        transition: 150ms transform ease-in-out;
        transform: translate3d(0, 105%, 0);
        width: 100%;
    }

    @media (min-height: 550px) {
        .sub-menubar {
            bottom: 72px;
        }
    }

    @media (min-width: 850px) {
        .sub-menubar {
            background-color: transparent;
            flex-shrink: 0;
            position: static;
            transform: none;
            transition: none;
        }
    }

    .sub-menubar.visible {
        transform: translate3d(0, 0%, 0);
    }

    .sub-menuitem {
        color: #fff;
        display: block;
        border-bottom: 1px solid #49996f;
        font-weight: bold;
        height: 30px;
        line-height: 30px;
        padding: 15px;
        text-align: center;
        text-decoration: none;
    }

    @media (min-width: 850px) {
        .sub-menuitem {
            border: none;
            color: #777;
            flex-shrink: 0;
            padding: 10px 0 10px 60px;
            text-align: left;
        }

        .sub-menuitem:hover {
            background-color: #eee;
        }

        .sub-menuitem.sub-menuitem--active {
            background-color: #eee;
            border-right: 3px solid #4db788;
        }
    }

</style>
