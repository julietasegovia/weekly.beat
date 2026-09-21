import { getValidAccessToken } from '../auth/spotifyAuth'

const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played'
const MS_PER_DAY = 24 * 60 * 60 * 1000

async function spotifyGet(url, accessToken) {
    const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Spotify API error ${resp.status} on ${url}: ${text}`)
    }
    return resp.json()
}

async function fetchRecentlyPlayedSince(sinceMs, accessToken) {
    const items = []
    let url = `${RECENTLY_PLAYED_URL}?limit=50`

    while (url) {
        const page = await spotifyGet(url, accessToken)
        if (!page.items || page.items.length === 0) break

        for (const item of page.items) {
            const playedAtMs = new Date(item.played_at).getTime()
            if (playedAtMs >= sinceMs) {
                items.push(item)
            }
        }

        const oldestInPage = page.items[page.items.length - 1]
        const oldestMs = new Date(oldestInPage.played_at).getTime()
        const gotFullPage = page.items.length === 50

        if (!gotFullPage || oldestMs < sinceMs) {
            break
        }

        const beforeCursor = page.cursors?.before
        if (!beforeCursor) break
        url = `${RECENTLY_PLAYED_URL}?limit=50&before=${beforeCursor}`
    }
    return items
}

/**
 * Spotify listening for the last 7 days.
 * Genres are no longer used for matching — the backend resolves
 * topArtists → MusicBrainz tags → Bandcamp tag overlap.
 */
export async function getWeeklyActivity() {
    const accessToken = await getValidAccessToken()
    const sinceMs = Date.now() - 7 * MS_PER_DAY

    const rawItems = await fetchRecentlyPlayedSince(sinceMs, accessToken)

    const plays = rawItems.map((item) => {
        const track = item.track
        return {
            playedAt: item.played_at,
            track: {
                id: track.id,
                name: track.name,
                durationMs: track.duration_ms,
                url: track.external_urls?.spotify,
            },
            album: {
                id: track.album.id,
                name: track.album.name,
                releaseDate: track.album.release_date,
                imageUrl: track.album.images?.[0]?.url,
            },
            artists: track.artists.map((a) => ({
                id: a.id,
                name: a.name,
            })),
        }
    })

    return { plays, summary: summarize(plays) }
}

function summarize(plays) {
    const artistCounts = new Map()
    let totalMs = 0

    for (const play of plays) {
        totalMs += play.track.durationMs

        for (const artist of play.artists) {
            const existing = artistCounts.get(artist.id)
            if (existing) {
                existing.playCount += 1
            } else {
                artistCounts.set(artist.id, {
                    id: artist.id,
                    name: artist.name,
                    playCount: 1,
                })
            }
        }
    }

    const topArtists = [...artistCounts.values()].sort((a, b) => b.playCount - a.playCount)

    return {
        totalPlays: plays.length,
        totalMinutes: Math.round(totalMs / 60000),
        topArtists,
    }
}
