"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { NewMobileHeader } from "@/components/new-mobile-header";
import { DesktopHeader } from "@/components/desktop-header";
import { useNavigation } from "@/components/navigation-context";
import MobileCardStack from "@/components/mobile-card-stack";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";

function CollectionContent() {
  const router = useRouter();
  const { navigateToView } = useNavigation();
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

  // Navigation is now handled by the NavigationContext in the headers


  const handleRemoveFromCollection = (id: string) => {
    const updatedCollection = collection.filter(artwork => artwork.id !== id);
    setCollection(updatedCollection);
    setCollectionCount(updatedCollection.length);
    
    // Update localStorage
    localStorage.setItem('artwork-collection', JSON.stringify(updatedCollection));
  };


  return (
    <div className="min-h-screen">
      {/* Conditional header rendering */}
      {isMobile ? (
        <NewMobileHeader currentPage="collection" collectionCount={collectionCount} />
      ) : (
        <DesktopHeader currentPage="collection" collectionCount={collectionCount} />
      )}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigateToView("discover")} style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Discovery
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-base font-serif font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Times New Roman, serif'}}>My Collection ({collectionCount})</h1>
        </div>

        {collection.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Your collection is empty</h3>
              <p className="text-gray-600 mb-6" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Start exploring Kaleidorium's curated selection of artwork and add pieces you love to your collection.</p>
              <Button 
                onClick={() => navigateToView("discover")}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
              >
                Discover Artwork
              </Button>
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
                    <h3 className="font-semibold text-lg mb-1" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>{artwork.title}</h3>
                    <p className="text-gray-600 mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>by {artwork.artist}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveFromCollection(artwork.id)}
                      style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
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
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Kaleidorium</h1>
          <p className="text-lg text-white">Your Personal Art Curator</p>
        </div>
      </div>
    }>
      <CollectionContent />
    </Suspense>
  );
}
