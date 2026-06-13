<template>
    <div class="page--predictions">

        <template v-if="isPreviousMatchesPage && headerUser != null && gamesByDayList != null">
            <card-title v-if="isReadOnly">Matchs précédents de <em>{{* headerUser.name }}</em>&nbsp;</card-title>
            <card-title v-else>Mes matchs précédents</card-title>

            <card class="previous-matches-summary">
                <div class="previous-matches-summary-details">
                    <div class="previous-matches-summary-avatar--wrapper">
                        <img class="previous-matches-summary-avatar" :src="headerUser.avatarUrl">
                    </div>
                    <div class="previous-matches-summary-infos">
                        <div class="previous-matches-summary-name">{{* headerUser.name }}</div>
                        <div class="previous-matches-summary-stats">
                            <span class="previous-matches-summary-score">
                                <strong>{{ previousMatchesStats.totalScore }}</strong>{{ previousMatchesStats.totalScore | frenchPlural 'pt' }}
                            </span>
                            <span class="previous-matches-summary-with">avec</span>
                            <span class="previous-matches-summary-pronos">
                                <strong>{{ previousMatchesStats.nbPredictions }}</strong>
                                {{ previousMatchesStats.nbPredictions | frenchPlural 'prono' }}
                            </span>
                            <span class="previous-matches-summary-perfects"
                                    v-if="previousMatchesStats.nbPerfects > 0">
                                · <strong>{{ previousMatchesStats.nbPerfects }}</strong>
                                {{ previousMatchesStats.nbPerfects | frenchPlural 'grand 8' }}
                            </span>
                        </div>
                    </div>
                </div>
            </card>
        </template>

        <card v-if="showPreviousEmptyState" class="predictions-empty">
            <p><strong>{{ previousEmptyStateTitle }}</strong></p>
            <p>{{ previousEmptyStateMessage }}</p>
            <p v-if="!isReadOnly" class="predictions-empty-link">
                <link-btn v-link="{ name: 'predictions', params: { period: 'prochains-matchs' } }">
                    Voir les prochains matchs
                </link-btn>
            </p>
        </card>

        <div v-if="showUnfilledFilterToggle && !isReadOnly" class="predictions-filter">
            <btn class="predictions-filter-button" :class="{ 'predictions-filter-button--active': onlyUnfilledGames }"
                    @click="toggleOnlyUnfilledGames">
                Matchs non pronostiqués
            </btn>
        </div>

        <card v-if="showOnlyUnfilledEmptyState" class="predictions-empty">
            <p><strong>Tous les prochains matchs sont pronostiqués.</strong></p>
            <p>Tu peux revenir à l'affichage complet pour consulter ou modifier tes pronostics.</p>
        </card>

        <div class="day" v-for="day in displayedDaysWithSections" track-by="gameDate">

            <card-title v-if="!isNextMatchesPage" class="gameDate">{{* day.gameDate | date}}</card-title>

            <div class="phaseSection" v-for="section in day.phaseSections" track-by="phase">

                <card-title v-if="isNextMatchesPage && section.phaseLabel" class="gameDatePhase">
                    <span class="gameDate">{{* day.gameDate | date }}</span> - {{* section.phaseLabel }}
                </card-title>

                <card-list wide class="games">

                <card wide class="game"
                        :class="gameCardClass(game)"
                        v-for="game in section.games" track-by="gameId">

                    <div class="game-header">
                        <div class="game-name">
                            {{* game.gameName}} -
                            <span v-if="game.phase ==='Groupes'">Groupe {{* game.group}}</span>
                            <span v-else>{{* game.phase}}</span>
                        </div>
                        <div class="game-location">{{* game.stadium}} ({{* game.city}})</div>
                    </div>

                    <div class="game-teams">
                        <div class="game-teams-section">
                            <template v-if="!showBracketTeamSlots(game, 'A')">
                                <img v-if="game.bracketDisplayTeamA" class="flag"
                                        :src="flagSrc(game.bracketDisplayTeamA.countryCode)"
                                        @error="onFlagError"/>
                                <img v-if="!game.bracketDisplayTeamA" class="flag unknownTeam"
                                        src="../assets/unknown-team.svg"/>
                                <div class="game-countryName">{{* game.bracketDisplayTeamA ? game.bracketDisplayTeamA.countryName : game.countryNameTeamA }}</div>
                            </template>
                            <template v-else>
                                <img class="flag unknownTeam" src="../assets/unknown-team.svg"/>
                                <div class="game-slotLabel">{{* game.countryNameTeamA}}</div>
                                <div v-for="candidate in game.bracketCandidatesTeamA" class="game-resolvedTeam"
                                        track-by="source">
                                    <img class="flag resolvedFlag"
                                            :src="flagSrc(candidate.team.countryCode)"
                                            @error="onFlagError"/>
                                    <div class="game-countryName">{{* candidate.team.countryName }}</div>
                                    <div v-if="bracketResolvedSourceLabel(candidate.source)"
                                            class="game-resolvedSource">{{* bracketResolvedSourceLabel(candidate.source) }}</div>
                                </div>
                            </template>
                        </div>
                        <div class="game-teams-section">
                            <div v-if="isGameFinishedForPeriod(game)"
                                 class="game-score">{{* game.goalsTeamA}} - {{* game.goalsTeamB}}
                            </div>
                            <div v-if="hasScoreWithPenalties(game) && isGameFinishedForPeriod(game)"
                                 class="game-penalties">Tab. {{* game.penaltiesTeamA}} - {{* game.penaltiesTeamB}}
                            </div>
                            <div v-if="!isGameFinishedForPeriod(game)" class="game-time">
                                <div>{{* game.startsAt | time}}</div>
                                <div v-if="venueTimeLabel(game)" class="game-time-venue">{{* venueTimeLabel(game) }}</div>
                            </div>
                        </div>
                        <div class="game-teams-section">
                            <template v-if="!showBracketTeamSlots(game, 'B')">
                                <img v-if="game.bracketDisplayTeamB" class="flag"
                                        :src="flagSrc(game.bracketDisplayTeamB.countryCode)"
                                        @error="onFlagError"/>
                                <img v-if="!game.bracketDisplayTeamB" class="flag unknownTeam"
                                        src="../assets/unknown-team.svg"/>
                                <div class="game-countryName">{{* game.bracketDisplayTeamB ? game.bracketDisplayTeamB.countryName : game.countryNameTeamB }}</div>
                            </template>
                            <template v-else>
                                <img class="flag unknownTeam" src="../assets/unknown-team.svg"/>
                                <div class="game-slotLabel">{{* game.countryNameTeamB}}</div>
                                <div v-for="candidate in game.bracketCandidatesTeamB" class="game-resolvedTeam"
                                        track-by="source">
                                    <img class="flag resolvedFlag"
                                            :src="flagSrc(candidate.team.countryCode)"
                                            @error="onFlagError"/>
                                    <div class="game-countryName">{{* candidate.team.countryName }}</div>
                                    <div v-if="bracketResolvedSourceLabel(candidate.source)"
                                            class="game-resolvedSource">{{* bracketResolvedSourceLabel(candidate.source) }}</div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <p v-if="showWaitingForTeamsMessage(game)" class="game-waiting">
                        {{* waitingForTeamsMessage(game) }}
                    </p>

                    <fieldset class="game-form" :disabled="isPredictionInputsDisabled(game) || isReadOnly">
                    <div class="game-inputs">
                        <div class="game-scoreInput">
                            <input v-model="game.predictionScoreTeamA" @change="setPredictionUnsaved(game)"
                                    class="game-scoreInputField" type="number" name="goalsTeamA"
                                    onfocus="this.select()"/>
                        </div>
                        <div class="game-scoreInput"><!-- Dummy element to align flex items --></div>
                        <div class="game-scoreInput">
                            <input v-model="game.predictionScoreTeamB" @change="setPredictionUnsaved(game)"
                                    class="game-scoreInputField" type="number" name="goalsTeamB"
                                    onfocus="this.select()"/>
                        </div>
                    </div>

                    <div class="game-risk">
                        <span v-if="game.riskHappened == null || !isGameFinishedForPeriod(game)"
                                class="game-risk-titlePrefix">Risquette :</span>
                        <span v-if="game.riskHappened === true && isGameFinishedForPeriod(game)"
                                class="game-risk-titlePrefix"
                                :class="{ rightAnswer: wasRightAboutRisk(game) === true, wrongAnswer: wasRightAboutRisk(game) === false }">Risquette vraie :</span>
                        <span v-if="game.riskHappened === false && isGameFinishedForPeriod(game)"
                                class="game-risk-titlePrefix"
                                :class="{ rightAnswer: wasRightAboutRisk(game) === true, wrongAnswer: wasRightAboutRisk(game) === false }">Risquette fausse :</span>
                        <span class="game-risk-title">{{* game.riskTitle}}</span>

                        <div class="game-risk-input">
                            <div class="game-risk-answer game-risk-trueOrFalse">
                                <div class="game-risk-answerHeader">Réponse</div>

                                <div class="game-risk-answerChoiceGroup">
                                    <div class="game-risk-answerChoice">
                                        <input v-model="game.predictionRiskAnswer" type="radio" :value="true"
                                                @change="setPredictionUnsaved(game)" name="riskAnswer{{* game.gameId}}"
                                                id="yes{{* game.gameId}}"/>
                                        <label for="yes{{* game.gameId}}">VRAI</label>
                                    </div>

                                    <div class="game-risk-answerChoice">
                                        <input v-model="game.predictionRiskAnswer" type="radio" :value="false"
                                                @change="setPredictionUnsaved(game)" name="riskAnswer{{* game.gameId}}"
                                                id="no{{* game.gameId}}"/>
                                        <label for="no{{* game.gameId}}">FAUX</label>
                                    </div>

                                    <div class="game-risk-answerChoice noAnswer">
                                        <input v-model="game.predictionRiskAnswer" type="radio" :value="null"
                                                @change="setPredictionUnsaved(game)" name="riskAnswer{{* game.gameId}}"
                                                id="dunno{{* game.gameId}}"/>
                                        <label class="game-risk-answerChoice--multiline"
                                                for="dunno{{* game.gameId}}">Je ne sais pas</label>
                                    </div>
                                </div>
                            </div>
                            <div class="game-risk-answer game-risk-riskedPoints">
                                <div class="game-risk-answerHeader">Risquer</div>
                                <div class="game-risk-answerNoRisk" v-show="game.predictionRiskAnswer == null">
                                    Aucun point risqué
                                </div>
                                <div v-show="game.predictionRiskAnswer != null"
                                        class="game-risk-answerChoiceGroup">
                                    <div class="game-risk-answerChoice">
                                        <input v-model="game.predictionRiskAmount" type="radio" :value="1"
                                                @change="setPredictionUnsaved(game)" name="riskAmount{{* game.gameId}}"
                                                id="riskAmount1{{* game.gameId}}"/>
                                        <label for="riskAmount1{{* game.gameId}}">1 pt</label>
                                    </div>

                                    <div class="game-risk-answerChoice">
                                        <input v-model="game.predictionRiskAmount" type="radio" :value="2"
                                                @change="setPredictionUnsaved(game)" name="riskAmount{{* game.gameId}}"
                                                id="riskAmount2{{* game.gameId}}"/>
                                        <label for="riskAmount2{{* game.gameId}}">2 pts</label>
                                    </div>

                                    <div class="game-risk-answerChoice">
                                        <input v-model="game.predictionRiskAmount" type="radio" :value="3"
                                                @change="setPredictionUnsaved(game)" name="riskAmount{{* game.gameId}}"
                                                id="riskAmount3{{* game.gameId}}"/>
                                        <label for="riskAmount3{{* game.gameId}}">3 pts</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </fieldset>

                    <div class="game-submitZone" v-if="!isReadOnly">
                        <btn :inactive="game.unsaved !== true || !predictionIsValid(game)"
                                class="game-submitZone-button"
                                :class="{ disabled: !predictionIsValid(game) }"
                                @click="savePrediction(game)"
                                :disabled="isPredictionInputsDisabled(game)">Enregistrer
                        </btn>
                        <div class="game-submitZone-savedCheck" v-show="showPredictionSavedTick(game)"></div>
                        <div class="game-pointsExplanation"
                                v-if="isGameFinishedForPeriod(game) && game.points != null && game.points < 8">
                            {{* game.points}} pts : {{* game.classicPoints}} pts {{* game.riskPoints >= 0 ? '+' : '-'}}
                            {{* (game.riskPoints || 0) | abs}} pts (risquette)
                        </div>
                        <div class="game-pointsExplanation"
                                v-if="isGameFinishedForPeriod(game) && game.points == 8">
                            Grand 8 !
                        </div>
                    </div>

                    <div class="game-readOnlyFooter" v-if="isReadOnly">
                        <div class="game-pointsExplanation"
                                v-if="isGameFinishedForPeriod(game) && game.points != null && game.points < 8">
                            {{* game.points}} pts : {{* game.classicPoints}} pts {{* game.riskPoints >= 0 ? '+' : '-'}}
                            {{* (game.riskPoints || 0) | abs}} pts (risquette)
                        </div>
                        <div class="game-pointsExplanation"
                                v-if="isGameFinishedForPeriod(game) && game.points == 8">
                            Grand 8 !
                        </div>
                        <div class="game-pointsExplanation game-pointsExplanation--none"
                                v-if="isGameFinishedForPeriod(game) && !hasUserPrediction(game) && game.points == null">
                            Pas de pronostic
                        </div>
                    </div>

                </card>
            </card-list>

            </div>
        </div>

    </div>
</template>

<script type="text/babel">
    import Vue from 'vue'
    import store from '../state/configureStore'
    import { fetchPredictions, savePrediction } from '../state/actions/predictions'
    import { fetchUserPredictions as apiFetchUserPredictions } from '../WebApi'
    import _ from 'lodash'
    import { flagSrc, onFlagError } from '../flagSrc'
    import { isGameFinishedForPeriod as checkGameFinishedForPeriod } from '../gameFinishedUtils'
    import { formatDisplayDate, formatGameVenueTime, formatLocalTime } from '../gameTimeUtils'
    import {
        areProtagonistsConfirmed,
        hasUnknownProtagonists,
        isCountableForBadge,
        isPredictionInputsDisabled as isPredictionFormDisabled,
        isSubmissionClosed,
    } from '../predictionUtils'
    import {
        applyBracketStateToGame,
        bracketResolvedSourceLabel,
        buildPhaseSections,
        enrichGamesWithBracket,
    } from '../bracketUtils'

    export default {
        data() {
            return {
                predictions: this.$select('predictions'),
                predictionsAllGames: this.$select('predictionsAllGames'),
                gamesByDayList: null,
                onlyUnfilledGames: false,
                onlyUnfilledSnapshotByGameId: null,
                viewedUser: null,
                otherPredictions: null,
                user: this.$select('user'),
            }
        },
        computed: {
            isReadOnly() {
                return this.$route.name === 'userPredictions'
            },
            isPreviousMatchesPage() {
                return this.isReadOnly || this.$route.params.period === 'matchs-precedents'
            },
            headerUser() {
                if (this.isReadOnly) {
                    return this.viewedUser
                }

                if (this.$route.params.period === 'matchs-precedents' && this.user != null) {
                    return {
                        name: this.user.name,
                        avatarUrl: this.user.avatarUrl || this.user.defaultAvatarUrl,
                    }
                }

                return null
            },
            previousMatchesStats() {
                if (this.gamesByDayList == null) {
                    return {
                        totalScore: 0,
                        nbPredictions: 0,
                        nbPerfects: 0,
                    }
                }

                const scoredGames = _(this.gamesByDayList)
                    .map('games')
                    .flatten()
                    .filter((game) => game.points != null)
                    .value()

                return {
                    totalScore: _.sumBy(scoredGames, 'points'),
                    nbPredictions: scoredGames.length,
                    nbPerfects: scoredGames.filter((game) => game.points === 8).length,
                }
            },
            isNextMatchesPage() {
                return !this.isReadOnly && this.$route.params.period === 'prochains-matchs'
            },
            bracketMap() {
                if (!this.isNextMatchesPage || this.predictionsAllGames == null) {
                    return null
                }

                return enrichGamesWithBracket(this.predictionsAllGames)
            },
            displayedDaysWithSections() {
                if (this.displayedGamesByDayList == null) {
                    return null
                }

                return this.displayedGamesByDayList.map((day) => {
                    const games = day.games

                    if (!this.isNextMatchesPage) {
                        return {
                            gameDate: day.gameDate,
                            phaseSections: [{
                                phase: null,
                                phaseLabel: null,
                                games,
                            }],
                        }
                    }

                    return {
                        gameDate: day.gameDate,
                        phaseSections: buildPhaseSections(games)
                            .filter((section) => section.games.length > 0),
                    }
                })
            },
            showPreviousEmptyState() {
                const isPreviousPage = this.isReadOnly ||
                    this.$route.params.period === 'matchs-precedents'

                return isPreviousPage &&
                    this.gamesByDayList != null &&
                    this.gamesByDayListIsEmpty(this.gamesByDayList)
            },
            showUnfilledFilterToggle() {
                return this.$route.params.period === 'prochains-matchs' &&
                    this.gamesByDayList != null &&
                    !this.gamesByDayListIsEmpty(this.gamesByDayList)
            },
            displayedGamesByDayList() {
                if (this.gamesByDayList == null || this.onlyUnfilledGames !== true) {
                    return this.gamesByDayList
                }

                if (this.onlyUnfilledSnapshotByGameId == null) {
                    return this.gamesByDayList
                }

                return _(this.gamesByDayList)
                    .map((day) => ({
                        gameDate: day.gameDate,
                        games: _.filter(day.games, (game) => this.onlyUnfilledSnapshotByGameId[game.gameId] === true),
                    }))
                    .reject((day) => _.isEmpty(day.games))
                    .value()
            },
            showOnlyUnfilledEmptyState() {
                return this.onlyUnfilledGames === true &&
                    this.displayedGamesByDayList != null &&
                    this.gamesByDayListIsEmpty(this.displayedGamesByDayList)
            },
            previousEmptyStateTitle() {
                if (this.isReadOnly && this.viewedUser != null) {
                    return `Aucun match passé pour ${this.viewedUser.name}.`
                }

                return 'Rien ici pour l\'instant.'
            },
            previousEmptyStateMessage() {
                return 'Les matchs passés s\'afficheront ici une fois leur score renseigné, environ 2 heures après le coup d\'envoi.'
            },
        },
        ready() {
            this.syncGamesByDayFromStore()
        },
        route: {
            data() {
                this.onlyUnfilledGames = false
                this.onlyUnfilledSnapshotByGameId = null

                if (this.$route.name === 'userPredictions') {
                    this.viewedUser = null
                    this.otherPredictions = null
                    this.gamesByDayList = null

                    return apiFetchUserPredictions(
                        this.$route.params.userId,
                        'matchs-precedents',
                        this.$route.query.groupId,
                    )
                        .then(({ user, predictions }) => {
                            this.viewedUser = user
                            this.otherPredictions = predictions
                            this.syncGamesByDayFromSource(predictions)
                        })
                }

                this.viewedUser = null
                this.otherPredictions = null

                switch (this.$route.params.period) {
                    case 'matchs-precedents':
                        return store.dispatch(fetchPredictions('previous-days'))
                            .then(() => this.syncGamesByDayFromStore())
                    case 'prochains-matchs':
                        return store.dispatch(fetchPredictions('next-days'))
                            .then(() => this.syncGamesByDayFromStore())
                    default:
                        return store.dispatch(fetchPredictions())
                            .then(() => this.syncGamesByDayFromStore())
                }
            },
        },
        watch: {
            predictions() {
                this.syncGamesByDayFromStore()
            },
            predictionsAllGames() {
                this.reapplyBracketStateToGames()
            },
        },
        methods: {
            flagSrc,
            onFlagError,
            bracketResolvedSourceLabel,
            isSubmissionClosed,
            gameCardClass(game) {
                return {
                    'game--submissionDisabled': this.isSubmissionClosed(game),
                    'game--locked': this.isPredictionFormLocked(game),
                    'game--unsaved': game.unsaved,
                }
            },
            isPredictionFormLocked(game) {
                if (!this.isNextMatchesPage || this.isSubmissionClosed(game)) {
                    return false
                }

                return !areProtagonistsConfirmed(this.bracketMap, game)
            },
            showBracketTeamSlots(game, side) {
                if (!this.isNextMatchesPage) {
                    return false
                }

                return side === 'A' ? game.bracketSlotUncertainA : game.bracketSlotUncertainB
            },
            hasUnknownTeams(game) {
                if (!this.isNextMatchesPage) {
                    return false
                }

                return hasUnknownProtagonists(game, this.bracketMap)
            },
            showWaitingForTeamsMessage(game) {
                if (this.isSubmissionClosed(game) || !this.isNextMatchesPage) {
                    return false
                }

                return this.hasUnknownTeams(game) || this.isPredictionFormLocked(game)
            },
            waitingForTeamsMessage(game) {
                if (this.hasUnknownTeams(game)) {
                    return 'En attente des qualifiés'
                }

                return 'Pronostic possible quand les qualifiés seront officiels'
            },
            isPredictionInputsDisabled(game) {
                return isPredictionFormDisabled(game, this.bracketMap)
            },
            syncGamesByDayFromStore() {
                this.syncGamesByDayFromSource(this.predictions)
            },
            syncGamesByDayFromSource(predictionsByDay) {
                if (predictionsByDay == null) {
                    this.gamesByDayList = null
                    return
                }

                const bracketMap = this.bracketMap

                this.gamesByDayList = _(predictionsByDay)
                    .map((games, dayKey) => ({
                        gameDate: Number(dayKey),
                        games: _.cloneDeep(games)
                            .map((game) => applyBracketStateToGame(game, bracketMap)),
                    }))
                    .sortBy('gameDate')
                    .value()
            },
            reapplyBracketStateToGames() {
                if (this.gamesByDayList == null) {
                    this.syncGamesByDayFromStore()
                    return
                }

                const bracketMap = this.bracketMap

                this.gamesByDayList = this.gamesByDayList.map((day) => ({
                    gameDate: day.gameDate,
                    games: day.games.map((game) => {
                        const bracketFields = applyBracketStateToGame(game, bracketMap)

                        return Object.assign({}, bracketFields, {
                            predictionScoreTeamA: game.predictionScoreTeamA,
                            predictionScoreTeamB: game.predictionScoreTeamB,
                            predictionRiskAnswer: game.predictionRiskAnswer,
                            predictionRiskAmount: game.predictionRiskAmount,
                            unsaved: game.unsaved,
                        })
                    }),
                }))
            },
            gamesByDayListIsEmpty(gamesByDayList) {
                return _(gamesByDayList).map('games').flatten().isEmpty()
            },
            hasScore: function (game) {
                return game.goalsTeamA != null &&
                    game.goalsTeamB != null
            },

            hasScoreWithPenalties: function (game) {
                return this.hasScore(game) &&
                    game.penaltiesTeamA != null &&
                    game.penaltiesTeamB != null
            },
            setPredictionUnsaved: function (game) {
                Vue.set(game, 'unsaved', true)
            },
            findGameById(gameId) {
                if (this.gamesByDayList == null) {
                    return null
                }

                for (const day of this.gamesByDayList) {
                    const game = _.find(day.games, { gameId })
                    if (game != null) {
                        return game
                    }
                }

                return null
            },
            setPredictionSaved: function (game) {
                const currentGame = this.findGameById(game.gameId) || game
                Vue.set(currentGame, 'unsaved', false)
            },
            showPredictionSavedTick: function (game) {
                // Do not show the tick when the results are available
                // Show it when the game has just been saved (game.unsaved === false)
                // Also show it when we've just laoded the page and the prediction is valid (game.unsaved == null but prediction valid)
                return !this.isGameFinishedForPeriod(game) && (game.unsaved === false || (game.unsaved == null && this.predictionIsValid(game)))
            },
            isGameFinishedForPeriod: checkGameFinishedForPeriod,
            hasUserPrediction(game) {
                return game.predictionScoreTeamA != null && game.predictionScoreTeamB != null
            },
            wasRightAboutRisk: function (game) {
                if (game.predictionRiskAnswer == null) {
                    return null
                }
                return game.predictionRiskAnswer === game.riskHappened
            },
            predictionIsValid: function (game) {
                // Wrong value types in fields
                if (isNaN(game.predictionRiskAmount) || game.predictionRiskAmount <= 0 ||
                        isNaN(game.predictionScoreTeamA) || game.predictionScoreTeamA < 0 ||
                        isNaN(game.predictionScoreTeamB) || game.predictionScoreTeamB < 0
                ) {
                    return false
                }

                // No risk amount selected even though an answer to the risk is provided
                if (game.predictionRiskAnswer != null &&
                        game.predictionRiskAmount <= 0) {
                    return false
                }

                return true
            },
            venueTimeLabel(game) {
                return formatGameVenueTime(game.startsAt, game.city)
            },
            buildOnlyUnfilledSnapshotByGameId() {
                if (this.gamesByDayList == null) {
                    return {}
                }

                return _(this.gamesByDayList)
                    .map('games')
                    .flatten()
                    .filter((game) => isCountableForBadge(game, this.bracketMap))
                    .map((game) => game.gameId)
                    .keyBy((gameId) => gameId)
                    .mapValues(() => true)
                    .value()
            },
            toggleOnlyUnfilledGames() {
                const nextState = !this.onlyUnfilledGames
                this.onlyUnfilledGames = nextState
                this.onlyUnfilledSnapshotByGameId = nextState ?
                    this.buildOnlyUnfilledSnapshotByGameId() :
                    null
            },
            savePrediction: function (game) {
                if (this.isPredictionInputsDisabled(game) ||
                        game.unsaved !== true ||
                        !this.predictionIsValid(game)) {
                    return
                }

                store.dispatch(savePrediction(game))
                        .then(() => {
                            this.setPredictionSaved(game)
                        })
                        .catch(() => {
                            this.setPredictionUnsaved(game)
                        })
            },
        },
        filters: {
            date: function (dayKey) {
                return formatDisplayDate(dayKey)
            },
            time: function (startsAt) {
                return formatLocalTime(startsAt)
            },
            abs: function (number) {
                return Math.abs(number)
            },
        },
    }
</script>

<style scoped>

    .predictions-empty p {
        margin: 0 0 0.75em;
    }

    .previous-matches-summary {
        margin-bottom: 15px;
    }

    .previous-matches-summary-details {
        align-items: center;
        display: flex;
    }

    .previous-matches-summary-avatar--wrapper {
        border-radius: 3px;
        flex-shrink: 0;
        height: 70px;
        margin-right: 15px;
        overflow: hidden;
        width: 70px;
    }

    .previous-matches-summary-avatar {
        display: block;
        height: 100%;
        object-fit: cover;
        width: 100%;
    }

    .previous-matches-summary-name {
        color: #333;
        font-size: 20px;
        font-weight: bold;
    }

    .previous-matches-summary-stats {
        color: #777;
        font-size: 15px;
        margin-top: 6px;
    }

    .previous-matches-summary-score {
        color: #333;
    }

    .previous-matches-summary-with {
        margin: 0 0.25em;
    }

    .previous-matches-summary-perfects {
        margin-left: 0.25em;
    }

    .predictions-empty-link {
        margin: 1em 0 0;
        text-align: center;
    }

    .predictions-filter {
        margin-bottom: 12px;
        text-align: center;
    }

    @media (min-width: 500px) {
        .predictions-filter {
            text-align: right;
        }
    }

    .btn.predictions-filter-button {
        margin: 0 auto;
    }

    .btn.predictions-filter-button.predictions-filter-button--active {
        background: #4db788;
        border-color: #49996f;
        box-shadow: 0 2px 0 #49996f;
        color: #fff;
    }

    .gameDate {
        text-transform: capitalize;
    }

    .gameDatePhase {
        text-transform: none;
    }

    .game-slotLabel {
        color: #777;
        font-size: 13px;
        font-weight: normal;
        margin-top: 8px;
    }

    .game-resolvedTeam {
        margin-top: 10px;
    }

    .game-resolvedTeam .resolvedFlag {
        height: 28px;
    }

    .game-resolvedSource {
        color: #888;
        font-size: 12px;
        font-style: italic;
        font-weight: normal;
        margin-top: 4px;
    }

    .game-waiting {
        background: #f5f5f5;
        border-bottom: 1px dashed #ddd;
        color: #666;
        font-size: 14px;
        font-style: italic;
        margin: 0;
        padding: 8px 15px;
        text-align: center;
    }

    .game-form {
        border: 0;
        margin: 0;
        min-width: 0;
        padding: 0;
    }

    .game.game--locked {
        opacity: 0.92;
    }

    .game--locked .game-scoreInputField {
        background: #ddd;
        color: #888;
    }

    .game--locked .game-risk-answer {
        opacity: 0.5;
    }

    .game--locked .game-risk-answerChoice label {
        cursor: default;
        pointer-events: none;
    }

    .game--locked .game-submitZone-button,
    .game--locked .game-submitZone-button:disabled {
        background: #ccc;
        border-color: #bbb;
        box-shadow: 0 2px 0 #bbb;
        color: #888;
        cursor: default;
        opacity: 1;
        pointer-events: none;
    }

    .card.game {
        padding: 0;
        padding-bottom: 60px;
    }

    .game {
        background-color: #fff;
        border-bottom: 2px solid #ddd;
        box-sizing: border-box;
        margin-bottom: 15px;
        overflow: hidden;
        position: relative;
        transition: background-color 0.2s,
    }

    @media (min-width: 500px) {
        .game {
            border: 1px solid #ddd;
            border-bottom-width: 2px;
            border-radius: 4px;
            margin: 0 8px 15px 8px;
        }
    }

    .game.game--unsaved {
        background-color: #FFFFCC;
        transition: background-color 0.2s,
    }

    .game-header {
        background: #eee;
        border-bottom: 1px solid #ddd;
        padding: 5px 15px;
    }

    .game-name {
        font-size: 15px;
        font-weight: bold;
    }

    .game-location {
        font-size: 15px;
        font-style: italic;
    }

    .game-teams {
        background: white;
        border-bottom: 1px dashed #ddd;
        display: flex;
        flex-direction: row;
        padding: 25px 15px 15px 15px;
    }

    .game-teams-section {
        flex: 1 1 0;
        text-align: center;
    }

    .flag {
        border: 1px solid #DDD;
        border-bottom-width: 2px;
        border-radius: 4px;
        height: 80px;
        width: auto;
        max-width: 100%;
    }

    .game-countryName {
        color: #333;
        font-weight: bold;
    }

    .game-time {
        color: #555;
        font-size: 18px;
        font-weight: bold;
        margin-top: 25px;
    }

    .game-time-venue {
        color: #888;
        font-size: 13px;
        font-weight: normal;
        margin-top: 4px;
    }

    .game-score {
        color: #49996f;
        font-size: 20px;
        font-weight: bold;
        margin-top: 25px;
    }

    .game-penalties {
        color: #b50101;
        font-size: 15px;
        font-weight: bold;
    }

    .game-inputs {
        display: flex;
        flex-direction: row;
        padding: 20px 0 5px;
    }

    .game-scoreInput {
        flex: 1 1 0;
    }

    .game-scoreInputField {
        border: 1px solid #ddd;
        border-bottom-width: 2px;
        border-radius: 4px;
        display: block;
        font-size: 20px;
        height: 30px;
        margin: auto;
        text-align: center;
        width: 60px;
    }

    .game--submissionDisabled .game-scoreInputField {
        background: #DDD;
    }

    .game-scoreInputField::-webkit-inner-spin-button,
    .game-scoreInputField::-webkit-outer-spin-button {
        display: none;
    }

    .game-risk {
        padding: 15px;
    }

    .game-risk-title {
        font-style: italic;
    }

    .game-risk-titlePrefix {
        font-weight: bold;
    }

    .game-risk-titlePrefix.rightAnswer {
        background: url('../assets/tick.svg') no-repeat;
        color: #49996f;
        padding-left: 20px;
    }

    .game-risk-titlePrefix.wrongAnswer {
        background: url('../assets/cross.svg') no-repeat;
        color: #b50101;
        padding-left: 20px;
    }

    .game-risk-input {
        font-size: 15px;
    }

    .game-risk-answer {
        padding: 10px;
        text-align: center;
    }

    .game--submissionDisabled .game-risk-answer {
        opacity: 0.5;
    }

    @media (min-width: 550px) {

        .game-risk-input {
            display: flex;
        }

        .game-risk-answer {
            flex: 1 1 0;
        }

        .game-risk-answer:first-child {
            padding-left: 0;
        }

        .game-risk-answer:last-child {
            padding-right: 0;
        }
    }

    .game-risk-answerHeader {
        font-weight: bold;
        margin-bottom: 10px;
    }

    .game-risk-answerNoRisk {
        padding: 8px 0;
    }

    .game-risk-answerChoiceGroup {
        display: flex;
    }

    .game-risk-answerChoice {
        margin: 0;
        padding: 0;
    }

    .game-risk-answerChoice {
        flex: 1 1 0;
        margin: 0;
        padding: 0;
    }

    .game-risk-answerChoice.noAnswer {
        flex: 2 1 0;
    }

    .game-risk-answerChoice input[type="radio"] {
        display: none;
    }

    .game-risk-answerChoice label {
        background: #eee;
        box-sizing: border-box;
        box-shadow: 0 2px 0 #ddd;
        cursor: pointer;
        display: inline-block;
        font-size: 14px;
        font-weight: bold;
        height: 40px;
        line-height: 40px;
        user-select: none;
        width: 100%;
    }

    .game-risk-answerChoice:first-child label {
        border-radius: 5px 0 0 5px;
    }

    .game-risk-answerChoice:last-child label {
        border-radius: 0 5px 5px 0;
    }

    .game-risk-answerChoice:nth-child(2) label {
        border-left: 1px solid #ddd;
        border-right: 1px solid #ddd;
    }

    .game-risk-answerChoice input[type="radio"]:checked + label {
        background: #aaa;
        box-shadow: 0 2px 0 #888;
        color: #fff;
    }

    .game-risk-answerChoice:nth-child(2) input[type="radio"]:checked + label {
        border: none;
    }

    .game-submitZone {
        border-top: 1px dashed #ddd;
        bottom: 0;
        height: 40px;
        left: 0;
        padding: 10px;
        position: absolute;
        right: 0;
    }

    @media (min-width: 500px) {
        .game-submitZone {
            background: #EEE;
            border-top-style: solid;
        }
    }

    .btn.game-submitZone-button {
        background: #4db788;
        border-color: #49996f;
        color: #fff;
        display: block;
        margin: auto;
    }

    .game--submissionDisabled .game-submitZone-button {
        display: none;
    }

    .game-submitZone-savedCheck {
        background: url('../assets/tick.svg') no-repeat;
        height: 25px;
        position: absolute;
        right: 20px;
        bottom: 15px;
        width: 25px;
        z-index: 1;
    }

    .game-pointsExplanation {
        color: #49996f;
        font-weight: bold;
        margin-top: 8px;
        text-align: center;
    }

    .game-readOnlyFooter {
        border-top: 1px dashed #ddd;
        bottom: 0;
        left: 0;
        padding: 10px;
        position: absolute;
        right: 0;
    }

    @media (min-width: 500px) {
        .game-readOnlyFooter {
            background: #EEE;
            border-top-style: solid;
        }
    }

    .game-pointsExplanation--none {
        color: #888;
        font-weight: normal;
    }


</style>
