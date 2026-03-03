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
      {/* 1. THE TOP SHIELD (Mobile Only)
          Fixed guard that covers the notch area. 
          Using 95% opacity to block scrolling text effectively.
      */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-110 bg-bg-main/95 backdrop-blur-md pointer-events-none">
        <div className="pt-safe-pro" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
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
          className="flex-1 min-w-0 relative overflow-y-auto overflow-x-hidden samsung-scroll"
        >
          {/* Padding matches the Shield height exactly */}
          <div className="pt-safe-pro" />

          {/* THE GUTTER STANDARD */}
          <div className="page-container px-6 pb-20 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE NAVIGATION */}
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
