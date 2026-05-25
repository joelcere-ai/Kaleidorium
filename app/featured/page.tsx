"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DesktopHeader } from "@/components/desktop-header"
import { NewMobileHeader } from "@/components/new-mobile-header"
import { FeaturedPageContent } from "@/components/featured-page-content"
import { supabase } from "@/lib/supabase"
import { loadTempCollection } from "@/lib/temp-collection"

type AppView =
  | "discover"
  | "collection"
  | "featured"
  | "profile"
  | "why-kaleidorium"
  | "for-artists"
  | "for-galleries"
  | "about"
  | "contact"
  | "pricing"
  | "terms"
  | "privacy"

export default function FeaturedPage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [collectionCount, setCollectionCount] = useState(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const loadCount = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        setCollectionCount(loadTempCollection().length)
        return
      }
      const { count } = await supabase
        .from("Collection")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
      setCollectionCount(count ?? 0)
    }
    loadCount()
  }, [])

  const setView = useCallback(
    (view: AppView) => {
      if (view === "discover") {
        router.push("/")
        return
      }
      router.push(`/?view=${view}`)
    },
    [router]
  )

  const mobilePadding = isMobile
    ? {
        paddingTop: "calc(96px + env(safe-area-inset-top))",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
      }
    : {}

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isMobile ? (
        <NewMobileHeader currentPage="featured" collectionCount={collectionCount} setView={setView} />
      ) : (
        <DesktopHeader currentPage="featured" collectionCount={collectionCount} setView={setView} />
      )}
      <main className="flex-1 flex flex-col" style={mobilePadding}>
        <FeaturedPageContent />
      </main>
    </div>
  )
}
