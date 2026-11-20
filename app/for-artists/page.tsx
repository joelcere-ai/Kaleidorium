"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RouteJsonLd } from "@/components/route-json-ld";
import { PAGES, webPageJsonLd } from "@/lib/seo";

export default function ForArtistsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with for-artists view
    router.replace('/?view=why-kaleidorium&role=artist');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <RouteJsonLd data={webPageJsonLd(PAGES.forArtists)} />
      <div className="text-center">
        <div className="text-black text-xl">Loading For Artists...</div>
      </div>
    </div>
  );
}