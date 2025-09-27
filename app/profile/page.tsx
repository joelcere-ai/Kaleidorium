"use client"

import { ProfilePage } from '@/components/profile-page';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { MobileHeader } from '@/components/mobile-header';
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

  const handleNavigate = (nextView: "discover" | "collection" | "profile" | "for-artists" | "about") => {
    if (nextView === "profile") return;
    router.push(`/?view=${nextView}`);
  };
  
  // Render mobile version with MobileHeader
  if (isMobile) {
    return (
      <div className="min-h-screen">
        <MobileHeader currentPage="profile" />
        <div className="flex-1 overflow-y-auto">
          <ProfilePage collection={[]} onReturnToDiscover={handleReturnToDiscover} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader view={view} setView={handleNavigate} collectionCount={collectionCount} />
      <ProfilePage collection={[]} onReturnToDiscover={handleReturnToDiscover} />
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
} 