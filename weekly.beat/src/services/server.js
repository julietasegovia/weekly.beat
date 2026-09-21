import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getTopMatches, blurbForMatch } from './matchTracks.js'
import { buildTopTagsFromArtists } from './artistTags.js'

const PORT = process.env.PORT || 8787
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DB_PATH = path.resolve(__dirname, '../../../weekly.bot/candidates.db')
const DB_PATH = process.env.CANDIDATES_DB_PATH || DEFAULT_DB_PATH

const app = express()
app.use(cors())
app.use(express.json())

const db = new Database(DB_PATH, { readonly: true, fileMustExist: true })

async function fetchBandcampCover(pageUrl) {
    if (!pageUrl) return null
    try {
        const resp = await fetch(pageUrl, {
            headers: { 'User-Agent': 'weekly.beat/0.1 (recs)' },
            signal: AbortSignal.timeout(8000),
        })
        if (!resp.ok) return null
        const html = await resp.text()
        const og = html.match(
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        ) || html.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        )
        return og?.[1] || null
    } catch {
        return null
    }
}

app.post('/api/recs/weekly', async (req, res) => {
    const { topArtists, topGenres } = req.body

    const hasArtists = Array.isArray(topArtists)
    const hasGenres = Array.isArray(topGenres)

    if (!hasArtists && !hasGenres) {
        return res.status(400).json({
            error: 'Expected { topArtists: [{ name, playCount }, ...] } (preferred) or { topGenres }',
        })
    }

    try {
        let topTags = []
        if (hasArtists && topArtists.length > 0) {
            topTags = await buildTopTagsFromArtists(topArtists)
        }

        const candidates = db.prepare("SELECT * FROM candidates WHERE status='new'").all()
        console.log(
            `[recs] ${candidates.length} candidates, ${topTags.length} user tags` +
            (topTags.length ? ` (e.g. ${topTags.slice(0, 5).map((t) => t.tag).join(', ')})` : ''),
        )

        const top = getTopMatches(
            candidates,
            { topTags, topGenres: hasGenres ? topGenres : [] },
            { topN: 5, newOnly: false },
        )
        console.log(`[recs] ${top.length} matches scored above zero`)

        const tracks = await Promise.all(
            top.map(async (match) => {
                const url = match.link || null
                return {
                    title: match.track_guess,
                    artist: match.artist_guess,
                    blurb: blurbForMatch(match),
                    url,
                    spotifyUrl: match.spotify_url || null,
                    bandcampImageUrl: await fetchBandcampCover(url),
                    matchedOn: match.matchedOn,
                    score: Math.round(match.score * 1000) / 1000,
                }
            }),
        )

        res.json({
            tracks,
            meta: {
                candidateCount: candidates.length,
                tagCount: topTags.length,
                topTags: topTags.slice(0, 10),
            },
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error', detail: err.message })
    }
})

app.get('/health', (req, res) => res.json({ ok: true }))

const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`Recs backend on 127.0.0.1:${PORT}`)
})

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Kill the other process or set PORT=...`)
    } else {
        console.error(err)
    }
    process.exit(1)
})
