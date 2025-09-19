"use client"

import { ProfilePage } from '@/components/profile-page';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { useState, Suspense } from 'react';

function ProfileContent() {
  const router = useRouter();
  const [view, setView] = useState<"discover" | "collection" | "profile" | "for-artists" | "about" | "contact">("profile");
  const [collectionCount, setCollectionCount] = useState(0);
  
  const handleReturnToDiscover = () => {
    router.push('/');
  };

  const handleNavigate = (nextView: typeof view) => {
    if (nextView === "profile") return;
    router.push(`/?view=${nextView}`);
  };

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