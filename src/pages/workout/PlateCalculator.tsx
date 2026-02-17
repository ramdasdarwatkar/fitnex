import { X } from "lucide-react";

export const PlateCalculator = ({
  weight,
  onClose,
}: {
  weight: number;
  onClose: () => void;
}) => {
  const BAR_WEIGHT = 20; // Standard barbell
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];

  const calculatePlates = (target: number) => {
    let remaining = (target - BAR_WEIGHT) / 2;
    const result: Record<number, number> = {};

    if (remaining <= 0) return null;

    availablePlates.forEach((plate) => {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        result[plate] = count;
        remaining -= count * plate;
      }
    });
    return result;
  };

  const plates = calculatePlates(weight);

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
      <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase italic text-slate-500">
            Plate Calculator
          </h3>
          <button onClick={onClose} className="p-2 text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-4xl font-black italic text-white tracking-tighter">
            {weight}
            <span className="text-sm ml-1 text-slate-500">KG</span>
          </p>
          <p className="text-[9px] font-bold text-slate-600 uppercase mt-1 tracking-widest">
            20kg Barbell Included
          </p>
        </div>

        <div className="space-y-3">
          {plates ? (
            Object.entries(plates)
              .reverse()
              .map(([size, count]) => (
                <div
                  key={size}
                  className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-slate-800/50"
                >
                  <span className="text-xs font-black text-white italic">
                    {size} KG
                  </span>
                  <span className="bg-[var(--brand-primary)] text-black text-[10px] font-black px-3 py-1 rounded-lg">
                    x {count}
                  </span>
                </div>
              ))
          ) : (
            <p className="text-center text-[10px] font-black uppercase text-red-500/50 py-4">
              Weight below bar weight
            </p>
          )}
        </div>

        <p className="text-center text-[8px] font-bold text-slate-700 uppercase mt-6 tracking-tighter">
          Plates per side
        </p>
      </div>
    </div>
  );
};
