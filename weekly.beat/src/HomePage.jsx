import { useState, useEffect } from "react"
import { useSpotifyAuth } from './auth/useSpotifyAuth'

const HomePage = () => {
  const { loggedIn, login, logout } = useSpotifyAuth()

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  })

  useEffect(() => {
    if (!loggedIn) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const nextMonday = new Date()
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7
      nextMonday.setDate(now.getDate() + daysUntilMonday)
      nextMonday.setHours(0, 0, 0, 0)

      const diff = nextMonday - now
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [loggedIn])

  const tracks = [
    { title: "Neon Horizon", artist: "Aurora Waves", cover: "from-emerald-400 to-emerald-700" },
    { title: "Midnight Static", artist: "The Velvet Echo", cover: "from-pink-400 to-pink-700" },
    { title: "Paper Planes", artist: "Luna & The Tide", cover: "from-emerald-300 to-emerald-600" },
    { title: "Glass Gardens", artist: "Solar Bloom", cover: "from-pink-300 to-pink-600" },
    { title: "Slow Motion City", artist: "Northern Drift", cover: "from-emerald-500 to-emerald-800" },
  ]

  return (
    <main className="min-h-screen min-w-screen bg-gray-900 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">

      <div className="absolute -top-128 -left-128 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-emerald-400/30 via-emerald-600/10 to-emerald-800/5 blur-3xl rotate-45 animate-float"></div>

      <div className="absolute -bottom-128 -right-128 w-[1200px] h-[1200px] rounded-full bg-gradient-to-tl from-pink-400/30 via-pink-600/10 to-pink-800/5 blur-3xl rotate-45 animate-float-delay"></div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_2px,_transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-emerald-400/60 rounded-full blur-sm animate-ping"></div>
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-400/60 rounded-full blur-sm animate-ping-delay"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-emerald-400/40 rounded-full blur-sm animate-ping-delay-2"></div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-16 flex flex-col items-center">

      <div className="flex flex-col items-center text-center space-y-4">
          <div className="text-7xl font-bold flex items-center">
            <h1 className="ml-4 bg-gradient-to-r from-green-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              weekly.beat
            </h1>
          </div>
          <p className="text-xl text-pink-300 font-semibold opacity-90 mt-[-1rem]">
            Beat the algorithm.
          </p>
        </div>

        {!loggedIn && (
          <button
            onClick={login}
            className="group mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3.5 px-8 rounded-full flex items-center gap-3 transition-all duration-300 hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="group-hover:rotate-12 transition-transform duration-300">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.5.5 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288"/>
            </svg>
            <span className="text-xl">Link with Spotify</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="group-hover:translate-x-1 transition-transform duration-300">
              <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
            </svg>
          </button>
        )}

        {loggedIn && (
          <>
          <div className="flex flex-col items-center text-center space-y-3 mt-5 mb-5">
              <div className="px-5 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-xs text-gray-300 tracking-widest uppercase flex items-center gap-2">
                This Week's Picks
              </div>
            </div>

            <div className="w-full space-y-3 mb-12">
              {tracks.map((track, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 cursor-pointer"
                >

                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${track.cover} flex-shrink-0 shadow-lg relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                  </div>

                  <button className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 opacity-0 group-hover:opacity-100 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="w-full flex flex-col items-center space-y-5">
              <div className="flex items-center gap-3 text-xs text-gray-400 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span>
                Next drop in
              </div>

              <div className="flex items-center gap-3">
                {[
                  { value: timeLeft.days,    label: "Days"  },
                  { value: timeLeft.hours,   label: "Hours" },
                  { value: timeLeft.minutes, label: "Mins"  },
                  { value: timeLeft.seconds, label: "Secs"  },
                ].map((unit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 flex items-center justify-center">
                        <span className="text-2xl font-bold font-mono bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                          {String(unit.value).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 tracking-widest uppercase">
                        {unit.label}
                      </span>
                    </div>
                    {i < 3 && <span className="text-2xl text-gray-600 -mt-6">:</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default HomePage