import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UIProvider, useUI } from "../../context/UIContext";
import { BottomNav } from "../nav/BottomNav";
import { Sidebar } from "../nav/Sidebar";

const NAV_HEIGHT = 80;

const LayoutContent = () => {
  const { isSidebarOpen, closeSidebar } = useUI();
  const location = useLocation();

  // DIRECT REF TO SCROLL CONTAINER
  const scrollRef = useRef<HTMLElement | null>(null);

  // HARD RESET SCROLL ON ROUTE CHANGE
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    // ALSO reset window just in case Samsung/iOS uses it
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="relative h-full text-white overflow-hidden">
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 h-full border-r border-slate-900">
          <Sidebar isOpen={true} onClose={() => {}} isStatic />
        </div>

        {/* Mobile Drawer */}
        <div className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        </div>

        {/* MAIN SCROLL AREA */}
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto samsung-scroll pt-4"
          style={{ paddingBottom: NAV_HEIGHT + 8 }}
        >
          <div className="max-w-4xl mx-auto w-full px-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* FLOATING BOTTOM NAV */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
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
