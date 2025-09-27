"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ArtDiscovery from "@/components/art-discovery";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialView = (searchParams.get("view") as "discover" | "collection" | "profile" | "for-artists" | "about") || "discover";
  const [view, setViewState] = useState<typeof initialView>(initialView);
  const [collectionCount, setCollectionCount] = useState(0);
  const [showApp, setShowApp] = useState(false);

  // Create a setView function that updates both state and URL
  const setView = (newView: typeof initialView) => {
    console.log('🔧 setView called with:', newView);
    setViewState(newView);
    router.push(`/?view=${newView}`, { scroll: false });
  };

  // Update view if query param changes (e.g., via navigation)
  useEffect(() => {
    const paramView = (searchParams.get("view") as typeof view) || "discover";
    if (paramView !== view) {
      console.log('🔧 URL param changed, updating view from', view, 'to', paramView);
      setViewState(paramView);
    }
  }, [searchParams, view]);

  // ULTRA SIMPLE: Show app after 2 seconds, no loading screen
  useEffect(() => {
    console.log('🚨🚨🚨 DEPLOYMENT CHECK v5: Page.tsx ultra-simple loading starting - 2024-09-22-1140');
    console.log('🚨🚨🚨 IF YOU SEE THIS MESSAGE, THE DEPLOYMENT WORKED!');
    const timer = setTimeout(() => {
      console.log('🚨🚨🚨 DEPLOYMENT CHECK v5: Page.tsx showing app directly');
      setShowApp(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show blank screen for 2 seconds, then show app directly
  if (!showApp) {
    console.log('Page.tsx: Waiting to show app...');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  console.log('Page.tsx: Showing main app directly with view =', view);

  return (
    <main className="min-h-screen bg-background">
      <ArtDiscovery view={view} setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Kaleidorium</h1>
          <p className="text-lg text-white">Your Personal Art Curator</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

