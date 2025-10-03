"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForArtistsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with for-artists view
    router.replace('/?view=for-artists');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-black text-xl">Loading For Artists...</div>
      </div>
    </div>
  );
}