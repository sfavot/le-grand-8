import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    buildOgMetaTags,
    escapeHtml,
    injectMetaIntoHtml,
    resolveOgImage,
} from '../src/infra/og-html.js'

describe('og-html', () => {
    it('échappe le HTML dans les meta', () => {
        assert.equal(escapeHtml('A & B <script>'), 'A &amp; B &lt;script&gt;')
    })

    it('utilise le logo du site si l’avatar n’est pas en HTTPS', () => {
        assert.equal(
            resolveOgImage('data:image/svg+xml;base64,abc', 'https://example.com'),
            'https://example.com/static/logo_full_large.webp',
        )
        assert.equal(
            resolveOgImage('https://cdn.example.com/g.png', 'https://example.com'),
            'https://cdn.example.com/g.png',
        )
    })

    it('injecte les balises Open Graph dans le head', () => {
        const html = '<html><head><title>X</title></head><body></body></html>'
        const tags = buildOgMetaTags({
            title: 'T',
            description: 'D',
            url: 'https://x/rejoindre/abc/g',
            image: 'https://x/static/logo_full_large.webp',
        })
        const out = injectMetaIntoHtml(html, tags, { title: 'T', description: 'D' })

        assert.match(out, /property="og:title" content="T"/)
        assert.match(out, /name="twitter:card" content="summary_large_image"/)
    })
})
