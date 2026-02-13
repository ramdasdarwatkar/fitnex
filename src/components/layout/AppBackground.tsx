import React from "react";

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full">
      {/* FIXED UNDERLAY */}

      {/* CONTENT LAYER - No overflow-hidden here! */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
