import { useEffect, useState } from 'react'
import { getWeeklyActivity } from './weeklyActivity'
import {
    attachAlbumCovers,
    attachAlbumOfWeekCover,
    attachArtistOfWeekCover,
} from './spoptifyCovers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787'

const FALLBACK_TRACK = [
    { title: 'Girl', artist: "your backend aint connected", blurb: 'dumbass' },
]

export function useWeeklyRecs() {
    const [tracks, setTracks] = useState(null)
    const [artistOfWeek, setArtistOfWeek] = useState(null)
    const [albumOfWeek, setAlbumOfWeek] = useState(null)
    const [usingFallback, setUsingFallback] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const { summary } = await getWeeklyActivity()
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
                const [withCovers, artistPick, albumPick] = await Promise.all([
                    attachAlbumCovers(data.tracks || []),
                    attachArtistOfWeekCover(data.artistOfWeek || null),
                    attachAlbumOfWeekCover(data.albumOfWeek || null),
                ])
                if (!cancelled) {
                    setTracks(withCovers)
                    setArtistOfWeek(artistPick)
                    setAlbumOfWeek(albumPick)
                }
            } catch (err) {
                if (!cancelled) {
                    setTracks(FALLBACK_TRACK)
                    setUsingFallback(true)
                    setError(err.message)
                }
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [])

    return {
        tracks,
        artistOfWeek,
        albumOfWeek,
        loading: tracks === null,
        usingFallback,
        error,
    }
}
