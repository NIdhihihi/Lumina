export interface AcademicEmail {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  source: "gmail" | "moodle" | "university_portal";
  isRead?: boolean;
}

export interface ScannedDeadline {
  emailId: string;
  sender: string;
  matchedKeywords: string[];
  urgency: "high" | "medium" | "low";
  subjectHint?: string;
  detectedDate: string; // "YYYY-MM-DD"
  extractedTitle: string;
  stressScore: number;  // 1 to 10
}

const ACADEMIC_KEYWORDS = [
  { word: "exam", weight: 9, urgency: "high" as const },
  { word: "midterm", weight: 8, urgency: "high" as const },
  { word: "final", weight: 9, urgency: "high" as const },
  { word: "viva", weight: 8, urgency: "high" as const },
  { word: "quiz", weight: 6, urgency: "high" as const },
  { word: "assignment", weight: 4, urgency: "medium" as const },
  { word: "submission", weight: 5, urgency: "medium" as const },
  { word: "deadline", weight: 5, urgency: "medium" as const },
  { word: "lab report", weight: 4, urgency: "medium" as const },
  { word: "project phase", weight: 5, urgency: "medium" as const },
  { word: "due", weight: 3, urgency: "medium" as const },
  { word: "homework", weight: 3, urgency: "low" as const },
];

const COURSE_REGEX = /\b([A-Z]{2,4}[\s-]?\d{3,4})\b/i;

// Parse date expressions from email text
function extractDateFromText(text: string, referenceDate: Date = new Date()): string {
  // Format 1: YYYY-MM-DD
  const isoMatch = text.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  // Format 2: Month Day (e.g., Nov 20, November 25, Apr 18)
  const monthMatch = text.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s.]+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(202\d))?\b/i
  );
  if (monthMatch) {
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIdx = monthNames.findIndex((m) => monthMatch[1].toLowerCase().startsWith(m));
    const day = parseInt(monthMatch[2], 10);
    const year = monthMatch[3] ? parseInt(monthMatch[3], 10) : referenceDate.getFullYear();

    const dateObj = new Date(year, monthIdx, day);
    const m = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const d = dateObj.getDate().toString().padStart(2, "0");
    return `${dateObj.getFullYear()}-${m}-${d}`;
  }

  // Format 3: "in X days"
  const inDaysMatch = text.match(/\bin\s+(\d+)\s+days?\b/i);
  if (inDaysMatch) {
    const daysToAdd = parseInt(inDaysMatch[1], 10);
    const future = new Date(referenceDate.getTime() + daysToAdd * 86400000);
    return future.toISOString().split("T")[0];
  }

  // Format 4: "tomorrow"
  if (/\btomorrow\b/i.test(text)) {
    const tomorrow = new Date(referenceDate.getTime() + 86400000);
    return tomorrow.toISOString().split("T")[0];
  }

  // Fallback to 3 days from now
  const fallback = new Date(referenceDate.getTime() + 3 * 86400000);
  return fallback.toISOString().split("T")[0];
}

export function scanEmailForDeadlines(
  email: AcademicEmail,
  referenceDate: Date = new Date()
): ScannedDeadline | null {
  const combined = `${email.subject} ${email.snippet}`.toLowerCase();
  const matched: string[] = [];
  let maxWeight = 0;
  let highestUrgency: "high" | "medium" | "low" = "low";

  for (const { word, weight, urgency } of ACADEMIC_KEYWORDS) {
    if (combined.includes(word)) {
      matched.push(word);
      if (weight > maxWeight) {
        maxWeight = weight;
        highestUrgency = urgency;
      }
    }
  }

  if (matched.length === 0) return null;

  // Extract course code
  const courseMatch = `${email.subject} ${email.snippet}`.match(COURSE_REGEX);
  const subjectHint = courseMatch ? courseMatch[1].toUpperCase() : undefined;

  const detectedDate = extractDateFromText(`${email.subject} ${email.snippet}`, referenceDate);

  return {
    emailId: email.id,
    sender: email.sender,
    matchedKeywords: matched,
    urgency: highestUrgency,
    subjectHint,
    detectedDate,
    extractedTitle: email.subject,
    stressScore: Math.min(10, Math.max(1, maxWeight)),
  };
}

export function scanEmailBatch(
  emails: AcademicEmail[],
  referenceDate: Date = new Date()
): ScannedDeadline[] {
  const results: ScannedDeadline[] = [];
  for (const email of emails) {
    const scanned = scanEmailForDeadlines(email, referenceDate);
    if (scanned) results.push(scanned);
  }
  return results;
}
