export interface ClassroomCoursework {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  urgency: "high" | "medium" | "low";
  type: "assignment" | "coursework";
}

export function parseGoogleClassroomItem(
  item: any,
  courseName = "Google Classroom"
): ClassroomCoursework {
  let dueDate = new Date().toISOString().split("T")[0];
  let dueTime: string | undefined = undefined;

  if (item.dueDate) {
    const y = item.dueDate.year || new Date().getFullYear();
    const m = String(item.dueDate.month || 1).padStart(2, "0");
    const d = String(item.dueDate.day || 1).padStart(2, "0");
    dueDate = `${y}-${m}-${d}`;
  }

  if (item.dueTime) {
    const h = String(item.dueTime.hours ?? 23).padStart(2, "0");
    const min = String(item.dueTime.minutes ?? 59).padStart(2, "0");
    dueTime = `${h}:${min}`;
  }

  const title = item.title || "Classroom Assignment";
  const desc = item.description || "";
  const lower = `${title} ${desc}`.toLowerCase();
  const urgency = lower.includes("exam") || lower.includes("quiz") || lower.includes("final") ? "high" : "medium";

  return {
    id: String(item.id || `gc-${Date.now()}`),
    courseId: String(item.courseId || "default"),
    courseName,
    title,
    description: desc.slice(0, 300),
    dueDate,
    dueTime,
    urgency,
    type: "assignment",
  };
}

export const SAMPLE_GOOGLE_CLASSROOM_DATA = [
  {
    id: "gc-101",
    courseId: "c-cs301",
    courseName: "CS301: Compiler Design",
    title: "Project Milestone 1: LL(1) Parser Implementation",
    description: "Submit your grammar tables, FIRST & FOLLOW sets calculation code in Python/C++.",
    dueDate: { year: 2026, month: 11, day: 23 },
    dueTime: { hours: 23, minutes: 59 },
  },
  {
    id: "gc-102",
    courseId: "c-cs303",
    courseName: "CS303: Database Management Systems",
    title: "SQL & B+ Tree Indexing Homework",
    description: "Complete query optimization exercises from chapter 14.",
    dueDate: { year: 2026, month: 11, day: 26 },
    dueTime: { hours: 17, minutes: 0 },
  },
];
