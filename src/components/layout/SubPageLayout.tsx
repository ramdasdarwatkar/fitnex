import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export const SubPageLayout = ({ title, children }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-slate-900 safe-ios-top">
        <div className="flex items-center justify-between h-16 px-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-black uppercase tracking-widest">
            {title}
          </h1>

          <div className="w-10" />
        </div>
      </header>

      {/* CONTENT */}
      <div className="px-6 py-6 space-y-6">{children}</div>
    </div>
  );
};
