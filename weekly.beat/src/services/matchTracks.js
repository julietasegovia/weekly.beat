// Tags are the primary matching signal; genre is a secondary boost.
const TAG_TOKEN_WEIGHT = 2
const GENRE_TOKEN_WEIGHT = 1

function tokenize(str) {
    if (!str) return []
    return str.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1)
}

function buildUserProfile(weeklySummary) {
    const profile = new Map()

    // Preferred: tags resolved from listened artists (MusicBrainz / Last.fm).
    const topTags = weeklySummary.topTags || []
    for (const { tag, count } of topTags) {
        for (const token of tokenize(tag)) {
            profile.set(token, (profile.get(token) || 0) + count)
        }
    }

    // Backward-compat: Spotify genres if a client still sends them.
    if (topTags.length === 0) {
        for (const { genre, count } of weeklySummary.topGenres || []) {
            for (const token of tokenize(genre)) {
                profile.set(token, (profile.get(token) || 0) + count)
            }
        }
    }

    return profile
}

function buildCandidateProfile(candidate) {
    const profile = new Map()

    const tags = Array.isArray(candidate.tags) ? candidate.tags : safeParseTags(candidate.tags)
    for (const tag of tags) {
        for (const token of tokenize(tag)) {
            profile.set(token, (profile.get(token) || 0) + TAG_TOKEN_WEIGHT)
        }
    }

    for (const token of tokenize(candidate.genre)) {
        profile.set(token, (profile.get(token) || 0) + GENRE_TOKEN_WEIGHT)
    }

    return profile
}

function safeParseTags(raw) {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function cosineSimilarity(mapA, mapB) {
    let dot = 0
    for (const [token, weightA] of mapA) {
        const weightB = mapB.get(token)
        if (weightB) dot += weightA * weightB
    }
    if (dot === 0) return 0

    const magnitude = (m) => Math.sqrt([...m.values()].reduce((sum, w) => sum + w * w, 0))
    return dot / (magnitude(mapA) * magnitude(mapB))
}

function sharedTokens(mapA, mapB) {
    const shared = []
    for (const token of mapA.keys()) {
        if (mapB.has(token)) shared.push(token)
    }
    return shared.sort((a, b) => (mapA.get(b) + mapB.get(b)) - (mapA.get(a) + mapB.get(a)))
}

/**
 * @param {Array} candidates - rows from scraped
 * @param {Object} weeklySummary - { topTags } and/or { topGenres }
 * @param {Object} [options]
 * @param {number} [options.topN=5]
 * @param {boolean} [options.newOnly=true]
 * @returns {Array} top matches, each candidate plus { score, matchedOn }
 */
export function getTopMatches(candidates, weeklySummary, options = {}) {
    const { topN = 5, newOnly = true } = options

    const userProfile = buildUserProfile(weeklySummary)
    if (userProfile.size === 0) return []

    const pool = newOnly ? candidates.filter((c) => c.status === 'new') : candidates

    const scored = pool.map((candidate) => {
        const candidateProfile = buildCandidateProfile(candidate)
        const rawScore = cosineSimilarity(userProfile, candidateProfile)
        const confidence = candidate.genre_confidence ?? 1
        return {
            ...candidate,
            score: rawScore * confidence,
            matchedOn: sharedTokens(userProfile, candidateProfile).slice(0, 3),
        }
    })

    return scored.filter((c) => c.score > 0).sort((a, b) => b.score - a.score).slice(0, topN)
}

export function blurbForMatch(match) {
    if (match.matchedOn.length === 0) return 'Try something new:'
    return `Shares ${match.matchedOn.join(', ')} with what you've listened this week `
}

/**
 * Pick the artist whose new releases best match the week's listening.
 * Rewards artists with several matching releases, not just one lucky hit,
 * via a sqrt(trackCount) boost on the summed score.
 *
 * @param {Array} candidates - rows from scraped
 * @param {Object} weeklySummary - { topTags } and/or { topGenres }
 * @param {Object} [options]
 * @param {boolean} [options.newOnly=true]
 * @returns {Object|null}
 */

export function getArtistOfWeek(candidates, weeklySummary, options = {}){
    const {newOnly = true} = options

    const userProfile = buildUserProfile(weeklySummary)
    if(userProfile.size === 0) return null

    const pool = newOnly? candidates.filter((c) => c.status === 'new') : candidates

    const byArtist = new Map()
    for (const candidate of pool){
        const artist = candidate.artist_guess?.trim()
        if (!artist) continue

        const candidateProfile = buildCandidateProfile(candidate)
        const rawScore = cosineSimilarity(userProfile, candidateProfile)
        if(rawScore <= 0) continue

        const confidence = candidate.genre_confidence ?? 1
        const score = rawScore * confidence
        const matchedOn = sharedTokens(userProfile, candidateProfile).slice(0, 3)

        const entry = byArtist.get(artist) || { artist, totalScore: 0, trackCount: 0, best: null }
        entry.totalScore += score
        entry.trackCount += 1
        if (!entry.best || score > entry.best.score) {
            entry.best = { ...candidate, score, matchedOn }
        }
        byArtist.set(artist, entry)
    }

    if (byArtist.size === 0) return null

    const [top] = [...byArtist.values()]
        .map((e) => ({ ...e, weightedScore: e.totalScore * Math.sqrt(e.trackCount) }))
        .sort((a, b) => b.weightedScore - a.weightedScore)

    return {
        artist: top.artist,
        score: Math.round(top.totalScore * 1000) / 1000,
        trackCount: top.trackCount,
        matchedOn: top.best.matchedOn,
        blurb: artistOfWeekBlurb(top),
        representativeTrack: {
            title: top.best.track_guess,
            url: top.best.link,
            spotifyUrl: top.best.spotify_url || null,
        },
    }
}

function artistOfWeekBlurb({ trackCount, best }) {
    const base = best.matchedOn.length ? `It's giving ${best.matchedOn.join(', ')}` : `A new face`
    return trackCount > 1 ? `${base} - ${trackCount} releases matched your taste` : base
}

/**
 * Choose the best matching album of the week among album releases.
 *
 * @param {Array} candidates - rows from scraped
 * @param {Object} weeklySummary
 * @param {Object} [options]
 * @param {boolean} [options.newOnly=true]
 * @returns {Object|null}
 */
export function getAlbumOfWeek(candidates, weeklySummary, options = {}) {
    const { newOnly = true } = options
    const userProfile = buildUserProfile(weeklySummary)
    if (userProfile.size === 0) return null

    const pool = (newOnly ? candidates.filter((c) => c.status === 'new') : candidates)
        .filter((c) => c.item_type === 'a' && c.album_guess)

    let best = null
    for (const candidate of pool) {
        const candidateProfile = buildCandidateProfile(candidate)
        const rawScore = cosineSimilarity(userProfile, candidateProfile)
        if (rawScore <= 0) continue

        const confidence = candidate.genre_confidence ?? 1
        const score = rawScore * confidence
        if (!best || score > best.score) {
            best = {
                ...candidate,
                score,
                matchedOn: sharedTokens(userProfile, candidateProfile).slice(0, 3),
            }
        }
    }
    if (!best) return null

    return {
        title: best.album_guess,
        artist: best.artist_guess,
        url: best.link,
        spotifyUrl: best.spotify_url || null,
        matchedOn: best.matchedOn,
        score: Math.round(best.score * 1000) / 1000,
        blurb: best.matchedOn.length
            ? `Has some ${best.matchedOn.join(', ')} tracks`
            : `Worth listening back-to-back`,
    }
}
