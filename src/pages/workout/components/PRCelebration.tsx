import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // 1. Import createPortal
import { Trophy } from "lucide-react";

interface PRCelebrationProps {
  exerciseName: string;
  weight: number | string;
  onClose: () => void;
}

const DURATION_MS = 3000;
const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const PRCelebration = ({
  exerciseName,
  weight,
  onClose,
}: PRCelebrationProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(onClose, DURATION_MS);
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      setProgress(Math.min(elapsed / DURATION_MS, 1));
      if (elapsed < DURATION_MS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [onClose]);

  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  // 2. Wrap everything in createPortal to target the document body
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6
                 bg-bg-main/70 backdrop-blur-md
                 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative bg-bg-surface border border-brand-primary/40 rounded-[3rem] p-10
                   flex flex-col items-center text-center
                   animate-in zoom-in-95 fade-in duration-300
                   max-w-xs w-full"
        style={{
          boxShadow: `0 0 0 1px var(--glow-primary), 0 8px 48px var(--glow-primary), 0 2px 8px var(--shadow-sm)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Trophy with countdown ring */}
        <div className="relative flex items-center justify-center mb-6">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            className="-rotate-90 absolute inset-0"
          >
            <circle
              cx="48"
              cy="48"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-brand-primary/10"
            />
            <circle
              cx="48"
              cy="48"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--brand-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: "drop-shadow(0 0 4px var(--brand-primary))",
                transition: "stroke-dashoffset 50ms linear",
              }}
            />
          </svg>

          <div
            className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center"
            style={{ boxShadow: "0 0 24px var(--glow-primary)" }}
          >
            <Trophy
              size={38}
              strokeWidth={2.5}
              style={{ color: "var(--color-on-brand)" }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-black uppercase italic text-text-main mb-2 tracking-tight">
          New Record!
        </h2>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 italic text-text-muted/60">
          {exerciseName}
        </p>

        <div className="text-5xl font-black italic text-brand-primary tabular-nums leading-none">
          {weight}{" "}
          <span className="text-xs uppercase font-black text-brand-primary/60">
            kg
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-8 text-[9px] font-black uppercase tracking-widest text-text-muted/30 hover:text-text-muted/80 transition-colors duration-200"
        >
          Tap to dismiss
        </button>
      </div>
    </div>,
    document.body, // 3. This tells React to render the modal at the root level
  );
};
