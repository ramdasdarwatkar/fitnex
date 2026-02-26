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
    <div className="h-screen w-full flex flex-col bg-bg-main overflow-hidden">
      {/* 1. FIXED HEADER SECTION */}
      <div className="shrink-0 z-50 bg-bg-main/80 backdrop-blur-xl border-b border-border-color/40">
        {/* Safe area padding for the notch */}
        <div className="pt-notch-pro" />

        <header className="flex items-center justify-between h-16 px-6">
          {/* LEFT: BACK BUTTON */}
          <div className="flex-1 flex items-center">
            <button
              onClick={handleBack}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-text-main active:scale-90 transition-all rounded-xl hover:bg-text-main/5"
            >
              <ArrowLeft size={24} strokeWidth={2} />
            </button>
          </div>

          {/* CENTER: TITLE (Standardized) */}
          <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-sm font-bold text-text-main tracking-wide truncate px-16 text-center leading-none uppercase">
              {title}
            </h1>
          </div>

          {/* RIGHT: ACTION SLOT */}
          <div className="flex-1 flex items-center justify-end">
            {rightElement && (
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
                {rightElement}
              </div>
            )}
          </div>
        </header>
      </div>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <main
        id="subpage-scroll-area"
        className="flex-1 overflow-y-auto overflow-x-hidden samsung-scroll"
      >
        {/* PX-6 GUTTER: The only place side padding exists */}
        <div className="page-container px-6 py-6 pb-12">{children}</div>
      </main>
    </div>
  );
};
