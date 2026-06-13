import fetchPonyfill from 'fetch-ponyfill'

const fetch = fetchPonyfill()

/** Mot de passe admin en mémoire uniquement (pas de sessionStorage, perdu au rechargement). */
let adminPassword = null

export function getStoredAdminPassword() {
    return adminPassword
}

export function setAdminPassword(password) {
    adminPassword = password
}

export function clearAdminAuth() {
    adminPassword = null
}

export function fetchAdminGames({ filled = false } = {}) {
    const query = filled ? '?filled=true' : ''
    return adminRequest(`/admin/games${query}`)
}

export function fetchAdminGamesSchedule() {
    return adminRequest('/admin/games/schedule')
}

export function saveAdminGame(gameId, payload) {
    return adminRequest(`/admin/games/${gameId}`, { method: 'PUT', body: payload })
}

export function saveAdminGameSchedule(gameId, payload) {
    return adminRequest(`/admin/games/${gameId}/schedule`, { method: 'PUT', body: payload })
}

export function calculateAdminPoints() {
    return adminRequest('/admin/calculate', { method: 'POST' })
}

function adminRequest(url, opts = {}) {
    const password = getStoredAdminPassword()
    if (password == null) {
        return Promise.reject(new Error('Mot de passe admin non renseigné'))
    }

    if (opts.body) {
        opts.body = JSON.stringify(opts.body)
    }

    const config = Object.assign({}, opts, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Admin-Password': password,
        },
    })

    return fetch(process.env.API_URL + url, config)
        .then((response) => {
            if (response.status === 401) {
                clearAdminAuth()
                return Promise.reject(new Error('Session expirée ou mot de passe admin incorrect'))
            }

            if (response.status >= 200 && response.status < 300) {
                if (response.status === 204) {
                    return
                }
                return response.json()
            }

            return Promise.reject(new Error(response.statusText || 'Erreur serveur'))
        })
}
