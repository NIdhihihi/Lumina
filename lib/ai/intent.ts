import type { CopilotIntent } from "@/lib/types";

const INTENT_RULES: { intent: CopilotIntent; patterns: RegExp[] }[] = [
  {
    intent: "attendance",
    patterns: [
      /\battendance\b/i,
      /\bbunk(s)?\b/i,
      /\bmiss(ing|)\b.*\b(class|lecture|session)\b/i,
      /\bcan i skip\b/i,
      /\bsafe to miss\b/i,
      /\bpresent\b/i,
      /\babsent\b/i,
    ],
  },
  {
    intent: "document",
    patterns: [
      /\b(document|pdf|policy|syllabus|handbook|uploaded)\b/i,
      /\bwhat (does|is) (the|my)\b.*\b(requirement|policy|rule)\b/i,
      /\bminimum attendance\b/i,
      /\baccording to (the|my)\b/i,
    ],
  },
  {
    intent: "study_plan",
    patterns: [
      /\bstudy plan\b/i,
      /\bprepare for (my )?exams?\b/i,
      /\bexam prep\b/i,
      /\bschedule (my )?study\b/i,
      /\bcreate a plan\b/i,
    ],
  },
  {
    intent: "task_priority",
    patterns: [
      /\bpriorit(y|ize|ise)\b/i,
      /\bwhich task\b/i,
      /\bwhat should i do first\b/i,
      /\bmost important task\b/i,
      /\btask order\b/i,
    ],
  },
];

export function classifyIntent(message: string): CopilotIntent {
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(message))) {
      return rule.intent;
    }
  }
  return "general";
}

export function extractSubjectHint(message: string): string | undefined {
  const quoted = message.match(/["']([^"']+)["']/);
  if (quoted?.[1]) return quoted[1];

  const tomorrowMatch = message.match(/\b(?:for|in|of)\s+([A-Za-z0-9 &.-]{2,40})\b/i);
  return tomorrowMatch?.[1];
}

export function extractMissingClassCount(message: string): number {
  if (/\btomorrow\b/i.test(message)) return 1;
  const numeric = message.match(/\b(\d+)\s+(class|classes|lecture|lectures)\b/i);
  if (numeric) return Number(numeric[1]);
  return 1;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function extractDayOfWeek(message: string): number | undefined {
  const lower = message.toLowerCase();
  const index = DAY_NAMES.findIndex((day) => lower.includes(day));
  return index >= 0 ? index : undefined;
}

export function extractTomorrowDayOfWeek(reference = new Date()): number {
  const tomorrow = new Date(reference);
  tomorrow.setDate(reference.getDate() + 1);
  return tomorrow.getDay();
}
