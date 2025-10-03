"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TermsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with terms view
    router.replace('/?view=terms');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-black text-xl">Loading Terms of Service...</div>
      </div>
    </div>
  );
} 