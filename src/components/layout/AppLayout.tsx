import { useLayoutEffect, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "../nav/BottomNav";
import { Sidebar } from "../nav/Sidebar";
import { useUI } from "../../hooks/useUI";
import { UIProvider } from "../../context/UIProvider";

const LayoutContent = () => {
  const { isSidebarOpen, closeSidebar } = useUI();
  const location = useLocation();

  useLayoutEffect(() => {
    const mainContent = document.getElementById("main-scroll-container");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isSidebarOpen]);

  return (
    <div className="relative h-screen w-full text-text-main bg-bg-main overflow-hidden flex flex-col selection:bg-brand-primary/20">
      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-72 h-full shrink-0 overflow-hidden bg-bg-surface">
          <Sidebar isOpen={true} onClose={() => {}} isStatic />
        </aside>

        {/* MOBILE SIDEBAR */}
        <aside className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        </aside>

        {/* MAIN VIEWPORT */}
        <main
          id="main-scroll-container"
          className="flex-1 min-w-0 relative overflow-y-auto overflow-x-hidden samsung-scroll pt-safe-half"
        >
          {/* FIXED SPACING: 
              - Changed p-5 to px-6 to match SubPageLayout.
              - Added flex flex-col to match the inner structure.
          */}
          <div className="page-container flex-1 flex flex-col px-6 pb-36 lg:pb-12 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE NAVIGATION */}
      <div className="lg:hidden z-100">
        <BottomNav />
      </div>
    </div>
  );
};

export const AppLayout = () => (
  <UIProvider>
    <LayoutContent />
  </UIProvider>
);
