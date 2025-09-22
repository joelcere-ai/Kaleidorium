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

  // Simple loading screen check
  useEffect(() => {
    const hasShown = sessionStorage.getItem('kaleidorium-loading-shown');
    if (hasShown) {
      setIsAppLoading(false);
      setHasShownLoading(true);
    } else {
      // Auto-complete loading after 3 seconds
      const timer = setTimeout(() => {
        handleLoadingComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle app loading completion
  const handleLoadingComplete = () => {
    setIsAppLoading(false);
    setHasShownLoading(true);
    sessionStorage.setItem('kaleidorium-loading-shown', 'true');
  };

  // Show simple loading screen
  if (isAppLoading) {
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

