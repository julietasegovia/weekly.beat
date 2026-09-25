import { useCallback, useState } from 'react'

const STORAGE_KEY = 'lastfm_username'

function readStoredUsername() {
    try {
        return localStorage.getItem(STORAGE_KEY)?.trim() || ''
    } catch {
        return ''
    }
}

export function useLastfmUser() {
    const [username, setUsernameState] = useState(readStoredUsername)

    const setUsername = useCallback((value) => {
        const next = value?.trim() || ''
        if (next) {
            localStorage.setItem(STORAGE_KEY, next)
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
        setUsernameState(next)
    }, [])

    const clearUsername = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY)
        setUsernameState('')
    }, [])

    return {
        username,
        linked: !!username,
        setUsername,
        clearUsername,
    }
}
