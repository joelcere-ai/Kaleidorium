"use client";

import { useState, useEffect } from "react";
import { NewMobileHeader } from "@/components/new-mobile-header";
import { DesktopHeader } from "@/components/desktop-header";
import { AboutContent } from "@/components/about-content";
import { useMobileDetection } from "@/hooks/use-mobile-detection";

export default function AboutPage() {
  const { isMobile } = useMobileDetection();
  const [collectionCount, setCollectionCount] = useState(0);

  useEffect(() => {
    // Load collection count from localStorage
    const storedCollection = localStorage.getItem('artwork-collection');
    if (storedCollection) {
      const collection = JSON.parse(storedCollection);
      setCollectionCount(collection.length);
    }
  }, []);

  return (
    <div className="min-h-screen">
      {isMobile ? (
        <>
          <NewMobileHeader currentPage="about" collectionCount={collectionCount} />
          <div className="pt-16">
            <AboutContent setView={() => {}} />
          </div>
        </>
      ) : (
        <>
          <DesktopHeader currentPage="about" collectionCount={collectionCount} />
          <div className="pt-20">
            <AboutContent setView={() => {}} />
          </div>
        </>
      )}
    </div>
  );
}
