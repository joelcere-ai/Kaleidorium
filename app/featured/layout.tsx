import type { Metadata } from "next"
import { RouteJsonLd } from "@/components/route-json-ld"
import { PAGES, pageMetadata, webPageJsonLd } from "@/lib/seo"

const page = PAGES.featured

export const metadata: Metadata = pageMetadata(page)

export default function FeaturedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteJsonLd data={webPageJsonLd(page)} />
      {children}
    </>
  )
}
