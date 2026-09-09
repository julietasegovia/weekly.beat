import {useEffect, useState} from 'react'
import { handleSpotifyCallback } from './spotifyAuth'

export default function SpotifyCallback({onSuccess, redirectTo= "/"}){
    const [status, setStatus] = useState('Processing...')
    const [error, setError] = useState(null)
    
    useEffect(() => {
        handleSpotifyCallback()
            .then((tokens) => {
                onSuccess?.(tokens)
                window.location.replace(redirectTo)
            })
            .catch((error) => {
                setStatus("Error")
                setError(error.message)
            })
        }, [onSuccess, redirectTo])
        
        if (status==="error"){
            return(
                <div>
                    <p>
                        Login Failed: {error}
                    </p>
                    <a href="/">Try Again</a>
                </div>
            )
        }
    return <p>Singing you in with Spotify</p>
}