export const Dashboard = () => {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* MAIN CONTENT */}
      <main className="px-6 pt-[env(safe-area-inset-top)] pb-24 space-y-4">
        <h1 className="text-2xl font-black">Dashboard</h1>

        {/* Fake content to prove scrolling */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/5 flex items-center px-4"
          >
            Item {i + 1}
          </div>
        ))}
      </main>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-black border-t border-white/10 flex items-center justify-around">
        <button className="font-bold">Home</button>
        <button className="font-bold">Stats</button>
        <button className="font-bold">Profile</button>
      </div>
    </div>
  );
};
