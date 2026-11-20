import type { Metadata } from "next"
import { PAGES, pageMetadata } from "@/lib/seo"

const page = PAGES.forGalleries

export const metadata: Metadata = pageMetadata(page)

export default function ForGalleriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
