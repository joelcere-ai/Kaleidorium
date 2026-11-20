"use client"

import { useEffect } from "react"
import { canonicalForView, descriptionForView, jsonLdForView } from "@/lib/seo"

/**
 * Invisible structured data for the home app's views.
 * Does not render visible UI and does not change the document title.
 */
export function ViewStructuredData({ view, role }: { view: string; role: string | null }) {
  const description = descriptionForView(view, role)
  const canonical = canonicalForView(view, role)
  const data = jsonLdForView(view, role)

  useEffect(() => {
    const apply = (selector: string) => {
      const el = document.head.querySelector(selector)
      if (el) el.setAttribute("content", description)
    }
    apply('meta[name="description"]')
    apply('meta[property="og:description"]')
    apply('meta[name="twitter:description"]')

    const canonicalLink = document.head.querySelector('link[rel="canonical"]')
    if (canonicalLink) canonicalLink.setAttribute("href", canonical)
    const ogUrl = document.head.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute("content", canonical)
  }, [canonical, description])

  if (!data) return null

  return (
    <script
      id="kaleidorium-view-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
