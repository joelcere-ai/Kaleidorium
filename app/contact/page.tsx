"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with contact view
    router.replace('/?view=contact');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-black text-xl">Loading Contact...</div>
      </div>
    </div>
  );
}