import React, { useState, useCallback, useMemo } from "react";
import { UIContext } from "./UITypes";

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // useMemo prevents unnecessary re-renders in components using useUI
  const value = useMemo(
    () => ({
      isSidebarOpen,
      openSidebar,
      closeSidebar,
    }),
    [isSidebarOpen, openSidebar, closeSidebar],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
