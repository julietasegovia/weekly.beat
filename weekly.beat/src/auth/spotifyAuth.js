import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

const SCOPES = [
    "user-read-recently-played",
    "user-top-read",
    "playlist-modify-private",
    "playlist-modify-public",
].join(" ")

const STORAGE_KEYS = {
    verifier: "spotify_pkce_verifier",
    state: "spotify_pkce_state",
    redirectUri: "spotify_pkce_redirect_uri",
    tokens: "spotify_tokens",
}

function getRedirectUri() {
    // Prefer the URL you're actually on so this can't drift from .env.
    // Override with VITE_SPOTIFY_REDIRECT_URI only when you need a fixed production URI.
    return import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/callback`
}

export async function redirectToSpotifyLogin() {
    if (!CLIENT_ID) {
        throw new Error("Missing VITE_SPOTIFY_CLIENT_ID in .env")
    }

    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()
    const redirectUri = getRedirectUri()

    sessionStorage.setItem(STORAGE_KEYS.verifier, verifier)
    sessionStorage.setItem(STORAGE_KEYS.state, state)
    sessionStorage.setItem(STORAGE_KEYS.redirectUri, redirectUri)

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: challenge,
        state: state,
        scope: SCOPES,
    })

    // Temporary: confirm this exact string is in Spotify Dashboard → Redirect URIs
    console.info("[spotify] redirect_uri being sent:", redirectUri)

    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`
}

export async function handleSpotifyCallback() {
    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")
    const returnedState = url.searchParams.get("state")
    const error = url.searchParams.get("error")

    if (error) {
        throw new Error(`Spotify login error: ${error}`)
    }

    const expectedState = sessionStorage.getItem(STORAGE_KEYS.state)
    if (!returnedState || returnedState !== expectedState) {
        throw new Error("State mismatch")
    }

    const verifier = sessionStorage.getItem(STORAGE_KEYS.verifier)
    if (!code || !verifier) {
        throw new Error("Missing code or verifier")
    }

    const tokens = await exchangeCodeForTokens(code, verifier)
    storeTokens(tokens)

    sessionStorage.removeItem(STORAGE_KEYS.verifier)
    sessionStorage.removeItem(STORAGE_KEYS.state)
    sessionStorage.removeItem(STORAGE_KEYS.redirectUri)

    return tokens
}

async function exchangeCodeForTokens(code, verifier) {
    const redirectUri =
        sessionStorage.getItem(STORAGE_KEYS.redirectUri) || getRedirectUri()

    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
    })

    const resp = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    })
    if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Token exchange failed (${resp.status}): ${text}`)
    }

    return resp.json()
}

function storeTokens({ access_token, refresh_token, expires_in }) {
    const record = {
        access_token,
        refresh_token,
        expires_at: Date.now() + expires_in * 1000,
    }
    localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(record))
}

export function getStoredTokens() {
    const raw = localStorage.getItem(STORAGE_KEYS.tokens)
    return raw ? JSON.parse(raw) : null
}

export function IsLoggedIn() {
    const tokens = getStoredTokens()
    return !!tokens?.refresh_token
}

export function logout() {
    localStorage.removeItem(STORAGE_KEYS.tokens)
}

export async function getValidAccessToken() {
    const tokens = getStoredTokens()
    if (!tokens) throw new Error("Not logged in")

    const aboutToExpire = Date.now() > tokens.expires_at - 60_000
    if (!aboutToExpire) return tokens.access_token

    const refreshed = await refreshAccessToken(tokens.refresh_token)
    return refreshed.access_token
}

async function refreshAccessToken(refreshToken) {
    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    })

    const resp = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    })

    if (!resp.ok) {
        const text = await resp.text()
        logout()
        throw new Error(`Token is bad/old (${resp.status}): ${text}`)
    }

    const data = await resp.json()
    storeTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_in: data.expires_in,
    })
    return getStoredTokens()
}
