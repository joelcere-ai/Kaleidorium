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
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [hasShownLoading, setHasShownLoading] = useState(false);

  // Update view if query param changes (e.g., via navigation)
  useEffect(() => {
    const paramView = (searchParams.get("view") as typeof view) || "discover";
    if (paramView !== view) {
      setView(paramView);
    }
  }, [searchParams, view]);

  // Simple loading screen check with debugging
  useEffect(() => {
    console.log('Page.tsx: Checking loading state...');
    
    // Clear any stale session storage after hard refresh
    if (performance.navigation.type === 1) { // Hard refresh
      console.log('Page.tsx: Hard refresh detected, clearing session storage');
      sessionStorage.removeItem('kaleidorium-loading-shown');
    }
    
    const hasShown = sessionStorage.getItem('kaleidorium-loading-shown');
    console.log('Page.tsx: hasShown =', hasShown);
    
    if (hasShown) {
      console.log('Page.tsx: Loading screen already shown, skipping to main app');
      setIsAppLoading(false);
      setHasShownLoading(true);
    } else {
      console.log('Page.tsx: First time loading, setting up timer');
      // Auto-complete loading after 3 seconds
      const timer = setTimeout(() => {
        console.log('Page.tsx: Timer completed, calling handleLoadingComplete');
        handleLoadingComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle app loading completion
  const handleLoadingComplete = () => {
    console.log('Page.tsx: handleLoadingComplete called');
    setIsAppLoading(false);
    setHasShownLoading(true);
    sessionStorage.setItem('kaleidorium-loading-shown', 'true');
    console.log('Page.tsx: App loading state set to false');
  };

  // Show simple loading screen
  if (isAppLoading) {
    console.log('Page.tsx: Showing loading screen...');
    return <AnimatedLoading onComplete={handleLoadingComplete} />;
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

