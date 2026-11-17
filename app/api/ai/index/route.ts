import { NextResponse } from "next/server";
import { indexNotes } from "@/lib/ai/rag/vector-store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await indexNotes();
    if (result.error) {
      return NextResponse.json(
        { error: result.error, indexed: result.indexed, aiUnavailable: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ indexed: result.indexed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to index notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
