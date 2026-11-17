import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/server/db";

export const runtime = "nodejs";
const FILENAME = "collaboration.json";

export interface CollaborationState {
  messages: any[];
  whiteboardElements: any[];
  pinnedSnippet: any;
}

const DEFAULT_STATE: CollaborationState = {
  messages: [],
  whiteboardElements: [],
  pinnedSnippet: null,
};

export async function GET() {
  const data = readJSON<CollaborationState>(FILENAME, DEFAULT_STATE);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = readJSON<CollaborationState>(FILENAME, DEFAULT_STATE);

    const { action, payload } = body;

    switch (action) {
      case "send_message": {
        const newMessage = {
          ...payload,
          id: payload.id || `msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        data.messages.push(newMessage);
        if (payload.pinnedSnippet) {
          data.pinnedSnippet = payload.pinnedSnippet;
        }
        writeJSON(FILENAME, data);
        return NextResponse.json({ success: true, message: newMessage });
      }

      case "update_whiteboard": {
        data.whiteboardElements = payload.elements || [];
        writeJSON(FILENAME, data);
        return NextResponse.json({ success: true, whiteboardElements: data.whiteboardElements });
      }

      case "update_pasteboard": {
        data.pinnedSnippet = {
          ...payload,
          updatedAt: new Date().toISOString(),
          isPinned: true,
        };
        writeJSON(FILENAME, data);
        return NextResponse.json({ success: true, pinnedSnippet: data.pinnedSnippet });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating collaboration state";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
