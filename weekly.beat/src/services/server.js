import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getTopMatches, blurbForMatch} from './matchTracks.js'

const PORT = process.env.PORT || 8787
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DB_PATH = path.resolve(__dirname, '../../../weekly.bot/candidates.db')
const DB_PATH = process.env.CANDIDATES_DB_PATH || DEFAULT_DB_PATH

const app = express()
app.use(cors())
app.use(express.json())

const db = new Database(DB_PATH, {readonly: true, fileMustExist: true })

app.post('/api/recs/weekly', (req, res) => {
    const { topGenres } = req.body

    if (!Array.isArray(topGenres)){
        return res.status(400).json({error: 'Expected { topGenres: [{ genre, count }, ...] } in body'  })
    }

    try{
        const candidates = db.prepare("SELECT * FROM candidates WHERE status='new'").all()
        const top = getTopMatches(candidates, { topGenres}, {topN: 5, newOnly: false})
        const tracks = top.map((match) => ({
            title: match.track_guess,
            artist: match.artist_guess,
            blurb: blurbForMatch(match),
            spotifyUrl: match.spotify_url || null,
        }))

        res.json({ tracks })
    }
    catch (err) {
        console.error(err)
        res.status(500).json({error: 'Internal server error', detail: err.message})
    }
})

app.get('/health', (req, res) => res.json({ok: true}))

app.listen(PORT, ()=>{
    console.log(`Recs backend on 127.0.0.1:${PORT}`)
})