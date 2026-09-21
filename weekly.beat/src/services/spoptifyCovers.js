import { getValidAccessToken } from '../auth/spotifyAuth'

const SEARCH_URL = 'https://api.spotify.com/v1/search'

export async function attachAlbumCovers(tracks) {
    if (!Array.isArray(tracks) || tracks.length === 0) return tracks
    const accessToken = await getValidAccessToken()

    return Promise.all(
        tracks.map(async (track) => {
            const spotifyImage = await findAlbumImage(track, accessToken)
            return {
                ...track,
                imageUrl: spotifyImage || track.bandcampImageUrl || null,
            }
        }),
    )
}

async function findAlbumImage(track, accessToken) {
    const title = track.title?.trim()
    const artist = track.artist?.trim()
    if (!title && !artist) return null

    const q = [title && `track:${title}`, artist && `artist:${artist}`]
        .filter(Boolean)
        .join(' ')

    try {
        const params = new URLSearchParams({ q, type: 'track', limit: '1' })
        const resp = await fetch(`${SEARCH_URL}?${params}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!resp.ok) return null
        const data = await resp.json()
        return data.tracks?.items?.[0]?.album?.images?.[0]?.url ?? null
    } catch {
        return null
    }
}
