import { NextResponse } from "next/server";
import { writeJSON } from "@/server/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { target } = await request.json().catch(() => ({ target: "all" }));

    if (target === "all" || target === "tasks") {
      writeJSON("tasks.json", []);
    }
    if (target === "all" || target === "expenses") {
      writeJSON("expenses.json", []);
    }
    if (target === "all" || target === "notes") {
      writeJSON("notes.json", []);
      writeJSON("vectors.json", []);
    }
    if (target === "all" || target === "timetable") {
      writeJSON("timetable.json", []);
    }
    if (target === "all" || target === "chat") {
      writeJSON("chat-history.json", []);
    }

    return NextResponse.json({ success: true, target });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Reset failed" }, { status: 500 });
  }
}
