import { NextResponse } from "next/server";

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
    const assistantId = "asst_KKXnbPckdCyhE2hUrxCaA9vM"; // The Kurator
    
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
      console.error("[PROFILE INSIGHTS] Thread creation failed:", threadData);
      return NextResponse.json({ error: "Failed to create analysis thread" }, { status: 500 });
    }
    const threadId = threadData.id;
    console.log("[PROFILE INSIGHTS] Thread created:", threadId);

    // 2. Add a message to the thread
    const kuratorPrompt = `As an expert art curator, analyze this collector's art collection and provide sophisticated insights about their taste and preferences. 

Collection Data:
${JSON.stringify(collectionData, null, 2)}

Please provide a response as a JSON object with these keys:
- "summary": A rich, eloquent 3-4 sentence summary of their collection and artistic taste (avoid generic phrases like "eclectic taste" - be specific and sophisticated). Address the user directly using "You" and "Your"
- "aesthetic_profile": A 2-3 sentence description of their aesthetic sensibilities and what draws them to art. Use "You" to make it personal
- "collecting_pattern": 1-2 sentences about patterns in their collecting behavior. Address them directly as "You"
- "recommendations": An array of 3-4 specific, personalized recommendations for exploring new artists, styles, or themes based on their current collection

IMPORTANT: Always address the collector directly using "You", "Your", and "You're" rather than "The collector", "This collection", or "They". Make it personal and conversational while maintaining sophistication.

Focus on being insightful, sophisticated, and specific rather than generic. Consider the relationships between artworks, the progression of their taste, and what their choices reveal about their artistic sensibilities.

Example format:
{
  "summary": "Your collection reveals a sophisticated appreciation for contemporary digital abstraction, with a particular affinity for works that explore the intersection of technology and organic forms. You've curated pieces that demonstrate both Pak's minimalist explorations and more vibrant landscape works, suggesting you value conceptual depth alongside visual impact.",
  "aesthetic_profile": "You demonstrate a refined eye for pieces that balance intellectual rigor with emotional resonance, gravitating toward works that challenge conventional boundaries between digital and traditional artistic expression.",
  "collecting_pattern": "Your selections show a thoughtful progression from established digital artists toward emerging voices in the space, indicating you're building a cohesive narrative around technological art.",
  "recommendations": [
    "Explore generative art pioneers like Casey Reas and Joshua Davis",
    "Consider works by Memo Akten that blend AI and environmental themes",
    "Investigate the intersection of data visualization and fine art",
    "Look into bio-art and digital ecology movements"
  ]
}`;

    const messageRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: kuratorPrompt
      }),
    });
    const messageData = await messageRes.json();
    if (!messageRes.ok) {
      console.error("[PROFILE INSIGHTS] Message creation failed:", messageData);
      return NextResponse.json({ error: "Failed to add message to thread" }, { status: 500 });
    }
    console.log("[PROFILE INSIGHTS] Message added to thread");

    // 3. Run the Kurator assistant
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
      console.error("[PROFILE INSIGHTS] Run creation failed:", runData);
      return NextResponse.json({ error: "Failed to start analysis" }, { status: 500 });
    }
    const runId = runData.id;
    console.log("[PROFILE INSIGHTS] Run started:", runId);

    // 4. Poll for completion
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
        console.error("[PROFILE INSIGHTS] Status check failed:", statusData);
        return NextResponse.json({ error: "Failed to check analysis status" }, { status: 500 });
      }
      runStatus = statusData.status;
      attempts++;
      console.log("[PROFILE INSIGHTS] Run status:", runStatus, "attempt", attempts);
      
      if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
        console.error("[PROFILE INSIGHTS] Run failed with status:", runStatus);
        return NextResponse.json({ error: `Analysis failed: ${runStatus}` }, { status: 500 });
      }
    }
    
    if (runStatus !== 'completed') {
      console.error("[PROFILE INSIGHTS] Run timed out after", attempts, "attempts");
      return NextResponse.json({ error: 'Analysis timed out' }, { status: 504 });
    }
    console.log("[PROFILE INSIGHTS] Run completed successfully");

    // 5. Retrieve the response
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
    });
    const messagesData = await messagesRes.json();
    if (!messagesRes.ok) {
      console.error("[PROFILE INSIGHTS] Message retrieval failed:", messagesData);
      return NextResponse.json({ error: "Failed to retrieve analysis" }, { status: 500 });
    }

    // Find the latest assistant message
    const aiMessage = messagesData.data.reverse().find((msg: any) => msg.role === 'assistant');
    
    if (!aiMessage) {
      console.error("[PROFILE INSIGHTS] No assistant message found");
      return NextResponse.json({ error: "No analysis response found" }, { status: 500 });
    }

    try {
      let text = aiMessage.content[0].text.value || '';
      // Clean up code block markers
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (text.startsWith('```')) {
        text = text.replace(/^```/, '').replace(/```$/, '').trim();
      }
      
      console.log('[PROFILE INSIGHTS RAW RESPONSE]', text);
      const parsed = JSON.parse(text);
      
      // Validate response structure
      const response = {
        summary: parsed.summary || "Your collection shows a developing artistic sensibility.",
        aesthetic_profile: parsed.aesthetic_profile || "You appreciate quality and craftsmanship in art.",
        collecting_pattern: parsed.collecting_pattern || "Your collecting journey is just beginning.",
        recommendations: parsed.recommendations || ["Explore more artworks in the Discover section"]
      };
      
      console.log("[PROFILE INSIGHTS] Final response:", response);
      return NextResponse.json(response);
      
    } catch (parseError) {
      console.error('[PROFILE INSIGHTS PARSE ERROR]', parseError);
      console.error('[PROFILE INSIGHTS RAW TEXT]', aiMessage.content[0].text.value);
      
      // Fallback response
      return NextResponse.json({
        summary: "Your collection demonstrates a thoughtful approach to art acquisition, with each piece contributing to a growing personal narrative.",
        aesthetic_profile: "You show an appreciation for both conceptual depth and visual impact in your artistic choices.",
        collecting_pattern: "Your selections indicate a collector who values quality and meaning over quantity.",
        recommendations: [
          "Explore works by artists working in similar themes to your current collection",
          "Consider pieces that complement your existing aesthetic sensibilities",
          "Look for emerging artists whose work resonates with your established preferences"
        ]
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