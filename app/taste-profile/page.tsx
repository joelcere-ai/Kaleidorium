"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DesktopHeader } from "@/components/desktop-header"
import { NewMobileHeader } from "@/components/new-mobile-header"
import { TasteProfilePageContent } from "@/components/taste-profile-page-content"
import { supabase } from "@/lib/supabase"
import { loadTempCollection } from "@/lib/temp-collection"

type AppView =
  | "discover"
  | "collection"
  | "featured"
  | "taste-profile"
  | "profile"
  | "why-kaleidorium"
  | "for-artists"
  | "for-galleries"
  | "about"
  | "contact"
  | "pricing"
  | "terms"
  | "privacy"

export default function TasteProfilePage() {
  const router = useRouter()
  const [collectionCount, setCollectionCount] = useState(0)

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
      if (view === "taste-profile") return
      if (view === "featured") {
        router.push("/featured")
        return
      }
      if (view === "discover") {
        router.push("/")
        return
      }
      router.push(`/?view=${view}`)
    },
    [router]
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="md:hidden">
        <NewMobileHeader
          currentPage="taste-profile"
          collectionCount={collectionCount}
          setView={setView}
        />
      </div>
      <div className="hidden md:block">
        <DesktopHeader
          currentPage="taste-profile"
          collectionCount={collectionCount}
          setView={setView}
        />
      </div>
      <main className="flex-1 flex flex-col pt-[calc(96px+env(safe-area-inset-top))] md:pt-0 pb-[calc(24px+env(safe-area-inset-bottom))] md:pb-0">
        <TasteProfilePageContent />
      </main>
    </div>
  )
}
