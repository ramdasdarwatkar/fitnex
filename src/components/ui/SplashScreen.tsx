export const SplashScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-bg-main">
    <div className="flex flex-col items-center gap-4">
      <div className="text-brand-primary animate-pulse font-black italic text-4xl tracking-tighter">
        FITNEX
      </div>
      <div className="h-1 w-12 bg-surface overflow-hidden rounded-full">
        <div className="h-full bg-brand-primary animate-progress-loading" />
      </div>
    </div>
  </div>
);
