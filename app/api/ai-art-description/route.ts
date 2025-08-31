import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    // Use the same model and approach as /api/kurator-tags
    const prompt = `As an art curator, analyze this artwork and provide a detailed description and a list of relevant tags as a JSON object with these exact keys: description, tags (array of strings).\n\nArtwork Image URL: ${imageUrl}`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional art curator with expertise in analyzing and categorizing artwork. Provide a detailed description and relevant tags based on the artwork's visual elements."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    let description = '';
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      description = parsed.description || '';
      tags = parsed.tags || [];
    } catch {
      description = completion.choices[0].message.content || '';
      tags = [];
    }
    return NextResponse.json({ description, tags });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// TEMP: Add a GET endpoint to test OpenAI credentials
export async function GET() {
  try {
    const apiKey = process.env.OPENAI_ASSISTANT_API_KEY;
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    if (!apiKey || !assistantId) {
      return NextResponse.json({ error: 'Missing OpenAI credentials' }, { status: 500 });
    }
    // Try a simple fetch to OpenAI API
    const response = await fetch('https://api.openai.com/v1/assistants/' + assistantId, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 