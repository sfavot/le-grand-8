<template>
    <div class="page--admin">
        <card v-if="!authenticated">
            <h2 class="card-title">Administration</h2>
            <p>Réservé à l'organisateur</p>
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

            <div class="admin-tabs">
                <btn class="admin-tab" :class="{ 'admin-tab--active': activeTab === 'pending' }"
                        @click="switchTab('pending')">
                    À saisir
                </btn>
                <btn class="admin-tab" :class="{ 'admin-tab--active': activeTab === 'filled' }"
                        @click="switchTab('filled')">
                    Renseignés
                </btn>
                <btn class="admin-tab" :class="{ 'admin-tab--active': activeTab === 'schedule' }"
                        @click="switchTab('schedule')">
                    Calendrier
                </btn>
            </div>

            <card v-if="activeTab === 'filled'">
                <p>Modifier un résultat recalcule automatiquement les points des pronostics pour ce match.</p>
            </card>

            <card v-if="activeTab === 'schedule'">
                <p>Les dates et heures sont saisies dans le <strong>fuseau horaire du lieu</strong> (ville du stade).
                    L’équivalent heure de Paris est affiché à titre indicatif.</p>
                <label class="admin-label" for="schedule-phase-filter">Filtrer par phase</label>
                <select id="schedule-phase-filter" class="admin-input admin-input--filter"
                        v-model="schedulePhaseFilter">
                    <option value="">Toutes les phases</option>
                    <option v-for="phase in schedulePhases" :value="phase">{{* phase }}</option>
                </select>
            </card>

            <card v-if="loading">
                <p>Chargement des matchs…</p>
            </card>

            <card v-if="!loading && activeTab !== 'schedule' && games.length === 0 && activeTab === 'pending'">
                <p><strong>Rien à saisir.</strong></p>
                <p>Tous les matchs passés ont leurs résultats. Lance le calcul des points si besoin.</p>
            </card>

            <card v-if="!loading && activeTab !== 'schedule' && games.length === 0 && activeTab === 'filled'">
                <p><strong>Aucun match renseigné.</strong></p>
                <p>Les matchs dont les résultats ont été saisis apparaîtront ici.</p>
            </card>

            <card v-if="!loading && activeTab === 'schedule' && filteredScheduleGames.length === 0">
                <p><strong>Aucun match.</strong></p>
            </card>

            <card-list wide v-if="!loading && activeTab !== 'schedule' && games.length > 0">
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
                            <img v-if="adminTeamFlag(game.displayTeamA)" class="flag"
                                    :src="flagSrc(adminTeamFlag(game.displayTeamA))"
                                    @error="onFlagError"/>
                            <span>{{* adminTeamLabel(game.displayTeamA) }}</span>
                        </div>
                        <div class="admin-team">
                            <img v-if="adminTeamFlag(game.displayTeamB)" class="flag"
                                    :src="flagSrc(adminTeamFlag(game.displayTeamB))"
                                    @error="onFlagError"/>
                            <span>{{* adminTeamLabel(game.displayTeamB) }}</span>
                        </div>
                    </div>

                    <div class="admin-scores">
                        <label>Buts {{* adminTeamLabel(game.displayTeamA) }}
                            <input class="admin-input admin-input--score" type="number" min="0" max="99"
                                    v-model="game.goalsTeamA" required/>
                        </label>
                        <label>Buts {{* adminTeamLabel(game.displayTeamB) }}
                            <input class="admin-input admin-input--score" type="number" min="0" max="99"
                                    v-model="game.goalsTeamB" required/>
                        </label>
                    </div>

                    <div v-if="showPenalties(game)" class="admin-penalties">
                        <p class="admin-penalties-hint">
                            Match nul en phase finale : renseigne les tirs au but pour débloquer le tableau.
                        </p>
                        <div class="admin-scores">
                            <label>T.A.B. {{* adminTeamLabel(game.displayTeamA) }}
                                <input class="admin-input admin-input--score" type="number" min="0" max="99"
                                        v-model="game.penaltiesTeamA"/>
                            </label>
                            <label>T.A.B. {{* adminTeamLabel(game.displayTeamB) }}
                                <input class="admin-input admin-input--score" type="number" min="0" max="99"
                                        v-model="game.penaltiesTeamB"/>
                            </label>
                        </div>
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

            <card-list wide v-if="!loading && activeTab === 'schedule' && filteredScheduleGames.length > 0">
                <card wide class="admin-game admin-game--schedule" v-for="game in filteredScheduleGames"
                        track-by="gameId">
                    <div class="admin-game-header">
                        <div class="admin-game-name">
                            {{* game.countryNameTeamA }} – {{* game.countryNameTeamB }}
                            <span v-if="game.phase === 'Groupes'">· Groupe {{* game.group }}</span>
                            <span v-else>· {{* game.phase }}</span>
                        </div>
                        <div class="admin-game-meta">{{* game.gameName }}</div>
                    </div>

                    <div class="admin-schedule-fields">
                        <label class="admin-schedule-field">
                            Nom du match
                            <input class="admin-input" type="text" v-model="game.editName"/>
                        </label>
                        <label class="admin-schedule-field">
                            Phase
                            <select class="admin-input" v-model="game.editPhase">
                                <option v-for="phase in schedulePhaseOptions" :value="phase">{{* phase }}</option>
                            </select>
                        </label>
                        <label class="admin-schedule-field">
                            Stade
                            <input class="admin-input" type="text" v-model="game.editStadium" required/>
                        </label>
                        <label class="admin-schedule-field">
                            Ville
                            <select class="admin-input" v-model="game.editCity" required
                                    @change="clearScheduleSaveError(game)">
                                <option v-for="city in scheduleCityOptions(game)" :value="city">{{* city }}</option>
                            </select>
                        </label>
                        <label class="admin-schedule-field admin-schedule-field--date">
                            Date (lieu)
                            <input class="admin-input" type="date" v-model="game.editDate" required
                                    @input="clearScheduleSaveError(game)"/>
                        </label>
                        <label class="admin-schedule-field admin-schedule-field--time">
                            Heure (lieu)
                            <input class="admin-input" type="time" v-model="game.editTime" required
                                    @input="clearScheduleSaveError(game)"/>
                        </label>
                    </div>

                    <div class="admin-schedule-actions">
                        <p class="admin-message admin-message--error" v-if="game.saveError">{{* game.saveError }}</p>
                        <p class="admin-message admin-message--ok" v-if="game.saveOk">Enregistré.</p>
                        <btn @click="saveScheduleGame(game)" :disabled="game.saving">
                            {{* game.saving ? 'Enregistrement…' : 'Enregistrer' }}
                        </btn>
                    </div>

                    <admin-schedule-tz :city="game.editCity" :date="game.editDate" :time="game.editTime"></admin-schedule-tz>
                </card>
            </card-list>
        </template>
    </div>
</template>

<script type="text/babel">
    import moment from 'moment'
    import 'moment/locale/fr'
    import AdminScheduleTz from './AdminScheduleTz'
    import { flagSrc, onFlagError } from '../flagSrc'
    import {
        KNOWN_CITIES,
        buildSchedulePreview,
        canonicalCityName,
        normalizeScheduleTime,
        startsAtToVenueDateTime,
    } from '../gameTimeUtils'
    import {
        calculateAdminPoints,
        clearAdminAuth,
        fetchAdminGames,
        fetchAdminGamesSchedule,
        saveAdminGame,
        saveAdminGameSchedule,
        setAdminPassword,
    } from '../adminApi'
    import { applyBracketStateToGame, enrichGamesWithBracket } from '../bracketUtils'
    import { buildTeamDisplay } from '../resultsUtils'

    moment.locale('fr')

    const DEFAULT_SCHEDULE_PHASES = [
        'Groupes',
        '16èmes de finale',
        '8èmes de finale',
        '8ème de finale',
        'Quart de finale',
        'Demi-finale',
        'Petite finale',
        'Finale',
    ]

    const PHASE_SORT_ORDER = {
        Groupes: 0,
        '16èmes de finale': 10,
        '8èmes de finale': 20,
        '8ème de finale': 20,
        'Quart de finale': 30,
        'Demi-finale': 40,
        'Petite finale': 50,
        Finale: 60,
    }

    function phaseSortKey(phase) {
        if (phase == null) {
            return 100
        }
        return PHASE_SORT_ORDER[phase] != null ? PHASE_SORT_ORDER[phase] : 90
    }

    function initScheduleGame(game) {
        const city = canonicalCityName(game.city) || game.city
        const venue = startsAtToVenueDateTime(game.startsAt, city) || { date: '', time: '' }
        return {
            ...game,
            editName: game.gameName,
            editPhase: game.phase,
            editStadium: game.stadium,
            editCity: city,
            editDate: venue.date,
            editTime: venue.time,
            saving: false,
            saveError: null,
            saveOk: false,
        }
    }

    function initAdminResultGame(game, bracketMap) {
        const enriched = applyBracketStateToGame(game, bracketMap)
        return {
            ...game,
            goalsTeamA: game.goalsTeamA != null ? game.goalsTeamA : '',
            goalsTeamB: game.goalsTeamB != null ? game.goalsTeamB : '',
            penaltiesTeamA: game.penaltiesTeamA != null ? game.penaltiesTeamA : '',
            penaltiesTeamB: game.penaltiesTeamB != null ? game.penaltiesTeamB : '',
            riskHappened: game.riskHappened === true || game.riskHappened === false
                ? game.riskHappened
                : null,
            displayTeamA: buildTeamDisplay(enriched, 'A', 'live'),
            displayTeamB: buildTeamDisplay(enriched, 'B', 'live'),
            saving: false,
            saveError: null,
            saveOk: false,
        }
    }

    export default {
        components: {
            AdminScheduleTz,
        },
        data() {
            return {
                authenticated: false,
                password: '',
                loginError: null,
                loggingIn: false,
                loading: false,
                games: [],
                scheduleGames: [],
                schedulePhaseFilter: '',
                activeTab: 'pending',
                calculating: false,
                calculateMessage: null,
                calculateError: null,
            }
        },
        computed: {
            schedulePhases() {
                const phases = new Set(this.scheduleGames.map((game) => game.phase).filter(Boolean))
                return Array.from(phases).sort((a, b) => phaseSortKey(a) - phaseSortKey(b))
            },
            schedulePhaseOptions() {
                const phases = new Set(DEFAULT_SCHEDULE_PHASES)
                for (const game of this.scheduleGames) {
                    if (game.phase) {
                        phases.add(game.phase)
                    }
                    if (game.editPhase) {
                        phases.add(game.editPhase)
                    }
                }
                return Array.from(phases).sort((a, b) => phaseSortKey(a) - phaseSortKey(b))
            },
            filteredScheduleGames() {
                if (!this.schedulePhaseFilter) {
                    return this.scheduleGames
                }
                return this.scheduleGames.filter((game) => game.phase === this.schedulePhaseFilter)
            },
        },
        methods: {
            flagSrc,
            onFlagError,
            formatDate(startsAt) {
                return moment(startsAt).format('dddd D MMMM YYYY [à] HH[h]mm')
            },
            scheduleCityOptions(game) {
                const options = KNOWN_CITIES.slice()
                const current = canonicalCityName(game.editCity) || game.editCity
                if (current && options.indexOf(current) === -1) {
                    options.unshift(current)
                }
                return options
            },
            clearScheduleSaveError(game) {
                game.saveError = null
                game.saveOk = false
            },
            login() {
                this.loginError = null
                this.loggingIn = true
                setAdminPassword(this.password)
                this.loadTabData()
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
                this.scheduleGames = []
                this.schedulePhaseFilter = ''
                this.activeTab = 'pending'
                this.calculateMessage = null
                this.calculateError = null
            },
            switchTab(tab) {
                if (this.activeTab === tab) {
                    return
                }

                this.activeTab = tab
                this.loadTabData()
            },
            loadTabData() {
                if (this.activeTab === 'schedule') {
                    return this.loadScheduleGames()
                }
                return this.loadGames()
            },
            loadGames() {
                this.loading = true
                return Promise.all([
                    fetchAdminGames({ filled: this.activeTab === 'filled' }),
                    fetchAdminGamesSchedule(),
                ])
                    .then(([games, allGames]) => {
                        const bracketMap = enrichGamesWithBracket(allGames)
                        this.games = games.map((game) => initAdminResultGame(game, bracketMap))
                    })
                    .finally(() => {
                        this.loading = false
                    })
            },
            adminTeamLabel(displayTeam) {
                if (displayTeam == null) {
                    return 'À déterminer'
                }

                if (displayTeam.type === 'team') {
                    return displayTeam.countryName
                }

                if (displayTeam.type === 'slot') {
                    return displayTeam.label
                }

                return displayTeam.label || 'À déterminer'
            },
            adminTeamFlag(displayTeam) {
                if (displayTeam != null && displayTeam.type === 'team') {
                    return displayTeam.countryCode
                }

                return null
            },
            refreshGamesBracketDisplay() {
                if (this.games.length === 0) {
                    return Promise.resolve()
                }

                return fetchAdminGamesSchedule()
                    .then((allGames) => {
                        const bracketMap = enrichGamesWithBracket(allGames)
                        this.games = this.games.map((game) => {
                            const enriched = applyBracketStateToGame(game, bracketMap)
                            return Object.assign({}, game, {
                                displayTeamA: buildTeamDisplay(enriched, 'A', 'live'),
                                displayTeamB: buildTeamDisplay(enriched, 'B', 'live'),
                            })
                        })
                    })
            },
            loadScheduleGames() {
                this.loading = true
                return fetchAdminGamesSchedule()
                    .then((games) => {
                        this.scheduleGames = games.map(initScheduleGame)
                    })
                    .finally(() => {
                        this.loading = false
                    })
            },
            isKnockoutGame(game) {
                return game.phase != null && game.phase !== 'Groupes'
            },
            showPenalties(game) {
                if (!this.isKnockoutGame(game)) {
                    return false
                }

                const goalsA = Number(game.goalsTeamA)
                const goalsB = Number(game.goalsTeamB)
                return !Number.isNaN(goalsA) && !Number.isNaN(goalsB) && goalsA === goalsB
            },
            parseOptionalScore(value) {
                if (value === '' || value == null) {
                    return null
                }

                return Number(value)
            },
            saveGame(game) {
                if (game.riskHappened !== true && game.riskHappened !== false) {
                    game.saveError = 'Indique si la risquette est réalisée ou non.'
                    return
                }

                const goalsTeamA = Number(game.goalsTeamA)
                const goalsTeamB = Number(game.goalsTeamB)
                const penaltiesTeamA = this.parseOptionalScore(game.penaltiesTeamA)
                const penaltiesTeamB = this.parseOptionalScore(game.penaltiesTeamB)

                if (this.showPenalties(game)) {
                    const hasPenaltiesA = penaltiesTeamA != null
                    const hasPenaltiesB = penaltiesTeamB != null
                    if (hasPenaltiesA !== hasPenaltiesB) {
                        game.saveError = 'Renseigne les deux scores aux tirs au but, ou aucun.'
                        return
                    }

                    if (hasPenaltiesA && penaltiesTeamA === penaltiesTeamB) {
                        game.saveError = 'Les tirs au but ne peuvent pas être à égalité.'
                        return
                    }
                }

                game.saving = true
                game.saveError = null
                game.saveOk = false

                const payload = {
                    goalsTeamA,
                    goalsTeamB,
                    riskHappened: game.riskHappened === true || game.riskHappened === 'true',
                }

                if (this.showPenalties(game)) {
                    payload.penaltiesTeamA = penaltiesTeamA
                    payload.penaltiesTeamB = penaltiesTeamB
                } else {
                    payload.penaltiesTeamA = null
                    payload.penaltiesTeamB = null
                }

                saveAdminGame(game.gameId, payload)
                    .then((result) => {
                        game.saveOk = true
                        const count = result.pronosticsUpdated || 0
                        if (count > 0) {
                            this.calculateMessage = `${count} pronostic(s) mis à jour.`
                        }
                        if (this.activeTab === 'pending') {
                            const index = this.games.indexOf(game)
                            if (index !== -1) {
                                this.games.splice(index, 1)
                            }
                            this.refreshGamesBracketDisplay()
                        }
                    })
                    .catch((err) => {
                        game.saveError = err.message
                    })
                    .finally(() => {
                        game.saving = false
                    })
            },
            saveScheduleGame(game) {
                const city = canonicalCityName(game.editCity) || game.editCity
                if (canonicalCityName(game.editCity) == null) {
                    game.saveError = 'Ville inconnue — choisis une ville de la liste.'
                    return
                }
                if (!buildSchedulePreview(game.editDate, game.editTime, city).valid) {
                    game.saveError = 'Date et heure sont obligatoires.'
                    return
                }

                game.saving = true
                game.saveError = null
                game.saveOk = false

                saveAdminGameSchedule(game.gameId, {
                    gameName: game.editName,
                    phase: game.editPhase,
                    stadium: game.editStadium,
                    city,
                    date: game.editDate,
                    time: normalizeScheduleTime(game.editTime),
                })
                    .then((result) => {
                        game.saveOk = true
                        const updated = result.game
                        game.gameName = updated.gameName
                        game.phase = updated.phase
                        game.stadium = updated.stadium
                        game.city = updated.city
                        game.startsAt = updated.startsAt
                        const venue = startsAtToVenueDateTime(updated.startsAt, updated.city)
                        if (venue != null) {
                            game.editCity = updated.city
                            game.editDate = venue.date
                            game.editTime = venue.time
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
        max-width: 900px;
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

    .admin-input--filter {
        max-width: 320px;
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

    .admin-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-bottom: 16px;
    }

    @media (min-width: 500px) {
        .admin-tabs {
            justify-content: flex-start;
        }
    }

    .btn.admin-tab {
        margin: 0;
    }

    .btn.admin-tab.admin-tab--active {
        background: #4db788;
        border-color: #49996f;
        box-shadow: 0 2px 0 #49996f;
        color: #fff;
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

    .admin-penalties {
        margin-bottom: 12px;
    }

    .admin-penalties-hint {
        color: #555;
        font-size: 0.95rem;
        margin: 0 0 8px;
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

    .admin-schedule-fields {
        display: grid;
        gap: 12px 16px;
        grid-template-columns: 1fr;
        margin-bottom: 12px;
    }

    @media (min-width: 600px) {
        .admin-schedule-fields {
            grid-template-columns: 1fr 1fr;
        }
    }

    .admin-schedule-field {
        display: block;
    }

    .admin-schedule-field .admin-input {
        margin-bottom: 0;
        margin-top: 4px;
    }

    .admin-schedule-actions {
        margin-bottom: 12px;
        margin-top: 4px;
    }

    .admin-schedule-actions .btn {
        display: block;
        width: 100%;
    }

    @media (min-width: 500px) {
        .admin-schedule-actions .btn {
            display: inline-block;
            width: auto;
        }
    }

    .admin-game--schedule {
        margin-bottom: 24px;
    }

    @media (max-width: 849px) {
        .admin-game--schedule:last-child {
            margin-bottom: 80px;
        }
    }
</style>
