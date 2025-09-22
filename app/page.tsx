"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArtDiscovery from "@/components/art-discovery";
import AnimatedLoading from "@/components/animated-loading";
import SimpleTest from "@/components/simple-test";

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

  // DIAGNOSTIC MODE: Skip all loading logic
  useEffect(() => {
    // Force disable loading immediately
    setIsAppLoading(false);
    setHasShownLoading(true);
  }, []);

  // Handle app loading completion (kept for compatibility)
  const handleLoadingComplete = () => {
    setIsAppLoading(false);
    setHasShownLoading(true);
    sessionStorage.setItem('kaleidorium-loading-shown', 'true');
  };

  // DIAGNOSTIC: Always show SimpleTest, no loading screen
  return <SimpleTest />;
}

export default function Home() {
  // DIAGNOSTIC: Skip Suspense to avoid any loading delays
  return <HomeContent />;
}

