"use client";
import { AppHeader } from "./app-header";

interface AppHeaderWrapperProps {
  view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact";
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void;
  collectionCount: number;
  onNavigate?: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void;
}

export default function AppHeaderWrapper({ view, setView, collectionCount, onNavigate }: AppHeaderWrapperProps) {
  // Filter out "contact" from view type since AppHeader doesn't support it
  const appHeaderView = view === "contact" ? undefined : view as "discover" | "collection" | "profile" | "for-artists" | "about" | undefined;
  
  // Create a filtered setView function that handles contact separately
  const handleSetView = (newView: "discover" | "collection" | "profile" | "for-artists" | "about") => {
    if (onNavigate) {
      onNavigate(newView);
    } else {
      setView(newView);
    }
  };
  
  return <AppHeader view={appHeaderView} setView={handleSetView} collectionCount={collectionCount} />;
} 