"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { CollectorArchetypeCard } from "@/components/collector-archetype-card"
import { KuratorOrb } from "@/components/kurator-banner"
import { supabase } from "@/lib/supabase"
import { loadTempCollection } from "@/lib/temp-collection"
import {
  analyzeCollectionBasic,
  fetchAiTasteInsights,
  getTopPreferenceSignals,
  mapDbArtworkToArtwork,
  resolveArchetype,
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
  const [ai, setAi] = useState<{
    summary: string
    aesthetic_profile: string
    collecting_pattern: string
    recommendations: string[]
    explorationSuggestions: string[]
  } | null>(null)

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
      await loadPreferences(uid)

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
        await refreshInsights(resolvedArtworks, { silent: true })
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
  const topArtists = getTopPreferenceSignals(preferences.artists)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-[#5F5F5A]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Building your taste profile…
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold text-[#1E1E1C] mb-2"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            Taste Profile
          </h1>
          <p className="text-sm text-[#5F5F5A] max-w-xl">
            Your Kurator learns from every swipe, like, and saved artwork — shaping a personal artistic
            profile from your collection and interactions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshInsights(collection)}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh profile
        </Button>
      </div>

      {!userId && (
        <Card className="border-[#E6E4DF] bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-5 text-sm text-[#1E1E1C]">
            <p className="mb-3">
              Sign in to save your taste profile permanently and sync it across devices.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push("/register")}>
                Create account
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push("/login")}>
                Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasSignals ? (
        <Card className="border-[#E6E4DF]">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-[#8A8A84]" />
            <h2 className="text-lg font-semibold text-[#1E1E1C] mb-2">Your profile is just getting started</h2>
            <p className="text-sm text-[#5F5F5A] mb-6 max-w-md mx-auto">
              Swipe through Discover, like artworks, and build your collection. After a few interactions,
              your Kurator will reveal your collector archetype and personalised insights here.
            </p>
            <Button onClick={() => router.push("/")}>Go to Discover</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {preferences.interactionCount > 0 && (
            <div
              className="w-full rounded-2xl px-4 py-3"
              style={{
                background: "linear-gradient(135deg, #f5f0ff 0%, #fdf2fb 40%, #fff7f0 100%)",
                border: "1px solid rgba(139,92,246,0.10)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <KuratorOrb size={18} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {preferences.interactionCount >= 25
                      ? "Your Kurator knows your eye"
                      : preferences.interactionCount >= 10
                        ? "Your taste profile is taking shape"
                        : "Your Kurator is learning your taste"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {preferences.interactionCount} interactions · {collection.length} saved artwork
                    {collection.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {archetype && (
            <section>
              <h2 className="text-sm font-medium text-[#1E1E1C] mb-3 uppercase tracking-wide">
                Collector archetype
              </h2>
              <CollectorArchetypeCard archetype={archetype} />
            </section>
          )}

          <Card className="border-[#E6E4DF]">
            <CardHeader>
              <CardTitle className="text-lg">Collection overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ai?.summary || basic.summary}
              </p>
              {ai?.aesthetic_profile && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Your aesthetic profile</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ai.aesthetic_profile}
                    </p>
                  </div>
                </>
              )}
              {ai?.collecting_pattern && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Collecting pattern</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ai.collecting_pattern}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {(topStyles.length > 0 ||
            topGenres.length > 0 ||
            topSubjects.length > 0 ||
            topColours.length > 0 ||
            topArtists.length > 0) && (
            <Card className="border-[#E6E4DF]">
              <CardHeader>
                <CardTitle className="text-lg">Taste signals from your interactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {topStyles.length > 0 && (
                  <TasteSignalGroup label="Preferred styles" items={topStyles} />
                )}
                {topGenres.length > 0 && (
                  <TasteSignalGroup label="Preferred genres" items={topGenres} />
                )}
                {topSubjects.length > 0 && (
                  <TasteSignalGroup label="Preferred subjects" items={topSubjects} />
                )}
                {topColours.length > 0 && (
                  <TasteSignalGroup label="Preferred colours" items={topColours} />
                )}
                {topArtists.length > 0 && (
                  <TasteSignalGroup label="Artists you engage with" items={topArtists} />
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-[#E6E4DF]">
            <CardHeader>
              <CardTitle className="text-lg">Collection statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <StatList title="Top artists in your collection" items={basic.topArtists} />
                <div>
                  <h4 className="text-sm font-medium mb-2">Preferred styles & tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {basic.topTags.length > 0 ? (
                      basic.topTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags yet</p>
                    )}
                  </div>
                </div>
                <StatList title="Preferred mediums" items={basic.preferredMediums} />
                <div>
                  <h4 className="text-sm font-medium mb-2">Price range</h4>
                  <p className="text-sm text-muted-foreground">{basic.priceRange}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {ai?.explorationSuggestions && ai.explorationSuggestions.length > 0 && (
            <Card className="border-[#E6E4DF]">
              <CardHeader>
                <CardTitle className="text-lg">Territories to explore next</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ai.explorationSuggestions.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs"
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#E6E4DF]">
            <CardHeader>
              <CardTitle className="text-lg">Personalised recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {(ai?.recommendations?.length ? ai.recommendations : basic.recommendations).length >
              0 ? (
                <ul className="space-y-2">
                  {(ai?.recommendations?.length ? ai.recommendations : basic.recommendations).map(
                    (item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Keep exploring Discover to unlock more recommendations.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function TasteSignalGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function StatList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      {items.length > 0 ? (
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">None yet</p>
      )}
    </div>
  )
}
