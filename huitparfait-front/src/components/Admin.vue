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

                    <div class="admin-timezone-info" v-if="isKnownScheduleCity(game)">
                        <p>Fuseau du lieu : <strong>{{* scheduleVenueTzLabel(game) }}</strong>
                            ({{* timezoneForCity(game.editCity) }})</p>
                        <p v-if="scheduleParisPreview(game)">
                            Équivalent Paris : {{* scheduleParisPreview(game) }}
                        </p>
                        <p v-if="!hasValidScheduleDateTime(game)" class="admin-timezone-hint">
                            Saisis une date et une heure valides pour prévisualiser l’équivalent Paris.
                        </p>
                    </div>
                    <p class="admin-message admin-message--error"
                            v-if="!isKnownScheduleCity(game) && game.editCity">
                        Ville inconnue — choisis une ville de la liste pour gérer le fuseau horaire.
                    </p>

                    <p class="admin-message admin-message--error" v-if="game.saveError">{{* game.saveError }}</p>
                    <p class="admin-message admin-message--ok" v-if="game.saveOk">Enregistré.</p>
                    <btn @click="saveScheduleGame(game)" :disabled="game.saving">
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
        KNOWN_CITIES,
        canonicalCityName,
        formatTimeInZone,
        formatVenueTimeZoneLabel,
        startsAtToVenueDateTime,
        timezoneForCity,
        venueDateTimeToStartsAtMs,
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

    export default {
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
                knownCities: KNOWN_CITIES,
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
            timezoneForCity,
            formatDate(startsAt) {
                return moment(startsAt).format('dddd D MMMM YYYY [à] HH[h]mm')
            },
            normalizeScheduleCity(city) {
                return canonicalCityName(city) || (city == null ? '' : String(city).trim().replace(/\s+/g, ' '))
            },
            isKnownScheduleCity(game) {
                return canonicalCityName(game.editCity) != null
            },
            clearScheduleSaveError(game) {
                game.saveError = null
                game.saveOk = false
            },
            scheduleCityOptions(game) {
                const options = this.knownCities.slice()
                const current = this.normalizeScheduleCity(game.editCity)
                if (current && options.indexOf(current) === -1) {
                    options.unshift(current)
                }
                return options
            },
            hasValidScheduleDateTime(game) {
                const date = game.editDate
                const time = this.normalizeScheduleTime(game.editTime)
                if (!date || !time) {
                    return false
                }
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return false
                }
                if (!/^\d{2}:\d{2}$/.test(time)) {
                    return false
                }
                return venueDateTimeToStartsAtMs(date, time, this.normalizeScheduleCity(game.editCity)) != null
            },
            normalizeScheduleTime(time) {
                if (time == null || time === '') {
                    return ''
                }
                const match = String(time).trim().match(/^(\d{2}):(\d{2})/)
                return match ? `${match[1]}:${match[2]}` : ''
            },
            scheduleVenueTzLabel(game) {
                if (!this.hasValidScheduleDateTime(game)) {
                    return null
                }
                const startsAt = venueDateTimeToStartsAtMs(
                    game.editDate,
                    this.normalizeScheduleTime(game.editTime),
                    this.normalizeScheduleCity(game.editCity),
                )
                return formatVenueTimeZoneLabel(startsAt, this.normalizeScheduleCity(game.editCity))
            },
            scheduleParisPreview(game) {
                if (!this.hasValidScheduleDateTime(game)) {
                    return null
                }
                const startsAt = venueDateTimeToStartsAtMs(
                    game.editDate,
                    this.normalizeScheduleTime(game.editTime),
                    this.normalizeScheduleCity(game.editCity),
                )
                return formatTimeInZone(startsAt, 'Europe/Paris')
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
                return fetchAdminGames({ filled: this.activeTab === 'filled' })
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
                const city = this.normalizeScheduleCity(game.editCity)
                if (canonicalCityName(game.editCity) == null) {
                    game.saveError = 'Ville inconnue — choisis une ville de la liste.'
                    return
                }
                if (!this.hasValidScheduleDateTime(game)) {
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
                    time: this.normalizeScheduleTime(game.editTime),
                })
                    .then((result) => {
                        game.saveOk = true
                        const updated = result.game
                        game.gameName = updated.gameName
                        game.phase = updated.phase
                        game.stadium = updated.stadium
                        game.city = updated.city
                        game.editCity = updated.city
                        game.startsAt = updated.startsAt
                        const venue = startsAtToVenueDateTime(updated.startsAt, updated.city)
                        if (venue != null) {
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

    .admin-timezone-info {
        background: #f4f8f6;
        border-radius: 6px;
        color: #444;
        font-size: 0.9em;
        margin-bottom: 12px;
        padding: 10px 12px;
    }

    .admin-timezone-info p {
        margin: 0 0 4px;
    }

    .admin-timezone-info p:last-child {
        margin-bottom: 0;
    }

    .admin-timezone-hint {
        color: #666;
        font-size: 0.85em;
        font-style: italic;
    }
</style>
