import { useEffect, useState } from 'react'
import { getWeeklyActivity } from './weeklyActivity'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787'

const FALLBACK_TRACK = [
    {title: 'Girl', artist:'your backend aint connected', blurb: 'dumbass'}
]

export function useWeeklyRecs() {
    const [tracks, setTracks] = useState(null)
    const [usingFallback, setUsingFallback] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try{
                const {summary} = await getWeeklyActivity()
                const resp = await fetch(`${API_BASE}/api/recs/weekly`, {
                    method: 'POST',
                    headers: { 'COntent-Type': 'application/json'},
                    body: JSON.stringify({topGenres: summary.topGenres}),
                })
                if(!resp.ok) throw new Error(`Backend error ${resp.status}`)

                const data = await resp.json()
                if(!cancelled) setTracks(data.tracks)
            }
            catch (err) {
                if(!cancelled){
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

    return {tracks, loading: tracks === null, usingFallback, error}
}