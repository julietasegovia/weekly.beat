import { useEffect, useState } from 'react'
import { getWeeklyActivity } from './lastfmActivity'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787'

const FALLBACK_TRACK = [
    { title: 'Girl', artist: "your backend aint connected", blurb: 'dumbass' },
]

export function useWeeklyRecs(lastfmUsername) {
    const [tracks, setTracks] = useState(null)
    const [artistOfWeek, setArtistOfWeek] = useState(null)
    const [albumOfWeek, setAlbumOfWeek] = useState(null)
    const [usingFallback, setUsingFallback] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!lastfmUsername?.trim()) {
            setTracks(null)
            setArtistOfWeek(null)
            setAlbumOfWeek(null)
            setUsingFallback(false)
            setError(null)
            return
        }

        let cancelled = false

        async function load() {
            try {
                const { summary } = await getWeeklyActivity(lastfmUsername)

                if (summary.topArtists.length === 0) {
                    throw new Error('No scrobbles found in the last 7 days for this profile')
                }

                const resp = await fetch(`${API_BASE}/api/recs/weekly`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topArtists: summary.topArtists.map(({ name, playCount }) => ({
                            name,
                            playCount,
                        })),
                    }),
                })
                if (!resp.ok) throw new Error(`Backend error ${resp.status}`)

                const data = await resp.json()
                if (cancelled) return

                setTracks(
                    (data.tracks || []).map((t) => ({ ...t, imageUrl: t.bandcampImageUrl || null })),
                )
                setArtistOfWeek(
                    data.artistOfWeek
                        ? { ...data.artistOfWeek, imageUrl: data.artistOfWeek.representativeTrack?.bandcampImageUrl || null }
                        : null,
                )
                setAlbumOfWeek(
                    data.albumOfWeek
                        ? { ...data.albumOfWeek, imageUrl: data.albumOfWeek.bandcampImageUrl || null }
                        : null,
                )
                setUsingFallback(false)
                setError(null)
            } catch (err) {
                if (!cancelled) {
                    setTracks(FALLBACK_TRACK)
                    setArtistOfWeek(null)
                    setAlbumOfWeek(null)
                    setUsingFallback(true)
                    setError(err.message)
                }
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [lastfmUsername])

    return {
        tracks,
        artistOfWeek,
        albumOfWeek,
        loading: !!lastfmUsername && tracks === null,
        usingFallback,
        error,
    }
}
