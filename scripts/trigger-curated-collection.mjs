import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, "../.env.local") })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!url || !serviceKey || !openaiKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY")
  process.exit(1)
}

// Dynamic import of TS module via tsx
const { generateCuratedCollection } = await import("../lib/kurator-generate-collection.ts")

const admin = createClient(url, serviceKey)
console.log("[kurator] Starting curated collection generation…")

try {
  const { month, result } = await generateCuratedCollection(admin)
  console.log("[kurator] Success:", { month, ...result })
} catch (e) {
  console.error("[kurator] Failed:", e instanceof Error ? e.message : e)
  process.exit(1)
}
