import type { Metadata } from "next"
import { RouteJsonLd } from "@/components/route-json-ld"
import { PAGES, pageMetadata, webPageJsonLd } from "@/lib/seo"

const page = PAGES.contact

export const metadata: Metadata = pageMetadata(page)

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteJsonLd data={webPageJsonLd(page)} />
      {children}
    </>
  )
}
