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

  // Temporarily disable loading screen to test tab switching
  useEffect(() => {
    // Always skip loading screen for now
    setIsAppLoading(false);
    setHasShownLoading(true);
  }, []);

  // Handle app loading completion
  const handleLoadingComplete = () => {
    setIsAppLoading(false);
    setHasShownLoading(true);
    sessionStorage.setItem('kaleidorium-loading-shown', 'true');
  };

  // Temporarily disable loading screen
  // if (isAppLoading) {
  //   console.log('Showing loading screen...')
  //   return <AnimatedLoading onComplete={handleLoadingComplete} />;
  // }

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

