import { ArrowLeft } from "lucide-react";
import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SubPageLayoutProps {
  children: React.ReactNode;
  title: string;
  rightElement?: React.ReactNode;
  // New prop for things that should never scroll
  footer?: React.ReactNode;
}

export const SubPageLayout = ({
  children,
  title,
  rightElement,
  footer,
}: SubPageLayoutProps) => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const scrollArea = document.getElementById("subpage-scroll-area");
    if (scrollArea) scrollArea.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    if (window.history.length <= 1) navigate("/dashboard");
    else navigate(-1);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-bg-main overflow-hidden">
      {/* HEADER */}
      <div className="shrink-0 z-50 bg-bg-main/95 backdrop-blur-md border-b border-border-color/40">
        <div className="pt-safe-pro" />
        <header className="flex items-center justify-between h-16 px-6">
          <div className="flex-1 flex items-center">
            <button
              onClick={handleBack}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-text-main active:scale-90 transition-all rounded-xl hover:bg-text-main/5"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-sm font-black text-text-main tracking-widest truncate px-16 text-center leading-none uppercase italic">
              {title}
            </h1>
          </div>
          <div className="flex-1 flex items-center justify-end">
            {rightElement}
          </div>
        </header>
      </div>

      {/* CONTENT AREA */}
      <main
        id="subpage-scroll-area"
        className="flex-1 overflow-y-auto samsung-scroll flex flex-col"
      >
        {/* pb-32 ensures content doesn't get hidden behind the fixed footer */}
        <div className="page-container px-6 py-6 pb-32 flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {/* FIXED FOOTER: Always at the bottom, ignores scroll */}
      {footer && (
        <div className="shrink-0 z-50 bg-gradient-to-t from-bg-main via-bg-main/90 to-transparent pt-6">
          <div className="px-6 pb-safe-pro">
            {footer}
            {/* Small extra gap for visual breathing room on non-iOS */}
            <div className="h-4" />
          </div>
        </div>
      )}
    </div>
  );
};
