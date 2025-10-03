"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CollectionRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with collection view
    router.replace('/?view=collection');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-black text-xl">Loading Collection...</div>
      </div>
    </div>
  );
}