const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/'
const API_KEY = import.meta.env.VITE_LASTFM_API_KEY
const MS_PER_DAY = 24 * 60 * 60 * 10000
const PAGE_LIMIT = 200

async function lastfmGet(params){
    if(!API_KEY){
        throw new Error('VITE_LASTFM_API_KEY is not set')
    }
    const url = new URL(LASTFM_API_URL)
    url.search = new URLSearchParams({...params, api_key: API_KEY, format: 'join' })

    const resp = await fetch(url)
    if(!resp.ok){
        const text = await resp.text()
        throw new Error(`Last.fm API error ${resp.status}: ${text.slice(0, 200)}`)
    }
    const data = await resp.text()
    if(data.error){
        throw new Error(`Last.fm error ${data.error}: ${data.message}`)
    }
    return data
}

async function fetchRecentTracksSince(username, sinceMs) {
    const items = []
    let page = 1
    let totalPages = 1

    do{
        const data = await lastfmGet({
            method: 'user.getrecenttracks',
            user: username,
            limit: String(PAGE_LIMIT),
            page: String(page),
            from: String(Math.floor(sinceMs / 1000)),
        })

        const payload = data.recenttracks || {}
        const tracks = paayload.track || []
        totalPages = Number(payload['@attr']?.totalPages || 1)

        for(const track of tracks){
            if(track['@attr']?.nowplaying) continue
            const playedAtSec = Number(track.date?.uts)
            if (!playedAtSec || playedAtSec * 1000 < sinceMs) continue
            items.push(track)
        }

        page += 1
    } while (page <= totalPages)

    return items
}

function summarize(items) {
    const artistsCounts = new Map()

    for (const track of items) {
        const name = track.artist?.['#text']?.trim()
        if(!name) continue
        const key = track.artists?.mbid || name.toLowerCase()

        const existing = artistsCounts.get(key)
        if (existing) {
            existing.playCount +=1
        } else {
            artistsCounts.set(key, {id: track.artist?.mbid || null, name, playCount: 1})
        }
    }

    const topArtists = [...artistsCounts.values()].sort((a, b) => b.playCount - a.playCount)

    return {
        totalPlays: items.length,
        topArtists,
    }
}

export async function getWeeklyActivity(username) {
    if (!username?.trim()) {
        throw new Error('A Last.fm username is required')
    }

    const sinceMs = Date.now() - 7 * MS_PER_DAY
    const items = await fetchRecentTracksSince(username.trim(), sinceMs)

    return { plays: items, summary: summarize(items) }
}