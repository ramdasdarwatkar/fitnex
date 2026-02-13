export const Input = ({ label, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full h-12 bg-slate-900 border border-slate-800 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-brand transition-all"
    />
  </div>
);
