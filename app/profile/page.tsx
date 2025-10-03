"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with profile view
    router.replace('/?view=profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl">Loading Profile...</div>
      </div>
    </div>
  );
}