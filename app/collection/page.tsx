"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { MobileHeader } from "@/components/mobile-header";
import MobileCardStack from "@/components/mobile-card-stack";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

function CollectionContent() {
  const router = useRouter();
  const [view, setView] = useState<"discover" | "collection" | "profile" | "for-artists" | "about">("collection");
  const [collectionCount, setCollectionCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [collection, setCollection] = useState<any[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Load collection from localStorage or API
    const loadCollection = () => {
      try {
        const savedCollection = localStorage.getItem('artwork-collection');
        if (savedCollection) {
          const parsedCollection = JSON.parse(savedCollection);
          setCollection(parsedCollection);
          setCollectionCount(parsedCollection.length);
        }
      } catch (error) {
        console.error('Error loading collection:', error);
      }
    };
    
    loadCollection();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleReturnToDiscover = () => {
    router.push('/');
  };

  const handleNavigate = (nextView: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => {
    if (nextView === "collection") return;
    if (nextView === "contact") {
      router.push("/contact");
      return;
    }
    if (nextView === "profile") {
      router.push("/profile");
      return;
    }
    router.push(`/?view=${nextView}`);
  };

  const handleRemoveFromCollection = (id: string) => {
    const updatedCollection = collection.filter(artwork => artwork.id !== id);
    setCollection(updatedCollection);
    setCollectionCount(updatedCollection.length);
    
    // Update localStorage
    localStorage.setItem('artwork-collection', JSON.stringify(updatedCollection));
  };

  const handleSetView = (newView: "discover" | "collection" | "profile" | "for-artists" | "about") => {
    if (newView === "collection") return;
    if (newView === "profile") {
      router.push("/profile");
      return;
    }
    router.push(`/?view=${newView}`);
  };

  // Render mobile version with MobileHeader and MobileCardStack
  if (isMobile) {
    return (
      <div className="min-h-screen">
        <MobileHeader currentPage="collection" />
        <div className="flex-1 overflow-y-auto">
          <MobileCardStack
            artworks={[]}
            currentIndex={0}
            onNext={() => {}}
            onLike={() => {}}
            onDislike={() => {}}
            onAddToCollection={() => {}}
            onLoadMore={() => {}}
            setView={handleSetView}
            view="collection"
            collection={collection}
            onRemoveFromCollection={handleRemoveFromCollection}
            onFilterChange={() => {}}
            onClearFilters={() => {}}
            showFallbackMessage={false}
            isLandscape={false}
            isPortrait={true}
            screenWidth={0}
            screenHeight={0}
          />
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="min-h-screen">
      <AppHeader view={view} setView={handleNavigate} collectionCount={collectionCount} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleReturnToDiscover}>
            ← Back to Discovery
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Collection ({collectionCount})</h1>
        </div>

        {collection.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-black">Your collection is empty</h3>
              <p className="text-gray-600 mb-6">Start exploring Kaleidorium's curated selection of artwork and add pieces you love to your collection.</p>
              <Button onClick={handleReturnToDiscover}>Discover Artwork</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.map((artwork) => (
              <Card key={artwork.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{artwork.title}</h3>
                    <p className="text-gray-600 mb-2">by {artwork.artist}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveFromCollection(artwork.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Collection() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <CollectionContent />
    </Suspense>
  );
}
