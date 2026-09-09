const HomePage = () => {
  return (
    <main className="min-h-screen min-w-screen bg-gray-900 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">

      <div className="absolute -top-128 -left-128 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-emerald-400/30 via-emerald-600/10 to-emerald-800/5 blur-3xl rotate-45 animate-float"></div>
      
      <div className="absolute -bottom-128 -right-128 w-[1200px] h-[1200px] rounded-full bg-gradient-to-tl from-pink-400/30 via-pink-600/10 to-pink-800/5 blur-3xl rotate-45 animate-float-delay"></div>
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_2px,_transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-emerald-400/60 rounded-full blur-sm animate-ping"></div>
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-400/60 rounded-full blur-sm animate-ping-delay"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-emerald-400/40 rounded-full blur-sm animate-ping-delay-2"></div>
      
      <div className="flex flex-col items-center text-center relative z-10 space-y-8">
        
        <div className="text-7xl font-bold flex items-center tracking-tight">
          <h1 className="bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
            This is
          </h1>
          <h1 className="ml-4 bg-gradient-to-r from-green-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent transition-transform duration-300">
            weekly.beat
          </h1>
        </div>
        
        <div className="flex items-center gap-4 mt-[-1rem]">
          <p className="text-2xl text-pink-300 font-semibold opacity-90">
            Beat the algorithm.
          </p>
        </div>
        
        <button className="group mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3.5 px-8 rounded-full flex items-center gap-3 transition-all duration-300 hover:scale-102">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="group-hover:rotate-12 transition-transform duration-300">
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.5.5 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288"/>
          </svg>
          <span className="text-xl">Link with Spotify</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="group-hover:translate-x-1 transition-transform duration-300">
            <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
          </svg>
        </button>
      </div>
    </main>
  );
};

export default HomePage;