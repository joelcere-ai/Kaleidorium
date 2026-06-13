import { NextResponse } from "next/server";
import { analyzeArtworkImage } from "@/lib/kurator-artwork-tags";

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeArtworkImage(imageUrl);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[KURATOR] Unexpected error:", error);
    return NextResponse.json(
      { error: `Failed to generate tags: ${message}` },
      { status: 500 }
    );
  }
}
