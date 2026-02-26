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

    const index = Math.round(scrollLeft / ITEM_WIDTH);
    const newValue = min + index;

    if (newValue !== value && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = (value - min) * ITEM_WIDTH;
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full py-6 select-none overflow-hidden">
      {/* Active Value Display - Updated typography */}
      <div className="text-7xl font-black italic mb-4 flex items-baseline gap-2 tabular-nums text-text-main">
        {value}
        <span className="text-2xl text-brand-primary font-black uppercase not-italic">
          {unit}
        </span>
      </div>

      <div className="relative w-full h-32 flex items-center justify-center">
        {/* THE NEEDLE: Normalized shadow and color */}
        <div className="absolute inset-0 flex justify-center pointer-events-none z-20">
          <div className="w-1.5 h-24 bg-brand-primary rounded-full shadow-[0_0_20px_var(--brand-primary-alpha)] opacity-80" />
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {/* LEFT SPACER */}
          <div
            className="shrink-0 w-[50%]"
            style={{ marginLeft: `-${ITEM_WIDTH / 2}px` }}
          />

          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(
            (num) => (
              <div
                key={num}
                className="flex flex-col items-center justify-end shrink-0 snap-center z-10"
                style={{ width: `${ITEM_WIDTH}px` }}
              >
                <div
                  className={`w-1 rounded-full mb-3 transition-all duration-150 ${
                    num === value
                      ? "bg-brand-primary h-20 opacity-100 scale-x-150"
                      : num % 5 === 0
                        ? "h-10 bg-text-muted opacity-60"
                        : "h-6 bg-border-color opacity-40"
                  }`}
                />

                {num % 5 === 0 && (
                  <span
                    className={`text-[10px] font-black uppercase italic transition-colors ${
                      num === value ? "text-brand-primary" : "text-text-muted"
                    }`}
                  >
                    {num}
                  </span>
                )}
              </div>
            ),
          )}

          {/* RIGHT SPACER */}
          <div
            className="shrink-0 w-[50%]"
            style={{ marginRight: `-${ITEM_WIDTH / 2}px` }}
          />
        </div>
      </div>
    </div>
  );
};
