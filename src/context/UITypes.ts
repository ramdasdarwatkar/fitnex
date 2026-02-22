import { createContext } from "react";

export interface UIContextType {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);
