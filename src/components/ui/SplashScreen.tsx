export const SplashScreen = () => (
  /* Fixed inset-0 ensures it covers the entire viewport regardless of layout */
  <div className="fixed inset-0 z-9999 flex items-center justify-center bg-bg-main animate-in fade-in duration-500">
    <div className="flex flex-col items-center gap-6">
      {/* BRAND LOGO */}
      <div className="text-brand-primary animate-pulse font-black italic text-5xl tracking-tighter">
        FIT<span className="text-text-main">NEX</span>
      </div>

      {/* PROGRESS BAR CONTAINER */}
      <div className="h-1.5 w-24 bg-bg-surface-soft overflow-hidden rounded-full border border-border-color/10">
        <div className="h-full bg-brand-primary animate-progress-loading shadow-[0_0_12px_rgba(var(--brand-primary-rgb),0.5)]" />
      </div>

      {/* SUBTITLE */}
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted opacity-50">
        Initializing Engine
      </p>
    </div>
  </div>
);
