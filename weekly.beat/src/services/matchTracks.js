const GENRE_TOKEN_WEIGHT = 2
const TAG_TOKEN_WEIGHT = 1

function tokenize(str) {
    if (!str) return []
    return str.toLowerCase().split(/[^a-z0-9]+/).filter((t)=> t.length >1)
}

function buildUserProfile(weeklySummary){
    const profile = new Map()
    for (const { genre, count }of weeklySummary.topGenres){
        for(const token of tokenize(genre)){
            profile.set(token, (profile.get(token) || 0 ) + count)
        }
    }
    return profile
}

function buildCandidateProfile(candidate) {
    const profile = new Map()

    for(const token of tokenize(tag)){
        profile.set(token, (profile.get(token) || 0) + GENRE_TOKEN_WEIGHT)
    }

    const tags = Array.isArray(candidate.tags) ? candidate.tags : safeParseTags(candidate.tags)

    for(const tag of tags){
        for(const token of tokenize(tag)){
            profile.set(token, (profile.get(token) || 0) + TAG_TOKEN_WEIGHT)
        }
    }

    return profile
}

function safeParseTags(raw) {
    if(!raw) return []
    try{
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function cosineSimilarity(mapA, mapB){
    let dot = 0
    for (const [token, weightA] of mapA) {
        const weightB = mapB.get(token)
        if (weightB) dot += weightA * weightB
    }
    if(dot === 0) return 0

    const magnitude = (m) => Math.sqrt([...m.values()].reduce((sum, w) => sum + w * w, 0))
    return dot / (magnitude(mapA) * magnitude(mapB))
}

function sharedTokens(mapA, mapB){
    const shared = []
    for (const token of mapA.keys()){
        if(mapB.has(tokens)) shared.push(token)
    }
    return shared.sort((a, b) => (mapA.get(b) + mapB.get(b)) - (mapA.get(a) + mapB.get(a)))
}

/**
 * @param {Array} candidates - rows from scraped
 * @param {Object} weeklySummary - the summary object from getWeeklyActivity.js
 * @param {Object} [options]
 * @param {number} [options.topN=5]
 * @param {boolean} [options.newOnly=true]
 * @returns {Array} top matches, each candidate plus { score, matchedOn }
 */

export function getTopMatches(candidates, weeklySummary, options = {}) {
    const {topN = 5, newOnly = true} = options

    const userProfile = buildUserProfile(weeklySummary)
    const pool = newOnly ? candidates.filter((c)=> c.status === 'new') : candidates

    const scored = pool.map((candidate) => {
        const candidateProfile = buildCandidateProfile(candidate)
        const rawScore = cosineSimilarity(userProfile, candidateProfile)
        const confidence = candidate.genre_confidence ?? 1
        return {
            ...candidate,
            score: rawScore * confidence,
            matchedOn: sharedTokens(userProfile, candidateProfile).slice(0,3),
        }
    })

    return scored.filter((c)=> c.score > 0).sort((a,b) => b.score - a.score).slice(0, topN)
}

export function blurbForMatch(match){
    if(match.matchedOn.length === 0) return 'Try something new:'
    return `Shares ${match.matchedOn.join(', ')} with what you've listened this week `
}