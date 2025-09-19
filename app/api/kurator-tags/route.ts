import { NextResponse } from "next/server";

const ALLOWED_COLOURS = [
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
  "Rice", "Short Bread", "Tuscan Sun", "Yam", "Lipstick", "Hot Pink", "Artic", "Crocodile", "Cedar", "Fossil", "Leather"
];

const ALLOWED_GENRES = ["Digital", "Painting", "Photography", "Sculpture", "Print", "Drawing", "Mixed Media", "NFT"];
const ALLOWED_STYLES = ["Abstract", "Figurative", "Surrealism", "Pop Art", "Minimalism", "Expressionism", "Realism", "Conceptual", "Street Art", "Cubism"];

interface KuratorTags {
  genre: string;
  style: string;
  subject: string;
  colour: string | null;
  keywords: string[];
}

export async function POST(request: Request) {
  try {
    console.log("[KURATOR] API called, parsing request...");
    
    const { description, imageUrl } = await request.json();
    
    console.log("[KURATOR] Request parsed successfully", {
      hasDescription: !!description,
      imageUrlLength: imageUrl?.length || 0,
      imageUrlStart: imageUrl?.substring(0, 100) || 'none'
    });
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
    }

    console.log("[KURATOR] Starting tag generation for image:", imageUrl.substring(0, 50) + "...");

    // Handle data URLs by converting them for OpenAI
    let imageForAnalysis = imageUrl;
    if (imageUrl.startsWith('data:')) {
      console.log("[KURATOR] Processing data URL for analysis");
      // For data URLs, we'll send them directly to OpenAI Vision API
      // OpenAI can handle base64 images directly
      imageForAnalysis = imageUrl;
    }

    // Use the Kurator assistant API for all URLs
    const assistantId = "asst_KKXnbPckdCyhE2hUrxCaA9vM";
    console.log("[KURATOR] Using assistant API for regular URL");

    // 1. Create a thread
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });
    const threadData = await threadRes.json();
    if (!threadRes.ok) {
      const errorMessage = threadData.error?.message || JSON.stringify(threadData);
      console.error("[KURATOR] Thread creation failed:", errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: threadRes.status });
    }
    const threadId = threadData.id;
    console.log("[KURATOR] Thread created:", threadId);

    // 2. Add a message to the thread with the image as an image_url input and the description as text
    const kuratorPrompt = `You are an expert art curator. Analyze the provided artwork image. Return your answer as a JSON object with the following keys: description, genre, style, subject, colour, keywords (array of strings).

For description, provide a professional, detailed 2-3 sentence description of the artwork suitable for collectors. Do NOT start with "This artwork" or "This image" - go straight into describing the piece. When possible, reference similar work by other notable artists to provide context and market positioning.
For genre, choose exactly one from this list: ${ALLOWED_GENRES.join(", ")}
For style, choose exactly one from this list: ${ALLOWED_STYLES.join(", ")}
For subject, provide a single word or short phrase describing the main subject matter
For colour, choose one from the allowed colours list: ${ALLOWED_COLOURS.join(", ")}
For keywords, provide an array of 3-5 relevant descriptive words

Example: {"description": "Bold geometric forms and contrasting colors create a dynamic composition reminiscent of Kandinsky's abstract expressionist works. The interplay of sharp angles and flowing curves demonstrates a sophisticated understanding of color theory, while the layered complexity recalls the digital innovations of Casey Reas.", "genre": "Digital", "style": "Abstract", "subject": "geometric forms", "colour": "Blue", "keywords": ["modern", "geometric", "expression"]}`;
    const messageRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl.startsWith('data:') ? imageUrl : imageUrl,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: kuratorPrompt
          }
        ],
      }),
    });
    const messageData = await messageRes.json();
    if (!messageRes.ok) {
      const errorMessage = messageData.error?.message || JSON.stringify(messageData);
      console.error("[KURATOR] Message creation failed:", errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: messageRes.status });
    }
    console.log("[KURATOR] Message added to thread");

    // 3. Run the Kurator assistant on the thread
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    });
    const runData = await runRes.json();
    if (!runRes.ok) {
      const errorMessage = runData.error?.message || JSON.stringify(runData);
      console.error("[KURATOR] Run creation failed:", errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: runRes.status });
    }
    const runId = runData.id;
    console.log("[KURATOR] Run started:", runId);

    // 4. Poll for run completion
    let runStatus = runData.status;
    let attempts = 0;
    while (runStatus !== 'completed' && attempts < 20) {
      await new Promise(res => setTimeout(res, 1500));
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
      });
      const statusData = await statusRes.json();
      if (!statusRes.ok) {
        const errorMessage = statusData.error?.message || JSON.stringify(statusData);
        console.error("[KURATOR] Status check failed:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: statusRes.status });
      }
      runStatus = statusData.status;
      attempts++;
      console.log("[KURATOR] Run status:", runStatus, "attempt", attempts);
      if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
        console.error("[KURATOR] Run failed with status:", runStatus);
        return NextResponse.json({ error: `Run status: ${runStatus}` }, { status: 500 });
      }
    }
    if (runStatus !== 'completed') {
      console.error("[KURATOR] Run timed out after", attempts, "attempts");
      return NextResponse.json({ error: 'Timed out waiting for AI response.' }, { status: 504 });
    }
    console.log("[KURATOR] Run completed successfully");

    // 5. Retrieve the messages from the thread
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
    });
    const messagesData = await messagesRes.json();
    if (!messagesRes.ok) {
      const errorMessage = messagesData.error?.message || JSON.stringify(messagesData);
      console.error("[KURATOR] Message retrieval failed:", errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: messagesRes.status });
    }
    // Find the latest assistant message
    const aiMessage = messagesData.data.reverse().find((msg: any) => msg.role === 'assistant');
    let generatedDescription = '';
    let genre = '';
    let style = '';
    let subject = '';
    let colour = '';
    let keywords: string[] = [];
    if (aiMessage) {
      try {
        let text = aiMessage.content[0].text.value || '';
        // Remove code block markers if present
        text = text.trim();
        if (text.startsWith('```json')) {
          text = text.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (text.startsWith('```')) {
          text = text.replace(/^```/, '').replace(/```$/, '').trim();
        }
        console.log('[KURATOR RAW RESPONSE]', text);
        const parsed = JSON.parse(text);
        generatedDescription = parsed.description || '';
        genre = parsed.genre || '';
        style = parsed.style || '';
        subject = parsed.subject || '';
        colour = parsed.colour || '';
        keywords = parsed.keywords || [];
      } catch (e) {
        const text = aiMessage.content[0].text.value || '';
        console.warn('[KURATOR PARSE ERROR] Raw text:', text);
        console.error('[KURATOR PARSE ERROR] Error:', e);
        // fallback: leave tags empty
      }
    } else {
      console.warn("[KURATOR] No assistant message found in thread");
    }

    // Validate colour (case-insensitive, normalize to allowed list casing)
    if (colour) {
      const match = ALLOWED_COLOURS.find(c => c.toLowerCase() === colour.toLowerCase());
      if (match) {
        colour = match; // normalize to allowed list casing
      } else {
        console.log("[KURATOR] Invalid colour:", colour, "setting to empty string");
        colour = '';
      }
    }

    // Validate genre and style
    if (genre && !ALLOWED_GENRES.includes(genre)) {
      console.log("[KURATOR] Invalid genre:", genre, "setting to empty string");
      genre = '';
    }
    if (style && !ALLOWED_STYLES.includes(style)) {
      console.log("[KURATOR] Invalid style:", style, "setting to empty string");
      style = '';
    }

    const response = { description: generatedDescription, genre, style, subject, colour, keywords };
    console.log("[KURATOR] Final response:", response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[KURATOR] Unexpected error:", error);
    return NextResponse.json(
      { error: `Failed to generate tags: ${error.message || error.toString()}` },
      { status: 500 }
    );
  }
} 