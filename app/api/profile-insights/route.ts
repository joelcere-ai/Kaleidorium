import { NextResponse } from "next/server";
import { runKurator } from "@/lib/kurator-assistant";

export const maxDuration = 60;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "aesthetic_profile", "collecting_pattern", "recommendations", "explorationSuggestions"],
  properties: {
    summary: { type: "string" },
    aesthetic_profile: { type: "string" },
    collecting_pattern: { type: "string" },
    recommendations: { type: "array", items: { type: "string" } },
    explorationSuggestions: { type: "array", items: { type: "string" } },
  },
};

/** Strips inline markdown citations like "([site](url))" that the web search tool can add. */
function cleanRecommendationText(text: string): string {
  return text
    .replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const { collection } = await request.json();
    
    if (!collection || !Array.isArray(collection) || collection.length === 0) {
      return NextResponse.json({
        summary: "Your collection is empty. Add some artworks to get personalized insights.",
        recommendations: ["Explore the Discover section to find artworks that speak to you"]
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
    }

    console.log("[PROFILE INSIGHTS] Starting analysis for collection of", collection.length, "artworks");

    // Prepare collection data for analysis
    const collectionData = collection.map(artwork => ({
      title: artwork.artwork_title || artwork.title,
      artist: artwork.artist,
      description: artwork.description,
      genre: artwork.genre,
      style: artwork.style,
      subject: artwork.subject,
      colour: artwork.colour,
      medium: artwork.medium,
      price: artwork.price
    }));

    const kuratorPrompt = `You are The Kurator, an expert art curator. Analyze this collector's art collection and provide sophisticated insights about their taste and preferences.

Collection Data:
${JSON.stringify(collectionData, null, 2)}

Respond with a JSON object with these keys:
- "summary": A rich, eloquent 3-4 sentence summary of their collection and artistic taste (avoid generic phrases like "eclectic taste" - be specific and sophisticated). Address the user directly using "You" and "Your"
- "aesthetic_profile": A 2-3 sentence description of their aesthetic sensibilities and what draws them to art. Use "You" to make it personal
- "collecting_pattern": 1-2 sentences about patterns in their collecting behavior. Address them directly as "You"
- "recommendations": An array of 4 recommendations of artists, artworks, or art movements/styles to discover next. These are NOT limited to artists on Kaleidorium: use web search to find real artists (historical, established, or emerging contemporary) and artworks from anywhere in the art world. Do not recommend artists already in the collection, and do not mention Kaleidorium, Discover, or the app. Each item is one sentence that names the artist or movement and explains why it fits this collector's taste (e.g. "Egon Schiele – raw, psychologically intense Expressionist portraits that extend your interest in ..."). No links, URLs, markdown, or citations.
- "explorationSuggestions": An array of 4-5 SHORT thematic phrases (2-4 words each, like "Minimalist cityscapes", "Quiet surrealism", "Dreamlike architecture", "Soft pastel palettes") representing adjacent territories the collector should explore. These appear as visual chip/tags in the UI, so keep them concise and evocative.

IMPORTANT: Always address the collector directly using "You", "Your", and "You're" rather than "The collector", "This collection", or "They". Make it personal and conversational while maintaining sophistication.

Focus on being insightful, sophisticated, and specific rather than generic. Consider the relationships between artworks, the progression of their taste, and what their choices reveal about their artistic sensibilities.`;

    let text: string;
    try {
      text = await runKurator({
        input: kuratorPrompt,
        webSearch: true,
        jsonSchema: { name: "taste_profile_insights", schema: RESPONSE_SCHEMA },
      });
    } catch (aiError) {
      console.error("[PROFILE INSIGHTS] OpenAI request failed:", aiError);
      return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 });
    }

    try {
      console.log('[PROFILE INSIGHTS RAW RESPONSE]', text);
      const parsed = JSON.parse(text);

      const recommendations: string[] = Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map((item: any) => cleanRecommendationText(String(item || ""))).filter(Boolean)
        : [];
      
      // Validate response structure
      const response = {
        summary: parsed.summary || "Your collection shows a developing artistic sensibility.",
        aesthetic_profile: parsed.aesthetic_profile || "You appreciate quality and craftsmanship in art.",
        collecting_pattern: parsed.collecting_pattern || "Your collecting journey is just beginning.",
        recommendations,
        explorationSuggestions: Array.isArray(parsed.explorationSuggestions) ? parsed.explorationSuggestions : []
      };
      
      console.log("[PROFILE INSIGHTS] Final response:", response);
      return NextResponse.json(response);
      
    } catch (parseError) {
      console.error('[PROFILE INSIGHTS PARSE ERROR]', parseError);
      console.error('[PROFILE INSIGHTS RAW TEXT]', text);
      
      // Fallback response
      return NextResponse.json({
        summary: "Your collection demonstrates a thoughtful approach to art acquisition, with each piece contributing to a growing personal narrative.",
        aesthetic_profile: "You show an appreciation for both conceptual depth and visual impact in your artistic choices.",
        collecting_pattern: "Your selections indicate a collector who values quality and meaning over quantity.",
        recommendations: [
          "Explore works by artists working in similar themes to your current collection",
          "Consider pieces that complement your existing aesthetic sensibilities",
          "Look for emerging artists whose work resonates with your established preferences"
        ],
        explorationSuggestions: []
      });
    }

  } catch (error: any) {
    console.error("[PROFILE INSIGHTS] Unexpected error:", error);
    return NextResponse.json(
      { error: `Failed to generate profile insights: ${error.message}` },
      { status: 500 }
    );
  }
} 
