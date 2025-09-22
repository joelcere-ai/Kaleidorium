"use client";
import { useState, useEffect, Suspense } from "react";
import SimpleTest from "@/components/simple-test";

function HomeContent() {
  // DIAGNOSTIC MODE: Remove all complex logic
  const [isAppLoading, setIsAppLoading] = useState(true);

  // DIAGNOSTIC MODE: Skip all loading logic
  useEffect(() => {
    // Force disable loading immediately
    setIsAppLoading(false);
  }, []);

  // DIAGNOSTIC: Always show SimpleTest, no loading screen
  return <SimpleTest />;
}

export default function Home() {
  // Keep Suspense for Next.js compatibility but with simple fallback
  return (
    <Suspense fallback={<div>Loading diagnostic...</div>}>
      <HomeContent />
    </Suspense>
  );
}

