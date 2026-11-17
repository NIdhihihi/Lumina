import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/server/db";
import { runCopilot } from "@/lib/ai/orchestrator";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
const FILENAME = "chat-history.json";

export async function GET() {
  const history = readJSON<ChatMessage[]>(FILENAME, []);
  return NextResponse.json(history);
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const result = await runCopilot(prompt);

    const newChat = {
      id: Date.now().toString(),
      prompt,
      response: result.response,
      timestamp: new Date().toISOString(),
      intent: result.intent,
      sources: result.sources,
      studyPlan: result.studyPlan,
      taskPriorities: result.taskPriorities,
      recommendation: result.recommendation,
      aiUnavailable: result.aiUnavailable ?? false,
      toolData: result.toolData,
    };

    if (!result.aiUnavailable) {
      const history = readJSON<ChatMessage[]>(FILENAME, []);
      history.push(newChat);
      writeJSON(FILENAME, history);
    }

    return NextResponse.json(newChat);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message, aiUnavailable: true }, { status: 500 });
  }
}
