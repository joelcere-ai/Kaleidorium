"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArtDiscovery from "@/components/art-discovery";
import AnimatedLoading from "@/components/animated-loading";

function HomeContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") || "discover";
  const [view, setView] = useState<typeof initialView>(initialView);
  const [collectionCount, setCollectionCount] = useState(0);
  const [showApp, setShowApp] = useState(false);

  // Update view if query param changes (e.g., via navigation)
  useEffect(() => {
    const paramView = (searchParams.get("view") as typeof view) || "discover";
    if (paramView !== view) {
      setView(paramView);
    }
  }, [searchParams, view]);

  // Simplified loading - just show app after 3 seconds
  useEffect(() => {
    console.log('Page.tsx: Starting simplified loading...');
    const timer = setTimeout(() => {
      console.log('Page.tsx: Loading complete, showing app');
      setShowApp(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen for 3 seconds, then show app
  if (!showApp) {
    console.log('Page.tsx: Showing loading screen...');
    return <AnimatedLoading />;
  }

  console.log('Page.tsx: Showing main app with view =', view);

  return (
    <main className="min-h-screen bg-background">
      <ArtDiscovery view={view} setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

