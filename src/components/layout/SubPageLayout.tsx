import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";

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

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-main)] min-h-screen pt-[env(safe-area-inset-top)] pb-32">
      {/* HEADER */}
      <header className="px-6 py-6 flex items-center justify-between relative min-h-[80px]">
        {/* LEFT: BACK BUTTON */}
        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] active:scale-90 transition-all"
          >
            <IoIosArrowRoundBack size={40} />
          </button>
        </div>

        {/* CENTER: TITLE (Absolute Positioned for perfect centering) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="text-xl font-black text-[var(--text-main)] pointer-events-auto truncate px-16 text-center">
            {title}
          </h1>
        </div>

        {/* RIGHT: ACTION SLOT */}
        <div className="relative z-10">
          {rightElement ? (
            <div className="flex items-center gap-3">{rightElement}</div>
          ) : (
            /* Spacer to maintain layout balance if rightElement is null */
            <div className="w-10" />
          )}
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 flex flex-col px-6">{children}</main>
    </div>
  );
};
