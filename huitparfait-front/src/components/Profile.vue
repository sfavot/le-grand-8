<template>

    <div class="page--profile">
        <card-title>Vous êtes connecté en tant que :</card-title>

        <user :user="displayUser"></user>

        <card-title>Mise à jour du profil :</card-title>

        <form @submit.prevent="updateProfile" v-if="user != null && profile != null"
                :class="{ 'updateProfile--progress': updateProfileInPogress }">
            <card>
                <label class="inputLabel">
                    Prénom et Nom :
                    <input v-model="profile.name" type="text" class="input nameInput" placeholder="Mes collègues">
                </label>
                <label class="inputLabel">
                    Avatar (HTTPS uniquement) :
                    <input v-model="profile.avatarUrl" type="text" class="input avatarInput"
                            placeholder="https://les-super-logos.com/monimage.jpg">
                </label>
                <p class="avatarRestore" v-if="user.oAuthAvatarUrl && !profile.avatarUrl">
                    <button type="button" class="avatarRestoreBtn" @click="restoreOAuthAvatar">
                        Restaurer ma photo de profil Google
                    </button>
                </p>
                <label class="inputLabel">
                    Apparaître anonymement dans le classement général :
                    <input v-model="profile.isAnonymous" type="checkbox" class="checkbox isPublicCheckbox">
                </label>
                <div>
                    Si vous choisissez cette option, votre nom et votre avatar n'apparaîtront pas dans le classement
                    général.
                    Vous apparaîtrez en tant que <strong>{{ user.anonymousName }}</strong>.
                </div>
                <div class="btnBar">
                    <btn :disabled="updateProfileInPogress">Mettre à jour le profil</btn>
                </div>
            </card>
        </form>

        <card-title>Suppression du compte :</card-title>

        <card class="dangerZone">
            <p>
                La suppression de votre compte est définitive. Vos pronostics et vos adhésions aux groupes
                seront supprimés.
            </p>
            <div class="btnBar">
                <btn class="deleteAccountBtn" :disabled="deleteAccountInProgress" @click="deleteAccount">
                    Supprimer mon compte
                </btn>
            </div>
        </card>
    </div>

</template>

<script type="text/babel">

    import User from './User'
    import store from '../state/configureStore'
    import { deleteAccount, fetchCurrentUser, updateProfile } from '../state/actions/user'

    export default {
        components: {
            User,
        },
        data() {
            return {
                user: this.$select('user'),
                profile: null,
                updateProfileInPogress: false,
                deleteAccountInProgress: false,
            }
        },
        route: {
            data() {
                store.dispatch(fetchCurrentUser())
            },
        },
        computed: {
            displayUser() {
                if (this.user == null) {
                    return null
                }

                const customAvatarUrl = this.profile && this.profile.avatarUrl
                    ? this.profile.avatarUrl
                    : this.user.avatarUrl

                return {
                    ...this.user,
                    avatarUrl: customAvatarUrl || this.user.defaultAvatarUrl,
                }
            },
        },
        watch: {
            user(user) {

                if (user == null) {
                    this.profile = null
                    return
                }

                this.profile = {
                    name: user.name,
                    avatarUrl: user.avatarUrl != null ? user.avatarUrl : '',
                    isAnonymous: user.isAnonymous,
                }
            },
        },
        methods: {
            restoreOAuthAvatar() {
                this.profile.avatarUrl = this.user.oAuthAvatarUrl
            },
            updateProfile() {

                this.updateProfileInPogress = true

                store.dispatch(updateProfile(this.profile))
                        .then(() => {
                            this.updateProfileInPogress = false
                        })
                        .catch(() => {
                            this.updateProfileInPogress = false
                        })
            },
            deleteAccount() {

                // eslint-disable-next-line no-alert
                if (!window.confirm(
                    'Êtes-vous certain de vouloir supprimer définitivement votre compte ? '
                    + 'Cette action est irréversible.',
                )) {
                    return
                }

                this.deleteAccountInProgress = true

                store.dispatch(deleteAccount())
                    .catch(() => {
                        this.deleteAccountInProgress = false
                    })
            },
        },
    }

</script>

<style scoped>

    .updateProfile--progress {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .inputLabel {
        color: #777;
        display: block;
        font-style: italic;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .input {
        width: 100%;
    }

    .avatarRestore {
        margin: 0 0 10px;
    }

    .avatarRestoreBtn {
        background-color: #ddd;
        border: none;
        border-radius: 4px;
        box-shadow: 0 2px 0 #49996f;
        color: #346943;
        cursor: pointer;
        font-size: 15px;
        font-weight: bold;
        padding: 10px 12px;
    }

    .input,
    .checkbox {
        background-color: #f9f9f9;
        border: none;
        border-bottom: 1px solid #ddd;
        box-sizing: border-box;
        font-size: 16px;
        padding: 10px 8px 8px 8px;
        margin-top: 5px;
    }

    .btnBar {
        text-align: right;
        margin-top: 20px;
        text-align: right;
    }

    .dangerZone p {
        color: #777;
        line-height: 1.5;
        margin: 0;
    }

    .deleteAccountBtn {
        background-color: #f5d5d5;
        box-shadow: 0 2px 0 #a94442;
        color: #8b2e2e;
    }

</style>
