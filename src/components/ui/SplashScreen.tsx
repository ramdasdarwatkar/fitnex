export const SplashScreen = () => (
  /* z-9999 is perfect - it sits above the Shield, the Nav, and any Modals */
  <div className="fixed inset-0 z-9999 flex items-center justify-center bg-bg-main animate-in fade-in duration-500">
    <div className="flex flex-col items-center gap-6">
      {/* BRAND LOGO: Massive, Italic, and High-Impact */}
      <div className="text-brand-primary animate-pulse font-black italic text-6xl tracking-tighter select-none">
        FIT<span className="text-text-main">NEX</span>
      </div>

      {/* PROGRESS BAR CONTAINER */}
      <div className="h-1 w-32 bg-bg-surface rounded-full overflow-hidden border border-border-color/40 relative">
        <div
          className="h-full bg-brand-primary animate-progress-loading relative"
          style={{
            /* Applying the 'Neon Bloom' effect to the loading bar */
            boxShadow:
              "0 0 15px color-mix(in srgb, var(--brand-primary), transparent 40%)",
          }}
        />
      </div>

      {/* SUBTITLE: Extreme tracking for a cinematic feel */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted italic">
          Initializing Engine
        </p>
        {/* Subtle decorative element to add "tech" detail */}
        <div className="h-px w-4 bg-brand-primary/30" />
      </div>
    </div>
  </div>
);
