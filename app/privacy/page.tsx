"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with privacy view
    router.replace('/?view=privacy');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl">Loading Privacy Policy...</div>
      </div>
    </div>
  );
}