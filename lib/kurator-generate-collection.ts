import type { SupabaseClient } from "@supabase/supabase-js"
import { runKuratorAssistant } from "@/lib/kurator-assistant"

export interface KuratorResult {
  theme_title: string
  description: string
  artwork_ids: number[]
}

type CatalogueRow = {
  id: number
  artwork_title: string | null
  artist: string | null
  style: string | null
  subject: string | null
  colour: string | null
  tags: string[] | null
  description: string | null
}

function currentMonthKey(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}-01`
}

function parseKuratorJson(text: string): KuratorResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("Kurator response did not contain JSON")
  const parsed = JSON.parse(jsonMatch[0]) as {
    theme_title?: string
    description?: string
    artwork_ids?: (number | string)[]
  }
  if (!parsed.theme_title || !parsed.description || !Array.isArray(parsed.artwork_ids)) {
    throw new Error("Kurator JSON missing required fields")
  }
  const ids = parsed.artwork_ids
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id))
    .slice(0, 10)
  if (ids.length < 5) {
    throw new Error(`Kurator selected only ${ids.length} artworks; need 5–10`)
  }
  return {
    theme_title: parsed.theme_title.trim(),
    description: parsed.description.trim(),
    artwork_ids: ids,
  }
}

async function callKuratorForCollection(
  catalogue: CatalogueRow[],
  lastTheme: string | null
): Promise<KuratorResult> {
  // Compact one-line-per-work format to stay under OpenAI TPM limits
  const compactLines = catalogue.map((a) => {
    const title = (a.artwork_title || "").slice(0, 40).replace(/\|/g, " ")
    const artist = (a.artist || "").slice(0, 30).replace(/\|/g, " ")
    return `${a.id}|${title}|${artist}|${a.style || ""}|${a.subject || ""}|${a.colour || ""}`
  })

  const avoidLine = lastTheme
    ? `Do NOT repeat or closely echo last month's theme: "${lastTheme}". Choose a fresh, distinct direction.`
    : "There is no previous theme — choose a strong opening theme."

  const prompt = `As The Kurator for Kaleidorium, analyse the catalogue below and create ONE curated collection for this month.

${avoidLine}

Requirements:
1. theme_title — evocative and specific (e.g. "Solitude in Blue", "Wild Geometry", "Golden Hour"). Not generic.
2. description — 2–4 sentences in a refined editorial tone explaining the theme and why these works belong together.
3. artwork_ids — an ordered array of 5–10 numeric IDs from the catalogue that best fit the theme. Prioritise visual coherence (colour, mood, style). Only use IDs that exist in the catalogue.

Respond with ONLY valid JSON:
{
  "theme_title": "...",
  "description": "...",
  "artwork_ids": [1, 2, 3]
}

Catalogue format per line: id|title|artist|style|subject|colour
Total works: ${catalogue.length}

${compactLines.join("\n")}`

  const raw = await runKuratorAssistant(prompt, { maxPollAttempts: 40 })
  return parseKuratorJson(raw)
}

/**
 * Monthly Kurator job: analyse catalogue, generate theme + selection, upsert current month row.
 */
export async function generateCuratedCollection(
  adminSupabase: SupabaseClient
): Promise<{ month: string; result: KuratorResult }> {
  const { data: artworks, error: artError } = await adminSupabase
    .from("Artwork")
    .select("id, artwork_title, artist, style, subject, colour, tags, description")

  if (artError || !artworks?.length) {
    throw new Error(artError?.message || "No artworks in catalogue")
  }

  const catalogue = artworks as CatalogueRow[]
  const validIds = new Set(catalogue.map((a) => a.id))

  const month = currentMonthKey()
  const { data: lastMonthRow } = await adminSupabase
    .from("curated_collections")
    .select("theme_title")
    .lt("month", month)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastTheme = (lastMonthRow?.theme_title as string | null) ?? null

  let result = await callKuratorForCollection(catalogue, lastTheme)
  result = {
    ...result,
    artwork_ids: result.artwork_ids.filter((id) => validIds.has(id)),
  }
  if (result.artwork_ids.length < 5) {
    throw new Error("Too few valid artwork IDs after catalogue validation")
  }

  const { error: upsertError } = await adminSupabase.from("curated_collections").upsert(
    {
      theme_title: result.theme_title,
      description: result.description,
      artwork_ids: result.artwork_ids,
      month,
      created_at: new Date().toISOString(),
    },
    { onConflict: "month" }
  )

  if (upsertError) throw new Error(upsertError.message)

  return { month, result }
}
