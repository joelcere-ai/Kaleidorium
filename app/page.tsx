"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArtDiscovery from "@/components/art-discovery";

function HomeContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") || "discover";
  const [view, setView] = useState<typeof initialView>(initialView);
  const [collectionCount, setCollectionCount] = useState(0);

  // Update view if query param changes (e.g., via navigation)
  useEffect(() => {
    const paramView = (searchParams.get("view") as typeof view) || "discover";
    setView(paramView);
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-background">
      <ArtDiscovery view={view} setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

