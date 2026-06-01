import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Config from '../infra/config.js'
import {
    buildOgMetaTags,
    injectMetaIntoHtml,
    requestOrigin,
    resolveOgImage,
} from '../infra/og-html.js'

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const publicIndexHtml = path.join(packageRoot, 'public/index.html')

const GROUP_ID_PATTERN = /^[a-zA-Z0-9-_]{7,14}$/

let cachedIndexHtml

async function loadIndexHtml() {
    if (cachedIndexHtml != null) {
        return cachedIndexHtml
    }

    if (Config.get('proxy.serveStaticFront')) {
        cachedIndexHtml = await fs.readFile(publicIndexHtml, 'utf8')
        return cachedIndexHtml
    }

    const frontUrl = Config.get('proxy.frontUrl').replace(/\/$/, '')
    const response = await fetch(`${frontUrl}/index.html`)

    if (!response.ok) {
        throw new Error(`Failed to load index.html from ${frontUrl}: ${response.status}`)
    }

    cachedIndexHtml = await response.text()
    return cachedIndexHtml
}

async function fetchGroupInvite(groupId) {
    const apiUrl = Config.get('proxy.apiUrl').replace(/\/$/, '')
    const response = await fetch(`${apiUrl}/api/groups/${encodeURIComponent(groupId)}/invite`)

    if (response.status === 404) {
        return null
    }

    if (!response.ok) {
        throw new Error(`Group invite API error ${response.status}`)
    }

    return response.json()
}

function buildInvitePageMeta({ group, origin, canonicalUrl }) {
    const defaultTitle = 'Le Grand 8 — Rejoindre un groupe'
    const defaultDescription = 'Rejoignez un groupe de pronostics foot entre amis sur Le Grand 8.'
    const defaultImage = `${origin}/static/logo_full_large.webp`

    if (group == null) {
        return {
            title: defaultTitle,
            description: defaultDescription,
            url: canonicalUrl,
            image: defaultImage,
        }
    }

    const memberLabel = group.userCount === 1 ? 'joueur' : 'joueurs'

    return {
        title: `Rejoindre « ${group.name} » — Le Grand 8`,
        description: `Rejoignez le groupe « ${group.name} » sur Le Grand 8 (${group.userCount} ${memberLabel}).`,
        url: canonicalUrl,
        image: resolveOgImage(group.avatarUrl, origin),
    }
}

export const plugin = {
    name: 'group-invite-page',
    register: async (server) => {
        server.route({
            method: 'GET',
            path: '/rejoindre/{groupId}/{groupName}',
            options: { auth: false },
            handler: async (request, h) => {
                const { groupId } = request.params

                if (!GROUP_ID_PATTERN.test(groupId)) {
                    return h.redirect('/').temporary()
                }

                const origin = requestOrigin(request)
                const canonicalUrl = `${origin}${request.path}`
                let group = null

                try {
                    group = await fetchGroupInvite(groupId)
                } catch (err) {
                    console.warn('Group invite preview:', err.message)
                }

                const meta = buildInvitePageMeta({ group, origin, canonicalUrl })
                const metaTags = buildOgMetaTags(meta)
                const indexHtml = await loadIndexHtml()
                const html = injectMetaIntoHtml(indexHtml, metaTags, {
                    title: meta.title,
                    description: meta.description,
                })

                return h.response(html).type('text/html')
            },
        })
    },
}
