export const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-full bg-black text-white safe-ios-top">
      {/* SCROLL AREA */}
      <div className="flex-1 overflow-y-auto samsung-scroll px-6 pt-4 pb-16 space-y-4">
        <h1 className="text-2xl font-black">Dashboard</h1>

        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/5 flex items-center px-4"
          >
            Item {i + 1}
          </div>
        ))}
      </div>

      {/* BOTTOM NAV — STICKY */}
      <div className="sticky bottom-0 h-20 bg-black border-t border-white/10 flex items-center justify-around">
        <button className="font-bold">Home</button>
        <button className="font-bold">Stats</button>
        <button className="font-bold">Profile</button>
      </div>
    </div>
  );
};
