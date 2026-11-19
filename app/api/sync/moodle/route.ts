import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/server/db";
import { parseMoodleIcal, SAMPLE_MOODLE_ICAL_FEED } from "@/lib/sync/moodle-ical";
import { parseGoogleClassroomItem, SAMPLE_GOOGLE_CLASSROOM_DATA } from "@/lib/sync/google-classroom";
import { calculateDailyStress } from "@/lib/sync/stress-meter";
import type { ScannedDeadline } from "@/lib/sync/scanner";
import type { Task, Exam, ClassSession } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, icalText, icalUrl } = body;

    let deadlines: ScannedDeadline[] = [];

    if (action === "sync_moodle_url" || action === "sync_moodle_text") {
      let content = icalText;

      if (action === "sync_moodle_url" && icalUrl) {
        try {
          const res = await fetch(icalUrl, { headers: { "User-Agent": "Lumina-Student-OS/1.0" } });
          if (res.ok) {
            content = await res.text();
          } else {
            content = SAMPLE_MOODLE_ICAL_FEED;
          }
        } catch {
          content = SAMPLE_MOODLE_ICAL_FEED;
        }
      }

      if (!content || !content.includes("BEGIN:VEVENT")) {
        content = SAMPLE_MOODLE_ICAL_FEED;
      }

      const moodleEvents = parseMoodleIcal(content);
      deadlines = moodleEvents.map((evt) => ({
        emailId: evt.id,
        sender: "moodle_notifications@university.edu",
        matchedKeywords: [evt.type],
        urgency: evt.urgency,
        subjectHint: evt.courseName,
        detectedDate: evt.dueDate,
        extractedTitle: evt.title,
        stressScore: evt.urgency === "high" ? 8 : 5,
      }));
    } else if (action === "sync_classroom") {
      deadlines = SAMPLE_GOOGLE_CLASSROOM_DATA.map((item) => {
        const parsed = parseGoogleClassroomItem(item, item.courseName);
        return {
          emailId: parsed.id,
          sender: "classroom_notifications@google.com",
          matchedKeywords: ["assignment", "coursework"],
          urgency: parsed.urgency,
          subjectHint: parsed.courseName,
          detectedDate: parsed.dueDate,
          extractedTitle: `[${parsed.courseName}] ${parsed.title}`,
          stressScore: parsed.urgency === "high" ? 8 : 5,
        };
      });
    }

    if (deadlines.length === 0) {
      return NextResponse.json({ success: false, error: "No deadlines found in feed." }, { status: 400 });
    }

    // 1. Update sync.json with new deadlines & recalculate stress meter
    const existingSync = readJSON<any>("sync.json", { emails: [], scannedDeadlines: [] });
    const existingDeadlines: ScannedDeadline[] = existingSync.scannedDeadlines || [];
    const mergedDeadlines = [
      ...existingDeadlines.filter((d) => !deadlines.some((n) => n.emailId === d.emailId)),
      ...deadlines,
    ];

    // 2. Automatically sync deadlines into Kanban tasks (Want to Do)
    const existingTasks = readJSON<Task[]>("tasks.json", []);
    const newTasks: Task[] = deadlines.map((d) => ({
      id: `task-${d.emailId.replace(/[^a-zA-Z0-9-]/g, "")}`,
      title: d.extractedTitle,
      description: `Imported deadline from ${d.subjectHint || "Coursework"}. Due on ${d.detectedDate}.`,
      status: "want_to_do",
      priority: d.urgency,
      dueDate: d.detectedDate,
      projectName: d.subjectHint || "College Portal Sync",
      phase: "Active Submissions",
      assignee: { name: "You", avatar: "👤" },
    }));

    const mergedTasks = [
      ...existingTasks.filter((t) => !newTasks.some((n) => n.id === t.id)),
      ...newTasks,
    ];
    writeJSON("tasks.json", mergedTasks);

    const exams = readJSON<Exam[]>("exams.json", []);
    const timetable = readJSON<ClassSession[]>("timetable.json", []);
    const stressSummary = calculateDailyStress(
      new Date(),
      30,
      mergedDeadlines,
      exams,
      mergedTasks,
      timetable
    );

    const updatedSync = {
      ...existingSync,
      scannedDeadlines: mergedDeadlines,
      stressSummary,
      lastSynced: new Date().toISOString(),
    };
    writeJSON("sync.json", updatedSync);

    return NextResponse.json({
      success: true,
      syncedCount: deadlines.length,
      deadlines,
      stressSummary,
      lastSynced: updatedSync.lastSynced,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Sync failed" }, { status: 500 });
  }
}
