import { ArrowLeft } from "lucide-react";
import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SubPageLayoutProps {
  children: React.ReactNode;
  title: string;
  rightElement?: React.ReactNode;
}

export const SubPageLayout = ({
  children,
  title,
  rightElement,
}: SubPageLayoutProps) => {
  const navigate = useNavigate();

  // Reset scroll of the local main container on mount
  useLayoutEffect(() => {
    const scrollArea = document.getElementById("subpage-scroll-area");
    if (scrollArea) scrollArea.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    if (window.history.length <= 1) {
      navigate("/dashboard");
    } else {
      navigate(-1);
    }
  };

  return (
    /* h-screen + overflow-hidden: 
       This stops the whole page from scrolling and lets us control 
       the scroll area internally.
    */
    <div className="h-screen w-full flex flex-col bg-bg-main overflow-hidden selection:bg-brand-primary/20">
      {/* 1. FIXED HEADER SECTION */}
      <div className="shrink-0 z-50 bg-bg-main/60 backdrop-blur-xl border-b border-border-color/5">
        {/* Safe area padding for iPhone 15 notch */}
        <div className="pt-safe-half" />

        <header className="flex items-center justify-between h-20 px-6">
          {/* LEFT: BACK BUTTON */}
          <div className="flex-1 flex items-center">
            <button
              onClick={handleBack}
              className="w-12 h-12 -ml-3 flex items-center justify-center text-text-main active:scale-90 transition-all rounded-full hover:bg-bg-surface-soft"
            >
              <ArrowLeft size={26} strokeWidth={2.5} />
            </button>
          </div>

          {/* CENTER: TITLE */}
          <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-xl font-bold text-text-main tracking-tight truncate px-20 text-center leading-none uppercase">
              {title}
            </h1>
          </div>

          {/* RIGHT: ACTION SLOT */}
          <div className="flex-1 flex items-center justify-end">
            {rightElement ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
                {rightElement}
              </div>
            ) : (
              <div className="w-12" />
            )}
          </div>
        </header>
      </div>

      {/* 2. SCROLLABLE CONTENT AREA: 
          - flex-1 + overflow-y-auto: 
            This makes only this section scroll while the header stays put.
      */}
      <main
        id="subpage-scroll-area"
        className="flex-1 overflow-y-auto overflow-x-hidden samsung-scroll"
      >
        <div className="px-6 py-6 page-enter pb-8">{children}</div>
      </main>
    </div>
  );
};
