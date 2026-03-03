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
  }, [min, value]);

  return (
    <div className="flex flex-col items-center w-full py-4 select-none overflow-hidden">
      <div className="text-6xl font-black italic mb-2 flex items-baseline gap-2 tabular-nums text-text-main">
        {value}
        <span className="text-xl text-brand-primary font-black uppercase italic">
          {unit}
        </span>
      </div>

      <div className="relative w-full h-28 flex items-center justify-center">
        <div className="absolute inset-0 flex justify-center pointer-events-none z-20">
          <div className="w-1.5 h-20 bg-brand-primary rounded-full shadow-glow-primary opacity-80" />
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar cursor-grab"
        >
          <div
            className="shrink-0 w-[50%]"
            style={{ marginLeft: `-${ITEM_WIDTH / 2}px` }}
          />
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(
            (num) => {
              const isSelected = num === value;
              const isMajor = num % 5 === 0;
              return (
                <div
                  key={num}
                  className="flex flex-col items-center justify-end shrink-0 snap-center z-10"
                  style={{ width: `${ITEM_WIDTH}px` }}
                >
                  <div
                    className={`w-1 rounded-full mb-3 transition-all duration-150 ${
                      isSelected
                        ? "bg-brand-primary h-16 scale-x-150"
                        : isMajor
                          ? "h-8 bg-text-muted opacity-60"
                          : "h-5 bg-border-color opacity-40"
                    }`}
                  />
                  {isMajor && (
                    <span
                      className={`text-[9px] font-black uppercase italic ${isSelected ? "text-brand-primary" : "text-text-muted"}`}
                    >
                      {num}
                    </span>
                  )}
                </div>
              );
            },
          )}
          <div
            className="shrink-0 w-[50%]"
            style={{ marginRight: `-${ITEM_WIDTH / 2}px` }}
          />
        </div>
      </div>
    </div>
  );
};
