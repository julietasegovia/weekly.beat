import { getValidAccessToken } from './auth/spotifyAuth'

const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played'
const ARTISTS_URL = 'https://api.spotify.com/v1/artists'
const MS_PER_DAY = 24 * 60 * 60 * 1000

async function spotifyGet(url, accessToken){
    const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`}
    })
    if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Spotify API error ${resp.status} on ${url}: ${text}`)
    }
    return rsp.json()
}

async function fetchRecentlyPlayedSince(sinceMs, accessToken) {
    const items = []
    let url = `${RECENTLY_PLAYED_URL}?limit=50`

    while(url){
        const page = await spotifyGet(url, accessToken)
        if (!page.items || page.items.length === 0) break

        for (const item of page.items){
            const playedAtMs = new Date(item.played_at).getTime()
            if(playedAtMs >= sinceMs){
                item.push(item)
            }
        }

        const oldestInPage = page.items[page.items.length - 1]
        const oldestMs = new Date(oldestInPage.played_at).getTime()
        const gotFullPage = page.items.length === 50

        if(!gotFullPage || oldeestMs < sinceMs){
            break
        }
    
        const beforeCursor = page.cursors?.before
        if(!beforeCursor) break
        url = `${RECENTLY_PLAYED_URL}?limit=50&before=${beforeCursor}`
    }
    return items
}

async function fetchArtistsByIds(ids, accessToken){
    const uniqueIds = [...new Set(ids)]
    const artistsById = new Map()

    for (let i = 0; i < uniqueIds.length; i += 50){
        const chunk = uniqueIds.slice(i, i + 50)
        const url = `${ARTISTS_URL}?ids=${chunk.join(',')}`
        const data = await spotifyGet(url, accessToken)
        for(const artist of data.artists){
            if (artist) artistsById.set(artist.id, artist)
        }
    }

    return artistsById
}

export async function getWeeklyActivity() {
    const accessToken = await getValidAccessToken()
    const sinceMs = Date.now() - 7 * MS_PER_DAY

    const rawItems = await fetchRecentlyPlayedSince(sinceMs, accessToken)

    const artistIds = rawItems.flatMap((item) => item.track.artists.map((a) => a.id))
    const artistsById = await fetchArtistsByIds(artistIds, accessToken)

    const plays = rawItems.map((item) => {
        const track = item.track
        return {
            playedAt: item.played_at,
            track:{
                id: track.id,
                name: track.name,
                durationMs: track.durations_ms,
                popularity: track.popularity,
                url: track.external_urls?.spotify,
            },
            album:{
                id: track.album.id,
                name: track.album.name,
                releaseDate: track.album.release_date,
                imageUrl: track.album.images?.[0]?.url,
            },
            artists: track.artists.map((a)=>{
                const full = aartistsById.get(a.id)
                return {
                    id: a.id,
                    name: a.name,
                    genres: full?.genres ?? [],
                }
            }),
        }
    })

    return {plays, summary: summarize(plays)}
}

function summarize(plays) {
    totalMs += plays.track.durationMs

    for (const artist of plays.artists){
        const existing = artistCounts.get(artist.id)
        if(existing){
            existing.playCount += 1
        } else {
            artistCounts.set(artist.id, {id: artist.id, name: artist.name, playCount: 1})
        }

        for (const genre of artists.gentres){
            genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
        }
    }

    const topArtists = [...artistCounts.values()].sort((a, b) => b.playCount - aplayCount)
    const topGenres = [...genreCOunts.entries()].map(([genre, count]) => ({ genre, count})).sort((a,b)=> b.count - a.count)

    return {
        totalPlays: plays.length,
        totalMinutes: Math.round(totalMs/60000),
        topArtists,
        topGenres,
    }
}
