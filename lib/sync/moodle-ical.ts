export interface MoodleEvent {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  courseName: string;
  type: "assignment" | "quiz" | "exam" | "lab" | "deadline";
  urgency: "high" | "medium" | "low";
}

/**
 * Parses RFC 5545 iCalendar date strings into standard ISO date (YYYY-MM-DD)
 * Examples: 20261122T182900Z, 20261122T182900, 20261122
 */
export function parseIcalDate(rawStr: string): { date: string; time?: string } {
  const clean = rawStr.replace(/^.*:/, "").trim();
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?/);

  if (!match) {
    const today = new Date().toISOString().split("T")[0];
    return { date: today };
  }

  const [, year, month, day, hours, minutes] = match;
  const date = `${year}-${month}-${day}`;
  const time = hours && minutes ? `${hours}:${minutes}` : undefined;

  return { date, time };
}

/**
 * Parses raw iCalendar (.ics) content exported from any college Moodle instance.
 * Zero administrator permissions required.
 */
export function parseMoodleIcal(rawIcalText: string): MoodleEvent[] {
  if (!rawIcalText || !rawIcalText.includes("BEGIN:VEVENT")) {
    return [];
  }

  const events: MoodleEvent[] = [];
  // Unfold folded lines according to RFC 5545 (lines starting with space or tab)
  const unfolded = rawIcalText.replace(/\r?\n[ \t]/g, "");
  const eventBlocks = unfolded.split("BEGIN:VEVENT");

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split("END:VEVENT")[0];
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let uid = "";
    let summary = "";
    let description = "";
    let dtstart = "";
    let dtend = "";
    let categories = "";

    for (const line of lines) {
      if (line.startsWith("UID:")) uid = line.slice(4).trim();
      else if (line.startsWith("SUMMARY:")) summary = line.slice(8).trim();
      else if (line.startsWith("DESCRIPTION:")) description = line.slice(12).trim().replace(/\\n/g, "\n").replace(/\\,/g, ",");
      else if (line.startsWith("DTSTART")) dtstart = line;
      else if (line.startsWith("DTEND")) dtend = line;
      else if (line.startsWith("CATEGORIES:")) categories = line.slice(11).trim();
    }

    if (!summary) continue;

    const rawDateStr = dtend || dtstart;
    const { date, time } = parseIcalDate(rawDateStr);

    // Extract course name (often formatted like "CS301: Assignment 2" or "[CS301] Quiz")
    let courseName = "Coursework";
    const courseMatch = summary.match(/^\[?([A-Za-z]{2,4}[\s-]?[0-9]{3,4})\]?[:\s-]+/);
    if (courseMatch) {
      courseName = courseMatch[1].toUpperCase();
    }

    // Determine deadline category with priority matching
    const catLower = categories.toLowerCase();
    const sumLower = summary.toLowerCase();
    const descLower = description.toLowerCase();

    let type: MoodleEvent["type"] = "deadline";
    let urgency: MoodleEvent["urgency"] = "medium";

    if (catLower.includes("assign") || sumLower.includes("assign") || sumLower.includes("homework")) {
      type = "assignment";
      urgency = "medium";
    } else if (catLower.includes("quiz") || sumLower.includes("quiz") || /\btest\b/i.test(sumLower)) {
      type = "quiz";
      urgency = "high";
    } else if (catLower.includes("lab") || sumLower.includes("lab") || sumLower.includes("practical") || sumLower.includes("viva")) {
      type = "lab";
      urgency = "high";
    } else if (catLower.includes("exam") || sumLower.includes("exam") || sumLower.includes("midterm") || sumLower.includes("endsem")) {
      type = "exam";
      urgency = "high";
    } else if (descLower.includes("exam") || descLower.includes("midterm")) {
      type = "exam";
      urgency = "high";
    } else if (descLower.includes("submission") || descLower.includes("upload")) {
      type = "assignment";
      urgency = "medium";
    }

    events.push({
      id: uid || `moodle-evt-${events.length + 1}`,
      title: summary,
      description: description.slice(0, 300),
      dueDate: date,
      dueTime: time,
      courseName,
      type,
      urgency,
    });
  }

  // Sort chronologically by due date
  return events.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Sample real-world Moodle .ics feed for demo & offline testing
 */
export const SAMPLE_MOODLE_ICAL_FEED = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Moodle Pty Ltd//NONSGML Moodle 2026//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:assign_401@moodle.engineering.edu
SUMMARY:[CS301] Assignment 3: Lexical & Syntax Analyzer Due
DESCRIPTION:Upload your flex/bison specifications and test outputs as a zip archive before 11:59 PM.
DTSTART:20261122T182900Z
DTEND:20261122T182900Z
CATEGORIES:Assignment
END:VEVENT
BEGIN:VEVENT
UID:quiz_402@moodle.engineering.edu
SUMMARY:[CS304] Mid-Semester Online Quiz (Operating Systems)
DESCRIPTION:20 multiple choice questions covering Deadlocks, Memory Management and Paging. Duration: 30 minutes.
DTSTART:20261124T093000Z
DTEND:20261124T100000Z
CATEGORIES:Quiz
END:VEVENT
BEGIN:VEVENT
UID:lab_403@moodle.engineering.edu
SUMMARY:[EE301] DSP Hardware Lab Report & ModelSim Simulation Submission
DESCRIPTION:Submit compiled lab report with oscilloscope waveforms and signed Bode plots.
DTSTART:20261125T113000Z
DTEND:20261125T113000Z
CATEGORIES:Lab Report
END:VEVENT
END:VCALENDAR`;
