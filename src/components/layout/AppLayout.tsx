import { UIProvider, useUI } from "../../context/UIContext";
import { BottomNav } from "../nav/BottomNav";
import { Sidebar } from "../nav/Sidebar";

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { isSidebarOpen, closeSidebar } = useUI();

  return (
    <div className="flex h-screen text-white overflow-hidden">
      {/* Sidebar: Persistent on Web (lg:block), Drawer on Mobile */}
      <div className="hidden lg:block w-72 h-full border-r border-slate-900">
        <Sidebar isOpen={true} onClose={() => {}} isStatic={true} />
      </div>

      {/* Mobile Drawer */}
      <div className="lg:hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>

      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* MAIN SCROLL AREA */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-32 pt-4">
          <div className="max-w-4xl mx-auto w-full">{children}</div>
        </main>

        {/* Bottom Nav: Only visible on Mobile */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <UIProvider>
    <LayoutContent>{children}</LayoutContent>
  </UIProvider>
);
