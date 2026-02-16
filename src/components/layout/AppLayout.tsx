import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UIProvider, useUI } from "../../context/UIContext";
import { BottomNav } from "../nav/BottomNav";
import { Sidebar } from "../nav/Sidebar";

const NAV_HEIGHT = 80;

const LayoutContent = () => {
  const { isSidebarOpen, closeSidebar } = useUI();
  const location = useLocation();
  const scrollRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    // Scroll to top on every route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    /* We remove overflow-hidden to let the page backgrounds flow naturally */
    <div className="relative min-h-screen text-[var(--text-main)] bg-[var(--bg-main)]">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 border-r border-[var(--border-color)]">
          <Sidebar isOpen={true} onClose={() => {}} isStatic />
        </div>

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        </div>

        {/* MAIN CONTAINER 
            No overflow-y-auto here; we let the body/document handle the scroll 
            to ensure the background is never interrupted.
        */}
        <main className="flex-1 flex flex-col w-full">
          <Outlet />
        </main>
      </div>

      {/* FIXED BOTTOM NAV */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none"
        style={{ height: NAV_HEIGHT }}
      >
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
