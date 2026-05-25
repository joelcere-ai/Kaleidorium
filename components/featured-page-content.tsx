"use client"

import { useCallback, useEffect, useState } from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"
import { ArtworkDetailOverlay } from "@/components/artwork-detail-overlay"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  fetchArtworksByIds,
  fetchCurrentCuratedCollection,
  formatMonthLabel,
  type CuratedCollectionRow,
} from "@/lib/curated-collection"
import {
  addArtworkToUserCollection,
  updateUserArtworkPreferences,
} from "@/lib/artwork-preferences"
import { loadTempCollection, saveTempCollection } from "@/lib/temp-collection"
import type { Artwork } from "@/types/artwork"

export function FeaturedPageContent() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [collection, setCollection] = useState<CuratedCollectionRow | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [detailArtwork, setDetailArtwork] = useState<Artwork | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setUser(null)
        setSavedIds(new Set(loadTempCollection().map((a) => a.id)))
        return
      }
      setUser({ id: session.user.id })
      const { data } = await supabase
        .from("Collection")
        .select("artwork_id")
        .eq("user_id", session.user.id)
      const ids = new Set((data || []).map((r) => String(r.artwork_id)))
      setSavedIds(ids)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const row = await fetchCurrentCuratedCollection()
      if (cancelled) return
      setCollection(row)
      if (row?.artwork_ids?.length) {
        const ids = Array.isArray(row.artwork_ids) ? row.artwork_ids : []
        const loaded = await fetchArtworksByIds(ids)
        if (!cancelled) setArtworks(loaded)
      } else {
        setArtworks([])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const openArtworkDetail = (artwork: Artwork) => {
    setDetailArtwork(artwork)
  }

  const closeArtworkDetail = () => {
    setDetailArtwork(null)
  }

  const handleLike = useCallback(
    async (artwork: Artwork) => {
      if (!user) {
        const current = loadTempCollection()
        if (!current.some((a) => a.id === artwork.id)) {
          const next = [...current, artwork]
          saveTempCollection(next)
          setSavedIds(new Set(next.map((a) => a.id)))
        }
        toast({
          title: "Added to your collection",
          description: "Sign in to sync your collection and refine your taste profile.",
        })
        return
      }

      const okPref = await updateUserArtworkPreferences(user.id, artwork, "add")
      const okColl = await addArtworkToUserCollection(user.id, artwork)
      if (okPref && okColl) {
        setSavedIds((prev) => new Set([...prev, artwork.id]))
        toast({ title: "Added to your collection" })
      } else {
        toast({
          title: "Something went wrong",
          description: "Could not save your preference. Please try again.",
          variant: "destructive",
        })
      }
    },
    [user, toast]
  )

  const handleDislike = useCallback(
    async (artwork: Artwork) => {
      if (!user) {
        toast({
          title: "Preference noted",
          description: "Sign in to build your full taste profile across Kaleidorium.",
        })
        return
      }
      const ok = await updateUserArtworkPreferences(user.id, artwork, "dislike")
      if (ok) {
        toast({ title: "Thanks — we'll show you less like this" })
      }
    },
    [user, toast]
  )

  const inCollection = (artworkId: string) => savedIds.has(artworkId)

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex-1 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E1E1C] tracking-tight">
            Curated Collections
          </h1>
          <p className="text-sm md:text-base text-[#5F5F5A] mt-2 leading-relaxed">
            A new themed selection every month, chosen by our Kurator.
          </p>
        </header>

        {loading ? (
          <p className="text-center text-[#8A8A84] text-sm py-16">Loading this month&apos;s collection…</p>
        ) : !collection || artworks.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-[#E6E4DF] bg-white">
            <p className="text-[#5F5F5A] text-base leading-relaxed">
              This month&apos;s curated collection is on its way.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-wider text-[#8A8A84] mb-2">
                {formatMonthLabel(collection.month)}
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-[#1E1E1C] mb-3">
                {collection.theme_title}
              </h2>
              <p className="text-sm md:text-base text-[#5F5F5A] leading-relaxed">
                {collection.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.map((artwork) => (
                <Card
                  key={artwork.id}
                  className="overflow-hidden group hover:shadow-md transition-shadow border border-[#E6E4DF]"
                >
                  <div
                    className="aspect-square overflow-hidden bg-[#FAFAF8] cursor-pointer"
                    onClick={() => openArtworkDetail(artwork)}
                  >
                    <img
                      src={artwork.artwork_image || "/placeholder.svg"}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-[#1E1E1C] mb-0.5 truncate">{artwork.title}</h3>
                    <p className="text-sm text-[#8A8A84] mb-3 truncate">{artwork.artist}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openArtworkDetail(artwork)}
                      >
                        View artwork
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 active:scale-95 hover:brightness-[0.97] transition-all"
                        style={{
                          backgroundColor: "#FBEFF0",
                          borderColor: "#E7C4C7",
                          borderWidth: "1px",
                          boxShadow: "none",
                        }}
                        onClick={() => handleDislike(artwork)}
                        aria-label="Dislike"
                      >
                        <ThumbsDown className="h-4 w-4" style={{ color: "#A35D66" }} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 active:scale-95 hover:brightness-[0.97] transition-all"
                        style={{
                          backgroundColor: "#EDF6F0",
                          borderColor: "#B8D8C1",
                          borderWidth: "1px",
                          boxShadow: "none",
                        }}
                        onClick={() => handleLike(artwork)}
                        aria-label="Like and add to collection"
                      >
                        <ThumbsUp
                          className="h-4 w-4"
                          style={{
                            color: "#3E7C59",
                            fill: inCollection(artwork.id) ? "#3E7C59" : "none",
                          }}
                        />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <ArtworkDetailOverlay
        artwork={detailArtwork}
        open={detailArtwork !== null}
        onClose={closeArtworkDetail}
      />
    </div>
  )
}
