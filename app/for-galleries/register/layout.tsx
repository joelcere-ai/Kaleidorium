import type { Metadata } from "next"
import { RouteJsonLd } from "@/components/route-json-ld"
import { PAGES, pageMetadata, webPageJsonLd } from "@/lib/seo"

const page = PAGES.galleryRegister

export const metadata: Metadata = pageMetadata(page)

export default function GalleryRegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteJsonLd data={webPageJsonLd(page)} />
      {children}
    </>
  )
}
