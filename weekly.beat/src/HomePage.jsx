const HomePage = () => {
  return (
    <main className="min-h-screen min-w-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-pink-950 text-white flex flex-col items-center justify-center text-center">
      <div className="flex flex-col items-center text-center">
        <div className="text-6xl font-bold flex items-center">
          <h1>This is</h1>
          <h1 className="ml-4 text-green-400">weekly.beat</h1>
        </div>
        <p className="text-xl text-gray-400 mt-4">Beat the algorithm.</p>
      </div>
    </main>
  );
};

export default HomePage;