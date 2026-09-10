import { useCallback, useEffect, useState } from "react"
import { IsLoggedIn, logout as clearTokens, redirectToSpotifyLogin } from "./spotifyAuth"

export function useSpotifyAuth() {
    const [loggedIn, setLoggedIn] = useState(IsLoggedIn())

    useEffect(() => {
        const onStorage = () => setLoggedIn(IsLoggedIn())
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    const login = useCallback(() => {
        redirectToSpotifyLogin()
    }, [])

    const logout = useCallback(() => {
        clearTokens()
        setLoggedIn(false)
    }, [])

    return { loggedIn, login, logout }
}
