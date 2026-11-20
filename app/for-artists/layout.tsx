import type { Metadata } from "next"
import { PAGES, pageMetadata } from "@/lib/seo"

const page = PAGES.forArtists

export const metadata: Metadata = pageMetadata(page)

export default function ForArtistsLayout({ children }: { children: React.ReactNode }) {
  return children
}
