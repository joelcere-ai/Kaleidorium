/** Shared OpenAI runner for The Kurator (Responses API). */
export const KURATOR_MODEL = "gpt-5-mini"

const KURATOR_INSTRUCTIONS =
  "You are The Kurator, Kaleidorium's expert art curator. You write in a refined, specific, editorial voice and avoid generic phrases. When asked for JSON, respond with valid JSON only."

type KuratorInputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "low" | "high" | "auto" }

export interface KuratorRunOptions {
  /** Prompt text, or mixed text/image content for vision tasks. */
  input: string | KuratorInputContent[]
  /** Lets The Kurator search the web (e.g. to find artists beyond Kaleidorium). */
  webSearch?: boolean
  /** Strict JSON schema for the reply; otherwise any JSON object. */
  jsonSchema?: { name: string; schema: Record<string, unknown> }
}

function cleanAssistantJson(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim()
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim()
  }
  return cleaned
}

/** Run The Kurator and return its raw JSON text reply. */
export async function runKurator({ input, webSearch, jsonSchema }: KuratorRunOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY")

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KURATOR_MODEL,
      instructions: KURATOR_INSTRUCTIONS,
      input: typeof input === "string" ? input : [{ role: "user", content: input }],
      // Web search needs at least "low" reasoning on GPT-5 models.
      reasoning: { effort: webSearch ? "low" : "minimal" },
      ...(webSearch ? { tools: [{ type: "web_search" }] } : {}),
      text: {
        format: jsonSchema
          ? { type: "json_schema", name: jsonSchema.name, strict: true, schema: jsonSchema.schema }
          : { type: "json_object" },
      },
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data) {
    throw new Error(data?.error?.message || `Kurator request failed (${res.status})`)
  }

  const text = (data.output || [])
    .filter((item: { type: string }) => item.type === "message")
    .flatMap((item: { content?: { type: string; text?: string }[] }) => item.content || [])
    .filter((part: { type: string }) => part.type === "output_text")
    .map((part: { text?: string }) => part.text || "")
    .join("")

  if (!text) throw new Error("No Kurator response found")
  return cleanAssistantJson(text)
}

/** Run The Kurator with a text prompt and return the raw reply. */
export async function runKuratorAssistant(prompt: string): Promise<string> {
  return runKurator({ input: prompt })
}
