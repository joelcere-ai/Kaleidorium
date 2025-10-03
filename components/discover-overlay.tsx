"use client";

import { useEffect, useState } from 'react';
import ArtDiscovery from './art-discovery';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigation } from './navigation-context';

export function DiscoverOverlay() {
  const { showDiscoverOverlay, closeDiscoverOverlay } = useNavigation();
  const [collectionCount, setCollectionCount] = useState(0);

  if (!showDiscoverOverlay) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-serif font-semibold text-black">Kaleidorium</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeDiscoverOverlay}
          className="text-black hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto">
        <ArtDiscovery 
          view="discover"
          setView={() => {}}
          collectionCount={collectionCount}
          setCollectionCount={setCollectionCount}
        />
      </div>
    </div>
  );
}
