import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateCuratedCollection } from "@/lib/kurator-generate-collection"

export const dynamic = "force-dynamic"
export const maxDuration = 120

/**
 * Monthly Kurator job — uses the existing OpenAI Kurator assistant (same as profile-insights / kurator-tags).
 * Invoke via Vercel Cron, Supabase edge proxy, or manual:
 * POST /api/cron/generate-curated-collection
 * Header: Authorization: Bearer <CRON_SECRET>
 * Requires: OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase env" }, { status: 500 })
  }

  try {
    const admin = createClient(url, serviceKey)
    const { month, result } = await generateCuratedCollection(admin)
    return NextResponse.json({ ok: true, month, ...result })
  } catch (e) {
    console.error("[kurator-cron]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kurator job failed" },
      { status: 500 }
    )
  }
}
