import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_PATH = process.env.ARTIST_TAGS_CACHE_PATH
    || path.resolve(__dirname, 'artist-tags-cache.json')

const MB_SEARCH_URL = 'https://musicbrainz.org/ws/2/artist'
const USER_AGENT = 'weekly.beat/0.1 (recs; https://github.com/weekly.beat)'
const MB_DELAY_MS = 1100
const MIN_SCORE = 85

let cache = loadCache()
let lastMbCallAt = 0

function loadCache() {
    try {
        const raw = fs.readFileSync(CACHE_PATH, 'utf8')
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
        return {}
    }
}

function saveCache() {
    try {
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
    } catch (err) {
        console.warn('[artistTags] could not write cache:', err.message)
    }
}

function cacheKey(artistName) {
    return artistName.trim().toLowerCase()
}

function cleanTags(tags) {
    const seen = new Set()
    const out = []
    for (const tag of tags || []) {
        const t = String(tag).toLowerCase().replace(/\s+/g, ' ').trim()
        if (!t || t.length >= 48 || seen.has(t)) continue
        seen.add(t)
        out.push(t)
    }
    return out
}

async function throttleMb() {
    const wait = MB_DELAY_MS - (Date.now() - lastMbCallAt)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastMbCallAt = Date.now()
}

async function mbGet(url) {
    await throttleMb()
    const resp = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
        },
    })
    if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`MusicBrainz ${resp.status}: ${text.slice(0, 120)}`)
    }
    return resp.json()
}

/**
 * Resolve an artist name to folksonomy tags via MusicBrainz (cached).
 * @param {string} artistName
 * @returns {Promise<string[]>}
 */
export async function getArtistTags(artistName) {
    if (!artistName?.trim()) return []

    const key = cacheKey(artistName)
    if (Object.prototype.hasOwnProperty.call(cache, key)) {
        return cache[key]
    }

    let tags = []
    try {
        const query = encodeURIComponent(`artist:"${artistName.trim()}"`)
        const search = await mbGet(`${MB_SEARCH_URL}?query=${query}&fmt=json&limit=1`)
        const hit = search.artists?.[0]

        if (hit && hit.score >= MIN_SCORE) {
            const hitName = (hit.name || '').trim().toLowerCase()
            const nameClose = hitName === key || hitName.includes(key) || key.includes(hitName)

            if (nameClose) {
                let raw = (hit.tags || [])
                    .filter((t) => t?.name && (t.count ?? 0) >= 1)
                    .map((t) => t.name)

                // Search hits often omit tags — look up the artist with inc=tags.
                if (raw.length === 0 && hit.id) {
                    const detail = await mbGet(`${MB_SEARCH_URL}/${hit.id}?inc=tags&fmt=json`)
                    raw = (detail.tags || [])
                        .filter((t) => t?.name && (t.count ?? 0) >= 1)
                        .map((t) => t.name)
                }

                tags = cleanTags(raw)
            }
        }
    } catch (err) {
        console.warn(`[artistTags] MB failed for "${artistName}":`, err.message)
        tags = []
    }

    cache[key] = tags
    saveCache()
    return tags
}

/**
 * Build a weighted tag list from Spotify top artists.
 * @param {Array<{ name: string, playCount: number }>} artists
 * @param {{ maxArtists?: number }} [options]
 * @returns {Promise<Array<{ tag: string, count: number }>>}
 */
export async function buildTopTagsFromArtists(artists, options = {}) {
    const { maxArtists = 15 } = options
    const sorted = [...(artists || [])]
        .filter((a) => a?.name)
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, maxArtists)

    const tagCounts = new Map()
    let resolved = 0

    for (const { name, playCount } of sorted) {
        const tags = await getArtistTags(name)
        if (tags.length === 0) continue
        resolved += 1
        const weight = playCount || 1
        for (const tag of tags) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + weight)
        }
    }

    const topTags = [...tagCounts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)

    console.log(
        `[artistTags] ${resolved}/${sorted.length} artists resolved → ${topTags.length} tags`,
    )
    return topTags
}
