export const Profile = () => {
  return (
    <div className="space-y-4">
      {/* PAGE HEADER */}
      <h1 className="text-2xl font-black">Profile</h1>

      {/* CONTENT */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-xl bg-white/5 flex items-center px-4"
        >
          Item {i + 1}
        </div>
      ))}
    </div>
  );
};
