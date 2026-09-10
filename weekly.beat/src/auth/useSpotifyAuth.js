import { useCallback, useEffect, useState } from "react";
import { isLoggedIN, logout as clearTokens, redirectToSpotify, redirectToSpotifyLogin } from "./spotifyAuth"

export function useSpotifyAuth() {
    const [loggedIn, setLoggedIn] = useState(isLoggedIn())

    useEffect(() =>{
        const onStorage = () => setLoggedIn(isLoggedIn())
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    const login = useCallback(() => {
        redirectToSpotifyLogin()
    }, [])

    const logout = useCallback(()=> {
        clearTokens()
        setLoggedIn(false)
    }, [])

    return { loggedIn, login, logout}
}