"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Artwork } from "@/types/artwork"
import { searchArtworks } from "@/lib/search-artworks"

interface ArtworkSearchContextValue {
  input: string
  query: string
  results: Artwork[]
  loading: boolean
  error: string | null
  isBarOpen: boolean
  hasActiveSearch: boolean
  setInput: (value: string) => void
  openSearch: () => void
  closeSearchBar: () => void
  submitSearch: () => Promise<void>
  clearSearch: () => void
}

const ArtworkSearchContext = createContext<ArtworkSearchContextValue | null>(null)

export function ArtworkSearchProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBarOpen, setIsBarOpen] = useState(false)

  const focusSearchInput = useCallback(() => {
    const bar = document.getElementById("discover-search-bar")
    const searchInput = document.getElementById("discover-search-input") as HTMLInputElement | null
    bar?.scrollIntoView({ behavior: "smooth", block: "start" })
    window.setTimeout(() => searchInput?.focus(), 200)
  }, [])

  const openSearch = useCallback(() => {
    setIsBarOpen(true)
    focusSearchInput()
  }, [focusSearchInput])

  const closeSearchBar = useCallback(() => {
    setIsBarOpen(false)
  }, [])

  const submitSearch = useCallback(async () => {
    const term = input.trim()
    if (!term) return

    setIsBarOpen(true)
    setQuery(term)
    setLoading(true)
    setError(null)

    const { results: nextResults, error: nextError } = await searchArtworks(term)

    setLoading(false)
    if (nextError) {
      setError(nextError)
      setResults([])
      return
    }

    setResults(nextResults)
    setError(null)
  }, [input])

  const clearSearch = useCallback(() => {
    setInput("")
    setQuery("")
    setResults([])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    ;(window as any).openGlobalArtworkSearch = openSearch
    return () => {
      delete (window as any).openGlobalArtworkSearch
    }
  }, [openSearch])

  const value = useMemo(
    () => ({
      input,
      query,
      results,
      loading,
      error,
      isBarOpen,
      hasActiveSearch: query.length > 0,
      setInput,
      openSearch,
      closeSearchBar,
      submitSearch,
      clearSearch,
    }),
    [
      input,
      query,
      results,
      loading,
      error,
      isBarOpen,
      openSearch,
      closeSearchBar,
      submitSearch,
      clearSearch,
    ]
  )

  return (
    <ArtworkSearchContext.Provider value={value}>{children}</ArtworkSearchContext.Provider>
  )
}

export function useArtworkSearch() {
  const context = useContext(ArtworkSearchContext)
  if (!context) {
    throw new Error("useArtworkSearch must be used within ArtworkSearchProvider")
  }
  return context
}
