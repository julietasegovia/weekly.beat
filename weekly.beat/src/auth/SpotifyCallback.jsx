import { useEffect, useState } from 'react'
import { handleSpotifyCallback } from './spotifyAuth'

export default function SpotifyCallback({ onSuccess, redirectTo = "/", cancelRedirectTo = "/" }) {
    const [status, setStatus] = useState('processing') // 'processing' | 'error'
    const [error, setError] = useState(null)

    useEffect(() => {
        handleSpotifyCallback()
            .then((tokens) => {
                onSuccess?.(tokens)
                window.location.replace(redirectTo)
            })
            .catch((err) => {
                // difference between catching an error and the user canceling the login
                if (err.message.includes('access_denied')) {
                    window.location.replace(cancelRedirectTo)
                    return
                }
                setStatus('error')
                setError(err.message)
            })
        }, [onSuccess, redirectTo, cancelRedirectTo])

        if (status === 'error') {
            return(
                <div>
                    <p>
                        Login Failed: {error}
                    </p>
                    <a href="/">Try Again</a>
                </div>
            )
        }
    return <main className='min-h-screen min-w-screen bg-gray-900 text-white flex flex-col items-center justify-center text-center relative overflow-hidden'>
        <div className="absolute -top-128 -left-128 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-emerald-400/30 via-emerald-600/10 to-emerald-800/5 blur-3xl rotate-45 animate-float"></div>
      
      <div className="absolute -bottom-128 -right-128 w-[1200px] h-[1200px] rounded-full bg-gradient-to-tl from-pink-400/30 via-pink-600/10 to-pink-800/5 blur-3xl rotate-45 animate-float-delay"></div>
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_2px,_transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-emerald-400/60 rounded-full blur-sm animate-ping"></div>
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-400/60 rounded-full blur-sm animate-ping-delay"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-emerald-400/40 rounded-full blur-sm animate-ping-delay-2"></div>

      <div className="flex flex-col items-center text-center space-y-4">
          <div className="text-4xl font-bold flex flex-col items-center">
                <h1 className="bg-gradient-to-r from-emerald-100 via-emerald-200 to-emerald-300 bg-clip-text text-transparent opacity-60">
                    Linking with Spotify...
                </h1>
                    <div className="relative w-16 h-16 mt-8">
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-300 border-r-pink-400 animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-emerald-500 border-l-emerald-600 animate-spin"></div>
                    </div>
            </div>
        </div>
    </main>
}