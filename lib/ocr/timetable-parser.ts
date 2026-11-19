import type { ClassSession } from "@/lib/types";

export interface ParsedTimetableEntry {
  id: string;
  subjectName: string;
  subjectCode?: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  location?: string;
}

const DAY_NAMES = [
  { name: "sunday", day: 0 as const, aliases: ["sun"] },
  { name: "monday", day: 1 as const, aliases: ["mon"] },
  { name: "tuesday", day: 2 as const, aliases: ["tue", "tues"] },
  { name: "wednesday", day: 3 as const, aliases: ["wed"] },
  { name: "thursday", day: 4 as const, aliases: ["thu", "thur", "thurs"] },
  { name: "friday", day: 5 as const, aliases: ["fri"] },
  { name: "saturday", day: 6 as const, aliases: ["sat"] },
];

function normalizeTime(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? match[2].padStart(2, "0") : "00";
  const meridian = match[3] ? match[3].toLowerCase() : null;

  if (meridian === "pm" && hours < 12) hours += 12;
  if (meridian === "am" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

export async function extractTextFromImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });
  return result.data.text;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // Dynamic import of pdfjs-dist to keep client bundles clean
  const pdfjs = await import("pdfjs-dist");
  
  // Set standard worker configuration if available
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .filter(Boolean);
    fullText += strings.join(" ") + "\n";
  }

  return fullText;
}

export function parseTimetableText(rawText: string): ParsedTimetableEntry[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const entries: ParsedTimetableEntry[] = [];
  let currentDay: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1; // default Monday

  const timeRangeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–|—)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
  const singleTimeRegex = /(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i;
  const roomRegex = /\b(?:room|hall|lab|rm|lh|lt|audi)[\s-]*([a-z0-9\-]+)\b/i;
  const courseCodeRegex = /\b([A-Z]{2,4}[\s-]?\d{3,4})\b/;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if line sets a new day of the week
    const matchedDay = DAY_NAMES.find(
      (d) =>
        lowerLine.startsWith(d.name) ||
        lowerLine === d.name ||
        d.aliases.some((alias) => new RegExp(`\\b${alias}\\b`, "i").test(line))
    );

    if (matchedDay) {
      currentDay = matchedDay.day;
    }

    // Check for time ranges in the line
    const timeMatch = line.match(timeRangeRegex);
    if (timeMatch) {
      const rawStart = timeMatch[1];
      const rawEnd = timeMatch[2];
      const startTime = normalizeTime(rawStart);
      const endTime = normalizeTime(rawEnd);

      // Extract room/location if present
      const roomMatch = line.match(roomRegex);
      const location = roomMatch ? roomMatch[0].trim() : undefined;

      // Extract subject code if present
      const codeMatch = line.match(courseCodeRegex);
      const subjectCode = codeMatch ? codeMatch[1].replace(/\s+/g, "") : undefined;

      // Clean subject title by removing matched time, room, and course code
      let cleaned = line
        .replace(timeMatch[0], "")
        .replace(roomRegex, "")
        .replace(courseCodeRegex, "")
        .replace(/^[-\s|:;,.]+/, "")
        .replace(/[-\s|:;,.]+$/, "")
        .trim();

      // Remove day word if line started with it
      for (const d of DAY_NAMES) {
        cleaned = cleaned.replace(new RegExp(`^${d.name}[:\\s-]*`, "i"), "");
        for (const alias of d.aliases) {
          cleaned = cleaned.replace(new RegExp(`^${alias}[:\\s-]*`, "i"), "");
        }
      }
      cleaned = cleaned.trim();

      const subjectName = cleaned || (subjectCode ? `Course ${subjectCode}` : "Lecture");

      entries.push({
        id: `parsed-${Date.now()}-${entries.length}`,
        subjectName,
        subjectCode,
        dayOfWeek: currentDay,
        startTime,
        endTime,
        location,
      });
      continue;
    }

    // Also handle single time format if line mentions class/lecture
    const singleMatch = line.match(singleTimeRegex);
    if (singleMatch && (lowerLine.includes("class") || lowerLine.includes("lecture") || lowerLine.includes("lab"))) {
      const startTime = normalizeTime(singleMatch[1]);
      const [h, m] = startTime.split(":").map(Number);
      const endH = (h + 1) % 24;
      const endTime = `${endH.toString().padStart(2, "0")}:${(m || 0).toString().padStart(2, "0")}`;

      const roomMatch = line.match(roomRegex);
      const location = roomMatch ? roomMatch[0].trim() : undefined;
      const codeMatch = line.match(courseCodeRegex);

      entries.push({
        id: `parsed-${Date.now()}-${entries.length}`,
        subjectName: line.replace(singleMatch[0], "").replace(roomRegex, "").trim() || "Lecture",
        subjectCode: codeMatch ? codeMatch[1] : undefined,
        dayOfWeek: currentDay,
        startTime,
        endTime,
        location,
      });
    }
  }

  return entries;
}

export interface ExtractedSubject {
  name: string;
  code?: string;
  color: string;
  type: "college";
  sessionCount: number;
}

const PALETTE = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#14b8a6", // teal
];

/**
 * Extracts distinct subjects from parsed timetable slots for automatic
 * synchronization into the 75% Attendance Tracker.
 */
export function extractUniqueSubjects(entries: ParsedTimetableEntry[]): ExtractedSubject[] {
  const subjectMap = new Map<string, ExtractedSubject>();

  for (const entry of entries) {
    const rawName = entry.subjectName.trim() || entry.subjectCode || "Class";
    const key = rawName.toLowerCase();

    if (!subjectMap.has(key)) {
      const color = PALETTE[subjectMap.size % PALETTE.length];
      subjectMap.set(key, {
        name: rawName,
        code: entry.subjectCode,
        color,
        type: "college",
        sessionCount: 1,
      });
    } else {
      const existing = subjectMap.get(key)!;
      existing.sessionCount += 1;
      if (!existing.code && entry.subjectCode) {
        existing.code = entry.subjectCode;
      }
    }
  }

  return Array.from(subjectMap.values());
}
