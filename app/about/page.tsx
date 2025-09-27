"use client";

import { useState, useEffect } from "react";
import { NewMobileHeader } from "@/components/new-mobile-header";
import { AboutContent } from "@/components/about-content";

export default function AboutPage() {
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
      <NewMobileHeader currentPage="about" collectionCount={collectionCount} />
      <div className="pt-16">
        <AboutContent setView={() => {}} />
      </div>
    </div>
  );
}
