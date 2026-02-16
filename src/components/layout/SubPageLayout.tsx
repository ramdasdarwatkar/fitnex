import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface SubPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const SubPageLayout = ({ children, title }: SubPageLayoutProps) => {
  const navigate = useNavigate();

  // Reset scroll to top on every sub-page mount
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-main)] min-h-screen pt-[env(safe-area-inset-top)] pb-32">
      {/* HEADER */}
      <header className="px-6 py-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-slate-800 flex items-center justify-center text-[var(--text-main)] active:scale-90 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--text-main)]">
          {title}
        </h1>
      </header>

      {/* CONTENT */}
      <main className="flex-1 flex flex-col px-6">{children}</main>
    </div>
  );
};
