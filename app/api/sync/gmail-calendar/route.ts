import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/server/db";
import { scanEmailBatch, type AcademicEmail } from "@/lib/sync/scanner";
import { calculateDailyStress } from "@/lib/sync/stress-meter";
import type { Exam, Task, ClassSession } from "@/lib/types";

export const runtime = "nodejs";
const FILENAME = "sync.json";

export async function GET() {
  const syncData = readJSON<{ lastSynced: string; emails: AcademicEmail[] }>(FILENAME, {
    lastSynced: new Date().toISOString(),
    emails: [],
  });

  const exams = readJSON<Exam[]>("exams.json", []);
  const tasks = readJSON<Task[]>("tasks.json", []);
  const timetable = readJSON<ClassSession[]>("timetable.json", []);

  const scannedDeadlines = scanEmailBatch(syncData.emails);
  const stressSummary = calculateDailyStress(
    new Date(),
    30,
    scannedDeadlines,
    exams,
    tasks,
    timetable
  );

  return NextResponse.json({
    lastSynced: syncData.lastSynced,
    emails: syncData.emails,
    scannedDeadlines,
    stressSummary,
  });
}

export async function POST(request: Request) {
  try {
    const syncData = readJSON<{ lastSynced: string; emails: AcademicEmail[] }>(FILENAME, {
      lastSynced: new Date().toISOString(),
      emails: [],
    });

    const body = await request.json().catch(() => ({}));

    // If new email provided in request
    if (body.newEmail) {
      syncData.emails.unshift({
        ...body.newEmail,
        id: `mail-${Date.now()}`,
        receivedAt: new Date().toISOString(),
      });
    }

    syncData.lastSynced = new Date().toISOString();
    writeJSON(FILENAME, syncData);

    const exams = readJSON<Exam[]>("exams.json", []);
    const tasks = readJSON<Task[]>("tasks.json", []);
    const timetable = readJSON<ClassSession[]>("timetable.json", []);

    const scannedDeadlines = scanEmailBatch(syncData.emails);
    const stressSummary = calculateDailyStress(
      new Date(),
      30,
      scannedDeadlines,
      exams,
      tasks,
      timetable
    );

    return NextResponse.json({
      success: true,
      lastSynced: syncData.lastSynced,
      emails: syncData.emails,
      scannedDeadlines,
      stressSummary,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
