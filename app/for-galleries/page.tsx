"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RouteJsonLd } from "@/components/route-json-ld";
import { PAGES, webPageJsonLd } from "@/lib/seo";

export default function ForGalleriesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?view=why-kaleidorium&role=gallery");
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <RouteJsonLd data={webPageJsonLd(PAGES.forGalleries)} />
      <div className="text-center">
        <div className="text-black text-xl">Loading For Galleries...</div>
      </div>
    </div>
  );
}
