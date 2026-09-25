import { useState, useEffect } from "react"
import { useLastfmUser } from './auth/useLastfmUser'
import { useWeeklyRecs } from './services/useWeeklyRecs'

const HomePage = () => {
  const { username, linked, setUsername, clearUsername } = useLastfmUser()
  const { tracks, artistOfWeek, albumOfWeek, loading, usingFallback, error } = useWeeklyRecs(username)
  const [usernameInput, setUsernameInput] = useState(username)

  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  })

  useEffect(() => {
    if (!linked) return

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
        minutes: Math.floor((diff / (1000 * 60 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [linked])

  const handleLink = (e) => {
    e.preventDefault()
    setUsername(usernameInput)
  }

  return (
    <main className="min-h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center text-center relative overflow-clip">

      <div className="absolute -top-128 -left-128 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-emerald-400/30 via-emerald-600/10 to-emerald-800/5 blur-3xl rotate-45 animate-float"></div>

      <div className="absolute -bottom-128 -right-128 w-[1200px] h-[1200px] rounded-full bg-gradient-to-tl from-pink-400/30 via-pink-600/10 to-pink-800/5 blur-3xl rotate-45 animate-float-delay"></div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_2px,_transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-emerald-400/60 rounded-full blur-sm animate-ping"></div>
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-400/60 rounded-full blur-sm animate-ping-delay"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-emerald-400/40 rounded-full blur-sm animate-ping-delay-2"></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16 flex flex-col items-center">

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

        {!linked && (
          <form onSubmit={handleLink} className="mt-8 flex flex-col items-center gap-3 w-full max-w-sm">
            <label htmlFor="lastfm-username" className="text-sm text-gray-400">
              Enter your Last.fm username to pull this week's scrobbles
            </label>
            <input
              id="lastfm-username"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="last.fm username"
              autoComplete="username"
              className="w-full rounded-full bg-white/5 border border-white/10 px-5 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!usernameInput.trim()}
              className="group bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3.5 px-8 rounded-full flex items-center gap-3 transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <span className="text-xl">Link Last.fm</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="group-hover:translate-x-1 transition-transform duration-300">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
              </svg>
            </button>
          </form>
        )}

        {linked && (
          <>
          <div className="flex items-center gap-3 mt-4 mb-[-6px]">
            <div className="text-xs text-emerald-400 tracking-widest opacity-80 uppercase text-left">
              this week's picks · @{username}
            </div>
            <button
              type="button"
              onClick={clearUsername}
              className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-pink-300 transition-colors"
            >
              change
            </button>
          </div>
          {error && usingFallback && (
            <p className="text-[11px] text-pink-400/80 normal-case tracking-normal text-left mt-4 w-full">
              {error}
            </p>
          )}
          <div className="w-full mt-12 mb-10 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
            <div className="flex flex-col items-center gap-3">
              {artistOfWeek?.representativeTrack?.url ? (
                <a
                  href={artistOfWeek.representativeTrack.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="w-52 h-52 rounded-full bg-gradient-to-br from-emerald-500/40 to-pink-500/30 shadow-lg relative overflow-hidden">
                    {artistOfWeek.imageUrl && (
                      <img
                        src={artistOfWeek.imageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>
                  <div className="text-center max-w-[13rem]">
                    <p className="text-m text-gray-300 font-bold opacity-90 group-hover:text-green-400 transition-colors truncate">
                      {artistOfWeek.artist}
                    </p>
                    {artistOfWeek.blurb && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug">
                        {artistOfWeek.blurb}
                      </p>
                    )}
                  </div>
                </a>
              ) : (
                <>
                  <div className="w-52 h-52 rounded-full bg-gradient-to-br from-emerald-500/40 to-pink-500/30 shadow-lg relative overflow-hidden" />
                  <p className="text-m text-gray-300 mt-2 font-bold opacity-80">
                    {loading ? 'Finding your artist…' : 'Artist of the week'}
                  </p>
                </>
              )}

              {albumOfWeek?.url ? (
                <a
                  href={albumOfWeek.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col items-center gap-3 mt-4"
                >
                  <div className="w-52 h-52 rounded-2xl bg-gradient-to-br from-pink-500/40 to-emerald-500/30 shadow-lg relative overflow-hidden">
                    {albumOfWeek.imageUrl && (
                      <img
                        src={albumOfWeek.imageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>
                  <div className="text-center max-w-[13rem]">
                    <p className="text-m text-gray-300 font-bold opacity-90 group-hover:text-green-400 transition-colors truncate">
                      {albumOfWeek.title}
                    </p>
                    {albumOfWeek.artist && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{albumOfWeek.artist}</p>
                    )}
                    {albumOfWeek.blurb && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug">
                        {albumOfWeek.blurb}
                      </p>
                    )}
                  </div>
                </a>
              ) : (
                <>
                  <div className="w-52 h-52 rounded-2xl bg-gradient-to-br from-pink-500/40 to-emerald-500/30 shadow-lg relative overflow-hidden mt-4" />
                  <p className="text-m text-gray-300 mt-2 font-bold opacity-80">
                    {loading ? 'Finding your album…' : 'Album of the week'}
                  </p>
                </>
              )}
            </div>

            <div className="w-full">

              {usingFallback && (
                <p className="text-[11px] text-gray-500 normal-case tracking-normal text-left mb-4">
                  Showing example picks — backend not reachable yet.
                </p>
              )}

              {loading ? (
                <p className="text-gray-500 text-sm mb-12 text-left">Pulling this week's picks…</p>
              ) : (
                <div className="w-full space-y-3 mb-12">
                  {tracks.map((track, i) => (
                    <div
                      key={i}
                      className="group flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] backdrop-blur-sm transition-all duration-300 cursor-pointer"
                    >

                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br
                        from-emerald-500/40 to-pink-500/30 flex-shrink-0 shadow-lg
                        relative overflow-hidden">
                          {track.imageUrl && (
                            <img
                              src={track.imageUrl}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/10
                        group-hover:bg-black/0 transition-colors" />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                          {track.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                        {track.blurb && (
                          <p className="text-xs text-gray-500 truncate">{track.blurb}</p>
                        )}
                      </div>

                      {(track.url || track.spotifyUrl) ? (
                        <a
                          href={track.url || track.spotifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 opacity-0 group-hover:opacity-100 group-hover:bg-green-500 group-hover:text-white transition-all duration-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                          </svg>
                        </a>
                      ) : (
                        <button disabled className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

            <div className="w-full flex flex-col items-center">
              <div className="flex items-center gap-3 text-xs text-pink-300 tracking-widest uppercase opacity-70 mt-[-40px]">
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
                      <div className="w-16 h-16 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-4xl font-bold font-mono text-white bg-clip-text opacity-70">
                          {String(unit.value).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 tracking-widest uppercase">
                        {unit.label}
                      </span>
                    </div>
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
