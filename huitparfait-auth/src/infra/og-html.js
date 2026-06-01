export function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

export function requestOrigin(request) {
    const forwardedProto = request.headers['x-forwarded-proto']
    const protocol = (typeof forwardedProto === 'string'
        ? forwardedProto.split(',')[0].trim()
        : null)
        || (request.server.info.protocol === 'https' ? 'https' : 'http')
    const host = request.headers['x-forwarded-host'] || request.info.host

    return `${protocol}://${host}`
}

export function resolveOgImage(avatarUrl, origin) {
    if (typeof avatarUrl === 'string' && avatarUrl.startsWith('https://')) {
        return avatarUrl
    }

    return `${origin}/static/logo_full_large.webp`
}

export function buildOgMetaTags({ title, description, url, image }) {
    const safeTitle = escapeHtml(title)
    const safeDescription = escapeHtml(description)
    const safeUrl = escapeHtml(url)
    const safeImage = escapeHtml(image)

    return [
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="Le Grand 8">`,
        `<meta property="og:title" content="${safeTitle}">`,
        `<meta property="og:description" content="${safeDescription}">`,
        `<meta property="og:url" content="${safeUrl}">`,
        `<meta property="og:image" content="${safeImage}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${safeTitle}">`,
        `<meta name="twitter:description" content="${safeDescription}">`,
        `<meta name="twitter:image" content="${safeImage}">`,
    ].join('\n    ')
}

export function injectMetaIntoHtml(html, metaTags, { title, description }) {
    const safeTitle = escapeHtml(title)
    const safeDescription = escapeHtml(description)

    let result = html

    if (/<title>[^<]*<\/title>/i.test(result)) {
        result = result.replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`)
    } else {
        result = result.replace(/<head[^>]*>/i, `$&\n    <title>${safeTitle}</title>`)
    }

    if (/<meta\s+name=description/i.test(result)) {
        result = result.replace(
            /<meta\s+name=description[^>]*>/i,
            `<meta name="description" content="${safeDescription}">`,
        )
    }

    return result.replace(/<\/head>/i, `    ${metaTags}\n</head>`)
}
