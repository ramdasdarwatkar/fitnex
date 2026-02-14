import { useEffect, useRef } from "react";

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  unit: string;
}

export const RulerPicker = ({ min, max, value, onChange, unit }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ITEM_WIDTH = 20;

  const onScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft } = scrollRef.current;

    // We calculate the index based on the scroll position
    const index = Math.round(scrollLeft / ITEM_WIDTH);
    const newValue = min + index;

    if (newValue !== value && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      // Force the scroll to the exact pixel on load
      scrollRef.current.scrollLeft = (value - min) * ITEM_WIDTH;
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full py-6 select-none overflow-hidden">
      {/* Active Value Display */}
      <div className="text-7xl font-black mb-4 flex items-baseline gap-2 tabular-nums">
        {value}{" "}
        <span className="text-2xl text-brand font-bold uppercase">{unit}</span>
      </div>

      <div className="relative w-full h-32 flex items-center justify-center">
        {/* THE NEEDLE: Centered via Flex Layout */}
        <div className="absolute inset-0 flex justify-center pointer-events-none z-20">
          <div className="w-1.5 h-24 bg-brand rounded-full shadow-[0_0_20px_rgba(14,165,233,0.8)]" />
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {/* LEFT SPACER: Forces the first item to the center */}
          <div
            className="flex-shrink-0 w-[50%]"
            style={{ marginLeft: `-${ITEM_WIDTH / 2}px` }}
          />

          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(
            (num) => (
              <div
                key={num}
                className="flex flex-col items-center justify-end flex-shrink-0 snap-center z-10"
                style={{ width: `${ITEM_WIDTH}px` }}
              >
                <div
                  className={`w-1 rounded-full mb-3 transition-all duration-150 ${
                    num === value
                      ? "bg-brand h-20 opacity-100 scale-x-150"
                      : num % 5 === 0
                        ? "h-10 bg-slate-500 opacity-60"
                        : "h-6 bg-slate-800 opacity-40"
                  }`}
                />

                {num % 5 === 0 && (
                  <span
                    className={`text-[10px] font-black transition-colors ${
                      num === value ? "text-brand" : "text-slate-600"
                    }`}
                  >
                    {num}
                  </span>
                )}
              </div>
            ),
          )}

          {/* RIGHT SPACER: Allows the last item to reach the center */}
          <div
            className="flex-shrink-0 w-[50%]"
            style={{ marginRight: `-${ITEM_WIDTH / 2}px` }}
          />
        </div>
      </div>
    </div>
  );
};
