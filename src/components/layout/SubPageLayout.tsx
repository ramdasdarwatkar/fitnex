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

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    // Safety check: if there's no history, go to dashboard
    if (window.history.length <= 1) {
      navigate("/dashboard");
    } else {
      navigate(-1);
    }
  };

  return (
    /* Using safe-area-inset-top for notched phones */
    <div className="flex-1 flex flex-col bg-bg-main min-h-screen pt-[env(safe-area-inset-top)] pb-32">
      {/* HEADER: Sticky header feels more 'native' on long pages */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-bg-main/80 backdrop-blur-md z-40 min-h-[80px]">
        {/* LEFT: BACK BUTTON */}
        <div className="relative z-10">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-text-main active:scale-90 transition-all btn-scale"
          >
            <ArrowLeft size={32} strokeWidth={3} />
          </button>
        </div>

        {/* CENTER: TITLE */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="text-xl font-bold text-text-main pointer-events-auto truncate px-16 text-center uppercase tracking-tight">
            {title}
          </h1>
        </div>

        {/* RIGHT: ACTION SLOT */}
        <div className="relative z-10">
          {rightElement ? (
            <div className="flex items-center gap-3">{rightElement}</div>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      {/* CONTENT: Fade in animation from index.css */}
      <main className="flex-1 flex flex-col px-6 page-enter">{children}</main>
    </div>
  );
};
