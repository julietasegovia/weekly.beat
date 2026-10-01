const STORAGE_KEY = 'weekly_feed_cache'

/** Monday 00:00 local, matching the "next drop" countdown on the home page. */
export function weekStartKey(now = new Date()) {
    const start = new Date(now)
    const daysSinceMonday = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - daysSinceMonday)
    start.setHours(0, 0, 0, 0)
    const y = start.getFullYear()
    const m = String(start.getMonth() + 1).padStart(2, '0')
    const d = String(start.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function normalizeUsername(username) {
    return username?.trim().toLowerCase() || ''
}

function readStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
        return {}
    }
}

function writeStore(store) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch {
        // Quota or private mode — the feed still loads, it just isn't cached.
    }
}

export function readWeeklyFeedCache(username, now = new Date()) {
    const key = normalizeUsername(username)
    if (!key) return null

    const entry = readStore()[key]
    if (!entry || entry.weekKey !== weekStartKey(now)) return null
    if (!Array.isArray(entry.tracks)) return null

    return {
        tracks: entry.tracks,
        artistOfWeek: entry.artistOfWeek ?? null,
        albumOfWeek: entry.albumOfWeek ?? null,
    }
}

export function writeWeeklyFeedCache(username, feed, now = new Date()) {
    const key = normalizeUsername(username)
    if (!key || !Array.isArray(feed?.tracks)) return

    const weekKey = weekStartKey(now)
    const store = readStore()
    for (const storedKey of Object.keys(store)) {
        if (store[storedKey]?.weekKey !== weekKey) delete store[storedKey]
    }
    store[key] = {
        weekKey,
        tracks: feed.tracks,
        artistOfWeek: feed.artistOfWeek ?? null,
        albumOfWeek: feed.albumOfWeek ?? null,
    }
    writeStore(store)
}
