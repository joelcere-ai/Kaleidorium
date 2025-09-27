"use client"

import { ProfilePage } from '@/components/profile-page';
import { useRouter } from 'next/navigation';
import { NewMobileHeader } from '@/components/new-mobile-header';
import { useState, Suspense, useEffect } from 'react';

function ProfileContent() {
  const router = useRouter();
  const [view, setView] = useState<"discover" | "collection" | "profile" | "for-artists" | "about">("profile");
  const [collectionCount, setCollectionCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleReturnToDiscover = () => {
    router.push('/');
  };

  const handleNavigate = (nextView: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => {
    if (nextView === "profile") return;
    if (nextView === "contact") {
      router.push("/contact");
      return;
    }
    router.push(`/?view=${nextView}`);
  };
  
  return (
    <div className="min-h-screen">
      <NewMobileHeader currentPage="profile" collectionCount={collectionCount} />
      <div className="flex-1 overflow-y-auto pt-16">
        <ProfilePage collection={[]} onReturnToDiscover={handleReturnToDiscover} />
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Kaleidorium</h1>
          <p className="text-lg text-white">Your Personal Art Curator</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
} 