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
    setView(paramView);
  }, [searchParams]);

  // Check if we've already shown the loading screen in this session
  useEffect(() => {
    const hasShown = sessionStorage.getItem('kaleidorium-loading-shown');
    if (hasShown) {
      setIsAppLoading(false);
      setHasShownLoading(true);
    }
    
    // Prevent page reload on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Don't reload when tab becomes visible again
        console.log('Tab became visible - maintaining state');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle app loading completion
  const handleLoadingComplete = () => {
    setIsAppLoading(false);
    setHasShownLoading(true);
    sessionStorage.setItem('kaleidorium-loading-shown', 'true');
  };

  // Show animated loading screen (simplified for testing)
  if (isAppLoading) {
    console.log('Showing loading screen...')
    return <AnimatedLoading onComplete={handleLoadingComplete} />;
  }

  return (
    <main className="min-h-screen bg-background">
      <ArtDiscovery view={view} setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<AnimatedLoading />}>
      <HomeContent />
    </Suspense>
  );
}

