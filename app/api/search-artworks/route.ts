import { NextRequest, NextResponse } from "next/server"
import { searchArtworks } from "@/lib/search-artworks"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchTerm = request.nextUrl.searchParams.get("q")

    if (!searchTerm || !searchTerm.trim()) {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 })
    }

    const { results, error } = await searchArtworks(searchTerm)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      results,
      count: results.length,
      searchTerm: searchTerm.trim(),
    })
  } catch (err: unknown) {
    console.error("Search API error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
