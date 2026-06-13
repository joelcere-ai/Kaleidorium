import { KURATOR_ASSISTANT_ID } from "@/lib/kurator-assistant"

export const ALLOWED_COLOURS = [
  "White", "Tan", "Yellow", "Orange", "Red", "Pink", "Purple", "Blue", "Green", "Brown", "Grey", "Black",
  "Pearl", "Beige", "Canary", "Tangerine", "Cherry", "Rose", "Mauve", "Slate", "Chartreuse", "Coffee", "Shadow", "Ebony",
  "Alabaster", "Macaroon", "Gold", "Merigold", "Fuschia", "Violet", "Sky", "Juniper", "Mocha", "Graphite", "Crow",
  "Snow", "Hazel", "Wood", "Daffodil", "Cider", "Jam", "Punch", "Boysenberry", "Navy", "Sage", "Peanut", "Iron", "Charcoal",
  "Ivory", "Granola", "Flaxen", "Rust", "Merlot", "Blush", "Lavender", "Indigo", "Lime", "Carob", "Pewter", "Midnight",
  "Cream", "Oat", "Butter", "Ginger", "Garnet", "Watermelon", "Plum", "Cobalt", "Fern", "Hickory", "Cloud", "Ink",
  "Egg Shell", "Egg Nog", "Lemon", "Tiger", "Crimson", "Flamingo", "Magenta", "Teal", "Olive", "Wood", "Silver", "Raven",
  "Cotton", "Fawn", "Mustard", "Fire", "Ruby", "Rouge", "Lilac", "Ocean", "Emerald", "Pecan", "Smoke", "Oil",
  "Chiffon", "Sugar Cookie", "Corn", "Bronze", "Scarlet", "Salmon", "Grape", "Peacock", "Pear", "Walnut", "Slate", "Grease",
  "Salt", "Sand", "Medallion", "Cantaloupe", "Wine", "Coral", "Periwinkle", "Azure", "Moss", "Caramel", "Anchor", "Onyx",
  "Lace", "Sepia", "Dandelion", "Apricot", "Brick", "Peach", "Sangria", "Cerulean", "Shamrock", "Gingerbread", "Ash", "Pitch",
  "Coconut", "Latte", "Clay", "Apple", "Strawberry", "Egg Plant", "Lapis", "Seafoam", "Syrup", "Porpoise", "Soot",
  "Linen", "Oyster", "Bumblebee", "Honey", "Mahoganhy", "Rosewood", "Spruce", "Pine", "Chocolate", "Dove", "Sable",
  "Bone", "Biscotti", "Banana", "Carrot", "Blood", "Lemonade", "Iris", "Stone", "Parakeet", "Tortilla", "Fog", "Jet Black",
  "Daisy", "Parmesan", "Butterscotch", "Squash", "Taffy", "Heather", "Aegean", "Mint", "Umber", "Flint", "Coal",
  "Powder", "Hazelnut", "Dijon", "Spice", "Berry", "Bubblegum", "Amethyst", "Seaweed", "Tawny", "Metal",
  "Frost", "Sandcastle", "Marmalade", "Currant", "Ballet Slipper", "Raisin", "Denim", "Pickle", "Brunette", "Pebble", "Obsidian",
  "Porcelain", "Buttermilk", "Blonde", "Amber", "Crepe", "Orchid", "Admiral", "Pistachio", "Cinnamom", "Lead", "Jade",
  "Parchment", "Sand Dollar", "Pineapple", "Sandstone", "Candy", "Mulberry", "Saphire", "Basil", "Penny", "Coin", "Spider",
  "Rice", "Short Bread", "Tuscan Sun", "Yam", "Lipstick", "Hot Pink", "Artic", "Crocodile", "Cedar", "Fossil", "Leather",
]

export const ALLOWED_GENRES = ["Digital", "Painting", "Photography", "Sculpture", "Print", "Drawing", "Mixed Media", "NFT"]
export const ALLOWED_STYLES = ["Abstract", "Figurative", "Surrealism", "Pop Art", "Minimalism", "Expressionism", "Realism", "Conceptual", "Street Art", "Cubism"]

export interface KuratorArtworkAnalysis {
  description: string
  genre: string
  style: string
  subject: string
  colour: string
  keywords: string[]
}

const OPENAI_HEADERS = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  "OpenAI-Beta": "assistants=v2",
})

function buildKuratorPrompt() {
  return `You are an expert art curator. Analyze the provided artwork image. Return your answer as a JSON object with the following keys: description, genre, style, subject, colour, keywords (array of strings).

For description, provide a professional, detailed 2-3 sentence description of the artwork suitable for collectors. Do NOT start with "This artwork" or "This image" - go straight into describing the piece. When possible, reference similar work by other notable artists to provide context and market positioning.
For genre, choose exactly one from this list: ${ALLOWED_GENRES.join(", ")}
For style, choose exactly one from this list: ${ALLOWED_STYLES.join(", ")}
For subject, provide a single word or short phrase describing the main subject matter
For colour, choose one from the allowed colours list: ${ALLOWED_COLOURS.join(", ")}
For keywords, provide an array of 3-5 relevant descriptive words

Example: {"description": "Bold geometric forms and contrasting colors create a dynamic composition reminiscent of Kandinsky's abstract expressionist works. The interplay of sharp angles and flowing curves demonstrates a sophisticated understanding of color theory, while the layered complexity recalls the digital innovations of Casey Reas.", "genre": "Digital", "style": "Abstract", "subject": "geometric forms", "colour": "Blue", "keywords": ["modern", "geometric", "expression"]}`
}

function normalizeAnalysis(raw: {
  description?: string
  genre?: string
  style?: string
  subject?: string
  colour?: string
  keywords?: string[]
}): KuratorArtworkAnalysis {
  let genre = raw.genre || ""
  let style = raw.style || ""
  let colour = raw.colour || ""

  if (colour) {
    const match = ALLOWED_COLOURS.find((c) => c.toLowerCase() === colour.toLowerCase())
    colour = match || ""
  }
  if (genre && !ALLOWED_GENRES.includes(genre)) genre = ""
  if (style && !ALLOWED_STYLES.includes(style)) style = ""

  return {
    description: raw.description || "",
    genre,
    style,
    subject: raw.subject || "",
    colour,
    keywords: Array.isArray(raw.keywords) ? raw.keywords.filter((k) => k && String(k).trim()) : [],
  }
}

export function buildArtworkTags(analysis: KuratorArtworkAnalysis): string[] {
  return [
    analysis.genre,
    analysis.style,
    analysis.subject,
    analysis.colour,
    ...analysis.keywords,
  ].filter((tag) => tag && tag.trim())
}

/** Run The Kurator vision analysis on an artwork image URL. */
export async function analyzeArtworkImage(imageUrl: string): Promise<KuratorArtworkAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY")
  if (!imageUrl) throw new Error("Image URL is required")

  const threadRes = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: OPENAI_HEADERS(apiKey),
    body: JSON.stringify({}),
  })
  const threadData = await threadRes.json()
  if (!threadRes.ok) {
    throw new Error(threadData.error?.message || JSON.stringify(threadData))
  }
  const threadId = threadData.id as string

  const messageRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "POST",
    headers: OPENAI_HEADERS(apiKey),
    body: JSON.stringify({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: imageUrl, detail: "high" },
        },
        { type: "text", text: buildKuratorPrompt() },
      ],
    }),
  })
  const messageData = await messageRes.json()
  if (!messageRes.ok) {
    throw new Error(messageData.error?.message || JSON.stringify(messageData))
  }

  const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers: OPENAI_HEADERS(apiKey),
    body: JSON.stringify({ assistant_id: KURATOR_ASSISTANT_ID }),
  })
  const runData = await runRes.json()
  if (!runRes.ok) {
    throw new Error(runData.error?.message || JSON.stringify(runData))
  }
  const runId = runData.id as string

  let runStatus = runData.status as string
  let attempts = 0
  while (runStatus !== "completed" && attempts < 20) {
    await new Promise((res) => setTimeout(res, 1500))
    const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      headers: OPENAI_HEADERS(apiKey),
    })
    const statusData = await statusRes.json()
    if (!statusRes.ok) {
      throw new Error(statusData.error?.message || JSON.stringify(statusData))
    }
    runStatus = statusData.status
    attempts++
    if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
      const err = statusData.last_error as { message?: string; code?: string } | undefined
      const detail = err?.message ? `: ${err.message}` : ""
      throw new Error(`Kurator run status: ${runStatus}${detail}`)
    }
  }
  if (runStatus !== "completed") {
    throw new Error("Timed out waiting for Kurator response")
  }

  const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    headers: OPENAI_HEADERS(apiKey),
  })
  const messagesData = await messagesRes.json()
  if (!messagesRes.ok) {
    throw new Error(messagesData.error?.message || JSON.stringify(messagesData))
  }

  const aiMessage = [...messagesData.data].reverse().find((msg: { role: string }) => msg.role === "assistant")
  if (!aiMessage) {
    return normalizeAnalysis({})
  }

  try {
    let text = aiMessage.content[0].text.value || ""
    text = text.trim()
    if (text.startsWith("```json")) {
      text = text.replace(/^```json/, "").replace(/```$/, "").trim()
    } else if (text.startsWith("```")) {
      text = text.replace(/^```/, "").replace(/```$/, "").trim()
    }
    const parsed = JSON.parse(text)
    return normalizeAnalysis(parsed)
  } catch {
    return normalizeAnalysis({})
  }
}
