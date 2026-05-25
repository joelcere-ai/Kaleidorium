"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface DiscoverSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  activeQuery: string | null
  isLoading?: boolean
  error?: string | null
  /** When true, sits in the mobile layout below the header (not sticky). */
  embedded?: boolean
}

export function DiscoverSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  activeQuery,
  isLoading = false,
  error = null,
  embedded = false,
}: DiscoverSearchBarProps) {
  const inSearchMode = Boolean(activeQuery)

  return (
    <div
      className={
        embedded
          ? "shrink-0 bg-white border-b border-[#E6E4DF] px-4 py-3 space-y-2 z-10"
          : "sticky top-0 z-20 bg-white border-b border-[#E6E4DF] px-4 py-3 space-y-2 shadow-sm"
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="flex gap-2 items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8A84] pointer-events-none" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search artist, title, style, subject, colour…"
            className="pl-9 pr-9 border-[#E6E4DF] bg-white"
            disabled={isLoading}
            aria-label="Search artworks"
          />
          {(value.length > 0 || inSearchMode) && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#8A8A84] hover:text-[#1E1E1C] hover:bg-[#FAFAF8]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="bg-[#F5F0FF] border border-[#D9CFF7] text-[#4F4564] hover:brightness-[0.97] shrink-0"
        >
          {isLoading ? "…" : "Search"}
        </Button>
      </form>

      {inSearchMode && (
        <p className="text-sm text-[#5F5F5A]">
          Search results for:{" "}
          <span className="font-medium text-[#1E1E1C]">&ldquo;{activeQuery}&rdquo;</span>
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
