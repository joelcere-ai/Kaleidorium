"use client";
import { AppHeader } from "./app-header";

interface AppHeaderWrapperProps {
  view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact";
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void;
  collectionCount: number;
  onNavigate?: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void;
}

export default function AppHeaderWrapper({ view, setView, collectionCount, onNavigate }: AppHeaderWrapperProps) {
  return <AppHeader view={view} setView={onNavigate || setView} collectionCount={collectionCount} />;
} 