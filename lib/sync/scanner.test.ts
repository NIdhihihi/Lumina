import { describe, expect, it } from "vitest";
import { scanEmailForDeadlines, type AcademicEmail } from "./scanner";
import { calculateDailyStress } from "./stress-meter";

describe("academic email keyword scanner & stress meter", () => {
  const sampleEmail: AcademicEmail = {
    id: "mail-1",
    sender: "Prof. Sharma (CS301)",
    subject: "CS301 Midterm Exam and Assignment Due Date",
    snippet: "Please note that the DBMS assignment submission is due on 2026-11-20. Midterm exam will be held next week.",
    receivedAt: "2026-11-17T10:00:00Z",
    source: "gmail",
  };

  it("extracts academic keywords, course code, and urgency", () => {
    const result = scanEmailForDeadlines(sampleEmail);
    expect(result).not.toBeNull();
    expect(result?.matchedKeywords).toContain("exam");
    expect(result?.matchedKeywords).toContain("assignment");
    expect(result?.urgency).toBe("high");
    expect(result?.subjectHint).toBe("CS301");
    expect(result?.detectedDate).toBe("2026-11-20");
    expect(result?.stressScore).toBeGreaterThanOrEqual(8);
  });

  it("ignores non-academic casual emails", () => {
    const casualEmail: AcademicEmail = {
      id: "mail-2",
      sender: "Canteen Committee",
      subject: "New snacks menu available",
      snippet: "Check out the fresh sandwich options at the campus cafeteria.",
      receivedAt: "2026-11-17T11:00:00Z",
      source: "gmail",
    };
    const result = scanEmailForDeadlines(casualEmail);
    expect(result).toBeNull();
  });

  it("computes daily stress score and flags red when deadlines collide", () => {
    const today = new Date("2026-11-17T00:00:00Z");
    const scanned = scanEmailForDeadlines(sampleEmail, today);
    const scannedList = scanned ? [scanned] : [];

    const summary = calculateDailyStress(today, 7, scannedList, [], [], []);
    expect(summary.days.length).toBe(7);

    // Day 0 (today) has zero deadlines -> should be "relax" (green)
    expect(summary.todayStress.status).toBe("relax");

    // Day 3 (2026-11-20) has the scanned exam/assignment -> should be "collision" (red)
    const collisionDay = summary.days.find((d) => d.date === "2026-11-20");
    expect(collisionDay?.status).toBe("collision");
    expect(collisionDay?.accentHex).toBe("#ef4444");
  });
});
