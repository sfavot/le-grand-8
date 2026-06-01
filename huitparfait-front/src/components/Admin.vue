<template>
    <div class="page--admin">
        <card v-if="!authenticated">
            <h2 class="card-title">Administration</h2>
            <p>Réservé à l'organisateur : connecte-toi au site, puis saisis le mot de passe admin (non mémorisé après rechargement de la page).</p>
            <form class="admin-login" @submit.prevent="login">
                <label class="admin-label" for="admin-password">Mot de passe</label>
                <input id="admin-password" class="admin-input" type="password" v-model="password"
                        autocomplete="current-password" required/>
                <p class="admin-error" v-if="loginError">{{* loginError }}</p>
                <btn type="submit" :disabled="loggingIn">Se connecter</btn>
            </form>
        </card>

        <template v-if="authenticated">
            <card class="admin-toolbar">
                <btn @click="runCalculate" :disabled="calculating">
                    {{* calculating ? 'Calcul en cours…' : 'Calculer les points' }}
                </btn>
                <p class="admin-message admin-message--ok" v-if="calculateMessage">{{* calculateMessage }}</p>
                <p class="admin-message admin-message--error" v-if="calculateError">{{* calculateError }}</p>
                <btn class="admin-logout" @click="logout">Déconnexion</btn>
            </card>

            <card v-if="loading">
                <p>Chargement des matchs…</p>
            </card>

            <card v-if="!loading && games.length === 0">
                <p><strong>Rien à saisir.</strong></p>
                <p>Tous les matchs passés ont leurs résultats. Lance le calcul des points si besoin.</p>
            </card>

            <card-list wide v-if="!loading && games.length > 0">
                <card wide class="admin-game" v-for="game in games" track-by="gameId">
                    <div class="admin-game-header">
                        <div class="admin-game-name">
                            {{* game.gameName }}
                            <span v-if="game.phase === 'Groupes'">— Groupe {{* game.group }}</span>
                            <span v-else>— {{* game.phase }}</span>
                        </div>
                        <div class="admin-game-meta">{{* formatDate(game.startsAt) }} · {{* game.stadium }}</div>
                    </div>

                    <div class="admin-teams">
                        <div class="admin-team">
                            <img v-if="game.countryCodeTeamA" class="flag" :src="flagSrc(game.countryCodeTeamA)"
                                    @error="onFlagError"/>
                            <span>{{* game.countryNameTeamA }}</span>
                        </div>
                        <div class="admin-team">
                            <img v-if="game.countryCodeTeamB" class="flag" :src="flagSrc(game.countryCodeTeamB)"
                                    @error="onFlagError"/>
                            <span>{{* game.countryNameTeamB }}</span>
                        </div>
                    </div>

                    <div class="admin-scores">
                        <label>Buts équipe A
                            <input class="admin-input admin-input--score" type="number" min="0" max="99"
                                    v-model="game.goalsTeamA" required/>
                        </label>
                        <label>Buts équipe B
                            <input class="admin-input admin-input--score" type="number" min="0" max="99"
                                    v-model="game.goalsTeamB" required/>
                        </label>
                    </div>

                    <div class="admin-risk">
                        <p class="admin-risk-text">{{* game.riskTitle }}</p>
                        <div class="admin-risk-choices">
                            <label>
                                <input type="radio" :name="'risk-' + game.gameId" :value="true"
                                        v-model="game.riskHappened"/>
                                Réalisée
                            </label>
                            <label>
                                <input type="radio" :name="'risk-' + game.gameId" :value="false"
                                        v-model="game.riskHappened"/>
                                Non réalisée
                            </label>
                        </div>
                    </div>

                    <p class="admin-message admin-message--error" v-if="game.saveError">{{* game.saveError }}</p>
                    <p class="admin-message admin-message--ok" v-if="game.saveOk">Enregistré.</p>
                    <btn @click="saveGame(game)" :disabled="game.saving">
                        {{* game.saving ? 'Enregistrement…' : 'Enregistrer' }}
                    </btn>
                </card>
            </card-list>
        </template>
    </div>
</template>

<script type="text/babel">
    import moment from 'moment'
    import 'moment/locale/fr'
    import { flagSrc, onFlagError } from '../flagSrc'
    import {
        calculateAdminPoints,
        clearAdminAuth,
        fetchAdminGames,
        saveAdminGame,
        setAdminPassword,
    } from '../adminApi'

    moment.locale('fr')

    export default {
        data() {
            return {
                authenticated: false,
                password: '',
                loginError: null,
                loggingIn: false,
                loading: false,
                games: [],
                calculating: false,
                calculateMessage: null,
                calculateError: null,
            }
        },
        methods: {
            flagSrc,
            onFlagError,
            formatDate(startsAt) {
                return moment(startsAt).format('dddd D MMMM YYYY [à] HH[h]mm')
            },
            login() {
                this.loginError = null
                this.loggingIn = true
                setAdminPassword(this.password)
                this.loadGames()
                    .then(() => {
                        this.authenticated = true
                        this.password = ''
                    })
                    .catch((err) => {
                        clearAdminAuth()
                        this.authenticated = false
                        this.loginError = err.message
                    })
                    .finally(() => {
                        this.loggingIn = false
                    })
            },
            logout() {
                clearAdminAuth()
                this.authenticated = false
                this.games = []
                this.calculateMessage = null
                this.calculateError = null
            },
            loadGames() {
                this.loading = true
                return fetchAdminGames()
                    .then((games) => {
                        this.games = games.map((game) => ({
                            ...game,
                            goalsTeamA: game.goalsTeamA != null ? game.goalsTeamA : '',
                            goalsTeamB: game.goalsTeamB != null ? game.goalsTeamB : '',
                            riskHappened: game.riskHappened === true || game.riskHappened === false
                                ? game.riskHappened
                                : null,
                            saving: false,
                            saveError: null,
                            saveOk: false,
                        }))
                    })
                    .finally(() => {
                        this.loading = false
                    })
            },
            saveGame(game) {
                if (game.riskHappened !== true && game.riskHappened !== false) {
                    game.saveError = 'Indique si la risquette est réalisée ou non.'
                    return
                }

                game.saving = true
                game.saveError = null
                game.saveOk = false

                saveAdminGame(game.gameId, {
                    goalsTeamA: Number(game.goalsTeamA),
                    goalsTeamB: Number(game.goalsTeamB),
                    riskHappened: game.riskHappened === true || game.riskHappened === 'true',
                })
                    .then(() => {
                        game.saveOk = true
                        const index = this.games.indexOf(game)
                        if (index !== -1) {
                            this.games.splice(index, 1)
                        }
                    })
                    .catch((err) => {
                        game.saveError = err.message
                    })
                    .finally(() => {
                        game.saving = false
                    })
            },
            runCalculate() {
                this.calculating = true
                this.calculateMessage = null
                this.calculateError = null

                calculateAdminPoints()
                    .then((result) => {
                        const count = result.pronosticsUpdated || 0
                        this.calculateMessage = count > 0
                            ? `${count} pronostic(s) mis à jour.`
                            : 'Aucun nouveau pronostic à noter.'
                    })
                    .catch((err) => {
                        this.calculateError = err.message
                    })
                    .finally(() => {
                        this.calculating = false
                    })
            },
        },
    }
</script>

<style scoped>
    .page--admin {
        max-width: 720px;
        margin: 0 auto;
    }

    .card-title {
        margin-top: 0;
    }

    .admin-login {
        max-width: 320px;
    }

    .admin-label {
        display: block;
        margin-bottom: 6px;
    }

    .admin-input {
        box-sizing: border-box;
        display: block;
        margin-bottom: 12px;
        padding: 8px;
        width: 100%;
    }

    .admin-input--score {
        margin-top: 4px;
        width: 5em;
    }

    .admin-error,
    .admin-message--error {
        color: #c0392b;
    }

    .admin-message--ok {
        color: #2e7d52;
    }

    .admin-toolbar {
        margin-bottom: 16px;
    }

    .admin-logout {
        margin-top: 12px;
    }

    .admin-game {
        margin-bottom: 12px;
    }

    .admin-game-header {
        margin-bottom: 12px;
    }

    .admin-game-name {
        font-weight: bold;
    }

    .admin-game-meta {
        color: #666;
        font-size: 0.9em;
    }

    .admin-teams {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 12px;
    }

    .admin-team {
        align-items: center;
        display: flex;
        gap: 8px;
    }

    .flag {
        height: 24px;
        width: 32px;
    }

    .admin-scores {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 12px;
    }

    .admin-risk {
        margin-bottom: 12px;
    }

    .admin-risk-text {
        margin: 0 0 8px;
    }

    .admin-risk-choices label {
        margin-right: 16px;
    }
</style>
