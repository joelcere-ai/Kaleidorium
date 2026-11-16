"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Eye, ExternalLink, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CollectorArchetypeCard } from "@/components/collector-archetype-card"
import { InviteArtistShare } from "@/components/invite-artist-share"
import { KuratorOrb } from "@/components/kurator-banner"
import { supabase } from "@/lib/supabase"
import { loadTempCollection } from "@/lib/temp-collection"
import { loadTempPreferences } from "@/lib/temp-preferences"
import {
  analyzeCollectionBasic,
  buildCollectionOverview,
  buildRecommendationInsights,
  fetchAiTasteInsights,
  getTopPreferenceSignals,
  mapDbArtworkToArtwork,
  resolveArchetype,
  type AiTasteInsights,
  type TastePreferences,
} from "@/lib/taste-profile"
import type { Artwork } from "@/types/artwork"
import type { CollectorArchetype } from "@/lib/collector-archetypes"

const EMPTY_PREFS: TastePreferences = {
  artists: {},
  genres: {},
  styles: {},
  subjects: {},
  colors: {},
  priceRanges: {},
  interactionCount: 0,
  viewed_artworks: [],
}

export function TasteProfilePageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [collection, setCollection] = useState<Artwork[]>([])
  const [preferences, setPreferences] = useState<TastePreferences>(EMPTY_PREFS)
  const [archetype, setArchetype] = useState<CollectorArchetype | null>(null)
  const [basic, setBasic] = useState(analyzeCollectionBasic([]))
  const [ai, setAi] = useState<AiTasteInsights | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const loadPreferences = useCallback(async (uid: string | null) => {
    if (!uid) {
      setPreferences(EMPTY_PREFS)
      return
    }

    const { data: collector } = await supabase
      .from("Collectors")
      .select("preferences")
      .eq("user_id", uid)
      .maybeSingle()

    if (collector?.preferences) {
      const p = collector.preferences as TastePreferences
      setPreferences({
        artists: p.artists ?? {},
        genres: p.genres ?? {},
        styles: p.styles ?? {},
        subjects: p.subjects ?? {},
        colors: p.colors ?? {},
        priceRanges: p.priceRanges ?? {},
        interactionCount: p.interactionCount ?? 0,
        viewed_artworks: p.viewed_artworks ?? [],
      })
    } else {
      setPreferences(EMPTY_PREFS)
    }
  }, [])

  const refreshInsights = useCallback(
    async (artworks: Artwork[], opts?: { silent?: boolean }) => {
      if (!opts?.silent) setRefreshing(true)
      try {
        setBasic(analyzeCollectionBasic(artworks))
        setArchetype(artworks.length > 0 ? resolveArchetype(artworks) : null)

        if (artworks.length > 0) {
          setAiLoading(true)
          const aiInsights = await fetchAiTasteInsights(artworks)
          setAi(aiInsights)
        } else {
          setAi(null)
        }
      } catch {
        toast({
          title: "Could not refresh taste profile",
          description: "Please try again in a moment.",
          variant: "destructive",
        })
      } finally {
        setAiLoading(false)
        if (!opts?.silent) setRefreshing(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? null
      if (cancelled) return
      setUserId(uid)
      if (uid) {
        await loadPreferences(uid)
      } else {
        const tempPrefs = loadTempPreferences()
        setPreferences(tempPrefs ?? EMPTY_PREFS)
      }

      let resolvedArtworks: Artwork[] = []
      if (uid) {
        const { data: rows } = await supabase
          .from("Collection")
          .select("artwork_id")
          .eq("user_id", uid)
        const ids = rows?.map((r) => r.artwork_id) || []
        if (ids.length) {
          const { data } = await supabase.from("Artwork").select("*").in("id", ids)
          resolvedArtworks = (data || []).map((row) => mapDbArtworkToArtwork(row))
        }
      } else {
        resolvedArtworks = loadTempCollection()
      }

      if (!cancelled) {
        setCollection(resolvedArtworks)
        void refreshInsights(resolvedArtworks, { silent: true })
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadPreferences, refreshInsights])

  const hasSignals =
    collection.length > 0 ||
    preferences.interactionCount >= 3 ||
    getTopPreferenceSignals(preferences.styles).length > 0

  const topStyles = getTopPreferenceSignals(preferences.styles)
  const topGenres = getTopPreferenceSignals(preferences.genres)
  const topSubjects = getTopPreferenceSignals(preferences.subjects)
  const topColours = getTopPreferenceSignals(preferences.colors)

  const combinedTags = useMemo(() => {
    const tags = new Set<string>([...basic.topTags, ...topStyles, ...topGenres, ...topSubjects, ...topColours])
    return Array.from(tags)
  }, [basic.topTags, topStyles, topGenres, topSubjects, topColours])

  const previewArtworks = useMemo(() => {
    if (collection.length <= 4) return { items: collection, overflow: 0 }
    return {
      items: collection.slice(0, 3),
      overflow: collection.length - 3,
    }
  }, [collection])

  const collectionOverview = useMemo(
    () => buildCollectionOverview(collection, preferences.interactionCount),
    [collection, preferences.interactionCount]
  )

  const recommendationInsights = useMemo(
    () =>
      buildRecommendationInsights(
        collection,
        {
          topArtists: basic.topArtists,
          topTags: basic.topTags,
          preferredMediums: basic.preferredMediums,
          priceRange: basic.priceRange,
        },
        preferences,
        ai
      ),
    [collection, basic, preferences, ai]
  )

  const overviewSummary = ai?.summary || collectionOverview.summary
  const overviewAesthetic = ai?.aesthetic_profile || collectionOverview.aestheticProfile
  const overviewCollectingPattern = ai?.collecting_pattern || collectionOverview.collectingPattern

  const bannerHeadline =
    preferences.interactionCount >= 25
      ? "Your Kurator knows your eye"
      : preferences.interactionCount >= 10
        ? "Your taste profile is taking shape"
        : "Your Kurator is learning your taste"

  if (loading) {
    return (
      <div className="taste-profile-page">
        <div className="taste-profile-loading">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Building your taste profile…
        </div>
      </div>
    )
  }

  return (
    <div className="taste-profile-page">
      <div className="taste-profile-inner">
        <header className="taste-profile-header">
          <div>
            <h1 className="taste-profile-title">Taste Profile</h1>
            <p className="taste-profile-subtitle">
              Your Kurator learns from every swipe, like, and saved artwork — shaping a personal
              artistic profile from your collection and interactions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshInsights(collection)}
            disabled={refreshing}
            className="taste-profile-refresh-btn"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh profile
          </Button>
        </header>

        {!userId && (
          <section className="taste-profile-notice">
            <p className="mb-3">
              Sign in to save your taste profile permanently and sync it across devices.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => router.push("/register")}>
                Create account
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push("/login")}>
                Sign in
              </Button>
            </div>
          </section>
        )}

        {!hasSignals ? (
          <section className="taste-profile-panel taste-profile-empty">
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-[#8A8A84]" />
            <h2 className="taste-profile-panel-title text-center">Your profile is just getting started</h2>
            <p className="taste-profile-copy text-center max-w-md mx-auto mb-6">
              Swipe or like through Discover, save artworks, and build your collection. After a few
              interactions, your Kurator will reveal your collector archetype and personalised
              insights here.
            </p>
            <div className="text-center">
              <Button variant="outline" onClick={() => router.push("/")}>
                Go to Discover
              </Button>
            </div>
          </section>
        ) : (
          <>
            {preferences.interactionCount > 0 && (
              <section className="taste-profile-banner discover-kurator-banner">
                <div className="flex items-center gap-2.5">
                  <KuratorOrb size={18} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{bannerHeadline}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {preferences.interactionCount} interactions · {collection.length} saved
                      artwork{collection.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {archetype && (
              <section className="taste-profile-section">
                <h2 className="taste-profile-section-label">Your collector archetype</h2>
                <CollectorArchetypeCard archetype={archetype} />
              </section>
            )}

            <div className="taste-profile-grid">
              <section className="taste-profile-panel">
                <div className="taste-profile-panel-heading">
                  <Eye className="w-4 h-4" />
                  <h2 className="taste-profile-panel-title">Collection overview</h2>
                </div>

                <p className="taste-profile-lead">
                  A reading of the artworks you&apos;ve saved — how they fit together, and what
                  they reveal about your eye.{" "}
                  {collection.length > 0 && (
                    <button
                      type="button"
                      className="taste-profile-inline-link"
                      onClick={() => router.push("/?view=collection")}
                    >
                      View your collection
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </p>

                <p className="taste-profile-copy">{overviewSummary}</p>

                <div className="taste-profile-subsection">
                  <h3 className="taste-profile-subsection-title">Your aesthetic profile</h3>
                  <p className="taste-profile-copy">{overviewAesthetic}</p>
                </div>

                <div className="taste-profile-subsection">
                  <h3 className="taste-profile-subsection-title">Collecting pattern</h3>
                  <p className="taste-profile-copy">{overviewCollectingPattern}</p>
                </div>

                {collection.length > 0 && (
                  <div className="taste-profile-thumbs">
                    {previewArtworks.items.map((artwork) => (
                      <div key={artwork.id} className="taste-profile-thumb">
                        <img
                          src={artwork.artwork_image || "/placeholder.svg"}
                          alt={artwork.title}
                          className="taste-profile-thumb-image"
                        />
                      </div>
                    ))}
                    {previewArtworks.overflow > 0 && (
                      <div className="taste-profile-thumb taste-profile-thumb--more">
                        <img
                          src={
                            collection[3]?.artwork_image ||
                            previewArtworks.items[previewArtworks.items.length - 1]?.artwork_image ||
                            "/placeholder.svg"
                          }
                          alt=""
                          className="taste-profile-thumb-image"
                        />
                        <span className="taste-profile-thumb-overlay">
                          +{previewArtworks.overflow}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="taste-profile-panel">
                <div className="taste-profile-panel-heading">
                  <BarChart3 className="w-4 h-4" />
                  <h2 className="taste-profile-panel-title">Collection statistics</h2>
                </div>

                <div className="taste-profile-stats-grid">
                  <StatList title="Top artists in your collection" items={basic.topArtists} />
                  <StatList title="Preferred mediums" items={basic.preferredMediums} />

                  <div className="taste-profile-stat-block">
                    <h4 className="taste-profile-stat-title">Preferred styles &amp; tags</h4>
                    {combinedTags.length > 0 ? (
                      <div className="taste-profile-tag-cloud">
                        {combinedTags.map((tag) => (
                          <span key={tag} className="taste-profile-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="taste-profile-copy">No tags yet</p>
                    )}
                  </div>

                  <div className="taste-profile-stat-block">
                    <h4 className="taste-profile-stat-title">Price range</h4>
                    <p className="taste-profile-copy">{basic.priceRange}</p>
                  </div>
                </div>
              </section>
            </div>

            <section className="taste-profile-panel">
              <h2 className="taste-profile-panel-title">Personalised recommendations</h2>
              {aiLoading ? (
                <p className="taste-profile-lead flex items-center">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                  Your Kurator is searching the art world for artists and styles that match your taste…
                </p>
              ) : (
                <>
                  <p className="taste-profile-lead">{recommendationInsights.intro}</p>
                  <ul className="taste-profile-list taste-profile-recommendations">
                    {recommendationInsights.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="taste-profile-footnote">
                Recommendations update as you save artworks and interact in Discover.{" "}
                <button
                  type="button"
                  className="taste-profile-inline-link"
                  onClick={() => router.push("/")}
                >
                  Go to Discover
                </button>
              </p>
            </section>
          </>
        )}

        <InviteArtistShare />
      </div>
    </div>
  )
}

function StatList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="taste-profile-stat-block">
      <h4 className="taste-profile-stat-title">{title}</h4>
      {items.length > 0 ? (
        <ul className="taste-profile-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="taste-profile-copy">None yet</p>
      )}
    </div>
  )
}
