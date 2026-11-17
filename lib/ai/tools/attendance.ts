import type { Subject } from "@/lib/types";

const DEFAULT_THRESHOLD = 75;

export function currentAttendancePercent(subject: Subject): number {
  if (subject.total <= 0) return 0;
  return Math.round((subject.attended / subject.total) * 1000) / 10;
}

export function projectedAttendance(subject: Subject, missingClasses: number): number {
  const missed = Math.max(0, missingClasses);
  const newTotal = subject.total + missed;
  if (newTotal <= 0) return 0;
  return Math.round((subject.attended / newTotal) * 1000) / 10;
}

export function classesCanMiss(subject: Subject, targetPercent: number = DEFAULT_THRESHOLD): number {
  if (subject.total <= 0) return 0;
  const ratio = targetPercent / 100;
  if (ratio <= 0) return 0;
  const canMiss = Math.floor(subject.attended / ratio - subject.total);
  return Math.max(0, canMiss);
}

export function classesNeededToReachTarget(subject: Subject, targetPercent: number = DEFAULT_THRESHOLD): number {
  if (currentAttendancePercent(subject) >= targetPercent) return 0;

  let attended = subject.attended;
  let total = subject.total;
  let needed = 0;

  while (total === 0 || (attended / total) * 100 < targetPercent) {
    attended += 1;
    total += 1;
    needed += 1;
    if (needed > 500) break;
  }

  return needed;
}

export function attendanceRiskLevel(
  percent: number,
  threshold: number = DEFAULT_THRESHOLD
): "safe" | "warning" | "critical" {
  if (percent >= threshold) return "safe";
  if (percent >= threshold - 5) return "warning";
  return "critical";
}

export function findSubjectByName(subjects: Subject[], query: string): Subject | undefined {
  const normalized = query.toLowerCase().trim();
  return subjects.find(
    (s) =>
      s.name.toLowerCase().includes(normalized) ||
      (s.code && s.code.toLowerCase().includes(normalized))
  );
}

export function countClassesOnDay(
  timetable: { subjectId: string; dayOfWeek: number }[],
  dayOfWeek: number,
  subjectId?: string
): number {
  return timetable.filter(
    (session) =>
      session.dayOfWeek === dayOfWeek &&
      (subjectId ? session.subjectId === subjectId : true)
  ).length;
}
