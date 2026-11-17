import type { Exam, Task, ClassSession } from "@/lib/types";
import type { ScannedDeadline } from "./scanner";

export interface DayStress {
  date: string; // "YYYY-MM-DD"
  dayName: string;
  dayOfWeek: number;
  score: number; // 0 - 20+
  status: "relax" | "moderate" | "collision";
  colorClass: string;
  accentHex: string;
  deadlines: { title: string; urgency: string; source: string }[];
  exams: string[];
  classesCount: number;
}

export interface StressMeterSummary {
  days: DayStress[];
  todayStress: DayStress;
  overallStatus: "relax" | "moderate" | "collision";
  collisionCount: number;
  relaxDaysCount: number;
  alertHeadline: string;
  alertDescription: string;
}

export function calculateDailyStress(
  startDate: Date = new Date(),
  daysCount: number = 30,
  scannedDeadlines: ScannedDeadline[] = [],
  exams: Exam[] = [],
  tasks: Task[] = [],
  timetable: ClassSession[] = []
): StressMeterSummary {
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days: DayStress[] = [];

  let totalCollisions = 0;
  let totalRelaxDays = 0;

  for (let i = 0; i < daysCount; i++) {
    const current = new Date(startDate.getTime() + i * 86400000);
    const dateStr = current.toISOString().split("T")[0];
    const dayOfWeek = current.getDay();

    // 1. Deadlines on this date from scanned emails
    const dayDeadlines = scannedDeadlines
      .filter((d) => d.detectedDate === dateStr)
      .map((d) => ({
        title: d.extractedTitle,
        urgency: d.urgency,
        source: `Email: ${d.sender}`,
        stress: d.stressScore,
      }));

    // 2. Tasks due on this date
    const dayTasks = tasks
      .filter((t) => t.dueDate === dateStr && t.status !== "done")
      .map((t) => ({
        title: t.title,
        urgency: t.priority,
        source: "Task Board",
        stress: t.priority === "high" ? 6 : t.priority === "medium" ? 4 : 2,
      }));

    // Combine deadlines
    const combinedDeadlines = [...dayDeadlines, ...dayTasks];

    // 3. Exams on this date
    const dayExams = exams
      .filter((e) => e.date.split("T")[0] === dateStr)
      .map((e) => e.title);

    // 4. Classes on this day of week
    const classesOnDay = timetable.filter((s) => s.dayOfWeek === dayOfWeek).length;

    // Calculate aggregated stress score
    const deadlineScore = combinedDeadlines.reduce((acc, curr) => acc + curr.stress, 0);
    const examScore = dayExams.length * 8; // Heavy weight for exams
    const classScore = classesOnDay > 0 ? Math.min(4, classesOnDay * 1) : 0;

    const totalScore = deadlineScore + examScore + classScore;

    let status: "relax" | "moderate" | "collision" = "relax";
    let colorClass = "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
    let accentHex = "#10b981";

    if (totalScore >= 7 || dayExams.length > 0 || combinedDeadlines.length >= 3) {
      status = "collision";
      colorClass = "bg-destructive/20 border-destructive/50 text-destructive font-bold";
      accentHex = "#ef4444";
      totalCollisions++;
    } else if (totalScore >= 3 || combinedDeadlines.length >= 1) {
      status = "moderate";
      colorClass = "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400";
      accentHex = "#f59e0b";
    } else {
      totalRelaxDays++;
    }

    days.push({
      date: dateStr,
      dayName: DAY_NAMES[dayOfWeek],
      dayOfWeek,
      score: totalScore,
      status,
      colorClass,
      accentHex,
      deadlines: combinedDeadlines,
      exams: dayExams,
      classesCount: classesOnDay,
    });
  }

  const todayStress = days[0];

  let overallStatus: "relax" | "moderate" | "collision" = "relax";
  let alertHeadline = "Time to relax — Cooling Day vibes!";
  let alertDescription = "Your schedule has no colliding deadlines today. Great time to recharge or review notes.";

  if (todayStress.status === "collision" || totalCollisions >= 3) {
    overallStatus = "collision";
    alertHeadline = "Collision Warning: Deadlines & Deliverables Colliding!";
    alertDescription = "High stress detected. Multiple assignments and exams require immediate task prioritization.";
  } else if (todayStress.status === "moderate") {
    overallStatus = "moderate";
    alertHeadline = "Active Academic Pace";
    alertDescription = "Moderate workload ahead. Keep up with your daily task list to prevent collisions.";
  }

  return {
    days,
    todayStress,
    overallStatus,
    collisionCount: totalCollisions,
    relaxDaysCount: totalRelaxDays,
    alertHeadline,
    alertDescription,
  };
}
