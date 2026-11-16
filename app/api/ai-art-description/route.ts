import { NextRequest, NextResponse } from 'next/server';
import { runKurator } from "@/lib/kurator-assistant";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const prompt = `As a professional art curator, analyze this artwork's visual elements and provide a detailed description and a list of relevant tags as a JSON object with these exact keys: description, tags (array of strings).`;
    const text = await runKurator({
      input: [
        { type: "input_image", image_url: imageUrl, detail: "high" },
        { type: "input_text", text: prompt },
      ],
    });

    let description = '';
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(text);
      description = parsed.description || '';
      tags = parsed.tags || [];
    } catch {
      description = text;
      tags = [];
    }
    return NextResponse.json({ description, tags });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
