import { useLayoutEffect, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "../nav/BottomNav";
import { Sidebar } from "../nav/Sidebar";
import { useUI } from "../../hooks/useUI";
import { UIProvider } from "../../context/UIProvider";

const NAV_HEIGHT = 80;

const LayoutContent = () => {
  const { isSidebarOpen, closeSidebar } = useUI();
  const location = useLocation();

  // 1. Scroll-to-Top on Route Change
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 2. Body Scroll Lock (Enhancement)
  // Prevents background scrolling when mobile menu is active
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isSidebarOpen]);

  return (
    <div className="relative min-h-screen text-text-main bg-bg-main selection:bg-brand-primary/30">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar (Left Rail) */}
        <aside className="hidden lg:block w-72 border-r border-border-color shrink-0">
          <Sidebar isOpen={true} onClose={() => {}} isStatic />
        </aside>

        {/* Mobile Sidebar (Overlay Drawer) */}
        <aside className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* The 'page-enter' class from our index.css adds 
            the subtle fade-in we defined earlier.
          */}
          <div className="flex-1 page-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {/* Safe area padding-bottom ensures it stays above 
        the iOS home indicator.
      */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none pb-[env(safe-area-inset-bottom)]"
        style={{
          height: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="pointer-events-auto h-full">
          <BottomNav />
        </div>
      </nav>
    </div>
  );
};

export const AppLayout = () => (
  <UIProvider>
    <LayoutContent />
  </UIProvider>
);
