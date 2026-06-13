/**
 * Backfill missing Kurator metadata (tags, genre, style, subject, colour) for artworks.
 * Does not modify description, medium, price, or other existing fields.
 *
 * Usage: npx tsx scripts/backfill-artwork-metadata.mjs [id ...]
 * Default IDs: 379 380 381 382 383 384
 *
 * Tries Kurator vision analysis first; falls back to curated metadata when the API is unavailable.
 */
import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, "../.env.local") })

const { analyzeArtworkImage, buildArtworkTags } = await import("../lib/kurator-artwork-tags.ts")

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

/** Curated fallback when Kurator API is unavailable (e.g. quota exceeded). */
const CURATED_FALLBACK = {
  379: {
    genre: "Digital",
    style: "Surrealism",
    subject: "biomechanical creature",
    colour: "Orange",
    keywords: ["surreal", "mechanical", "dystopian", "geometric"],
  },
  380: {
    genre: "Digital",
    style: "Surrealism",
    subject: "horse journey",
    colour: "Brown",
    keywords: ["symbolic", "nostalgic", "textured", "homecoming"],
  },
  381: {
    genre: "Digital",
    style: "Cubism",
    subject: "mythical creatures",
    colour: "Bronze",
    keywords: ["abstract", "tribal", "textured", "zoomorphic"],
  },
  382: {
    genre: "Digital",
    style: "Expressionism",
    subject: "human figures",
    colour: "Yellow",
    keywords: ["colorful", "portrait", "geometric", "neo-expressionist"],
  },
  383: {
    genre: "Digital",
    style: "Abstract",
    subject: "portrait",
    colour: "Brown",
    keywords: ["connectivity", "fragmented", "web", "assemblage"],
  },
  384: {
    genre: "Digital",
    style: "Surrealism",
    subject: "female figure",
    colour: "Beige",
    keywords: ["assemblage", "fragility", "organic", "sculptural"],
  },
}

const supabase = createClient(url, serviceKey)
const ids = process.argv.slice(2).map(Number).filter(Boolean)
const targetIds = ids.length > 0 ? ids : [379, 380, 381, 382, 383, 384]

console.log(`[backfill] Target artwork IDs: ${targetIds.join(", ")}`)

const { data: artworks, error } = await supabase
  .from("Artwork")
  .select("id, artwork_title, artwork_image, genre, style, subject, colour, tags")
  .in("id", targetIds)
  .order("id", { ascending: true })

if (error) {
  console.error("[backfill] Fetch failed:", error.message)
  process.exit(1)
}

function buildUpdateFromAnalysis(artwork, analysis) {
  const tags = buildArtworkTags(analysis)
  const update = {}
  if (!artwork.genre && analysis.genre) update.genre = analysis.genre
  if (!artwork.style && analysis.style) update.style = analysis.style
  if (!artwork.subject && analysis.subject) update.subject = analysis.subject
  if (!artwork.colour && analysis.colour) update.colour = analysis.colour
  if (!artwork.tags && tags.length > 0) update.tags = tags
  return update
}

for (const artwork of artworks || []) {
  console.log(`\n[backfill] Processing #${artwork.id} "${artwork.artwork_title}"…`)
  let update = {}

  try {
    const analysis = await analyzeArtworkImage(artwork.artwork_image)
    update = buildUpdateFromAnalysis(artwork, analysis)
    if (Object.keys(update).length > 0) {
      console.log(`[backfill] #${artwork.id} Kurator analysis succeeded`)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[backfill] #${artwork.id} Kurator failed (${msg}), using curated fallback`)
    const fallback = CURATED_FALLBACK[artwork.id]
    if (fallback) {
      update = buildUpdateFromAnalysis(artwork, {
        description: "",
        ...fallback,
      })
    }
  }

  if (Object.keys(update).length === 0) {
    console.log(`[backfill] #${artwork.id} — nothing to update`)
    continue
  }

  const { error: updateError } = await supabase
    .from("Artwork")
    .update(update)
    .eq("id", artwork.id)

  if (updateError) {
    console.error(`[backfill] #${artwork.id} update failed:`, updateError.message)
    continue
  }

  console.log(`[backfill] #${artwork.id} updated:`, update)
}

console.log("\n[backfill] Done.")
