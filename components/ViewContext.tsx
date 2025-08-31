"use client";
import React, { createContext, useContext, useState } from "react";

type ViewType = "discover" | "collection" | "profile" | "for-artists" | "about" | "contact";

interface ViewContextProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  collectionCount: number;
  setCollectionCount: (count: number) => void;
}

const ViewContext = createContext<ViewContextProps | undefined>(undefined);

export function useViewContext() {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useViewContext must be used within a ViewProvider");
  return ctx;
}

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewType>("discover");
  const [collectionCount, setCollectionCount] = useState(0);
  return (
    <ViewContext.Provider value={{ view, setView, collectionCount, setCollectionCount }}>
      {children}
    </ViewContext.Provider>
  );
} 