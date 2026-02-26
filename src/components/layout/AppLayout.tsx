import { useLayoutEffect, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "../nav/BottomNav";
import { Sidebar } from "../nav/Sidebar";
import { useUI } from "../../hooks/useUI";
import { UIProvider } from "../../context/UIProvider";

const LayoutContent = () => {
  const { isSidebarOpen, closeSidebar } = useUI();
  const location = useLocation();

  // Reset scroll of the main container on route change
  useLayoutEffect(() => {
    const mainContent = document.getElementById("main-scroll-container");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
  }, [isSidebarOpen]);

  return (
    <div className="relative h-screen w-full text-text-main bg-bg-main overflow-hidden flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR - Standardized Border/Background */}
        <aside className="hidden lg:block w-72 h-full shrink-0 overflow-hidden bg-bg-surface border-r border-border-color/40">
          <Sidebar isOpen={true} onClose={() => {}} isStatic />
        </aside>

        {/* MOBILE SIDEBAR */}
        <aside className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        </aside>

        {/* MAIN VIEWPORT */}
        <main
          id="main-scroll-container"
          className="flex-1 min-w-0 relative overflow-y-auto overflow-x-hidden samsung-scroll pt-notch-pro"
        >
          {/* THE GUTTER STANDARD: 
              PX-6 is only here. Max-width 7xl ensures it looks 
              professional on wide tablets/desktops.
          */}
          <div className="page-container px-6 pb-12 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE NAVIGATION - High Z-Index to stay above cards */}
      <div className="lg:hidden z-100 border-t border-border-color/40">
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
