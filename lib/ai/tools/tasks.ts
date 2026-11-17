import type { Exam, Subject, Task } from "@/lib/types";

function daysUntil(dateIso?: string): number {
  if (!dateIso) return 999;
  const due = new Date(dateIso);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function priorityScore(task: Task, exams: Exam[], subjects: Subject[]): number {
  let score = 0;
  const priorityWeight = { high: 30, medium: 15, low: 5 };
  score += priorityWeight[task.priority];

  const dueIn = daysUntil(task.dueDate);
  if (dueIn <= 1) score += 40;
  else if (dueIn <= 3) score += 25;
  else if (dueIn <= 7) score += 10;

  if (task.subjectId) {
    const subject = subjects.find((s) => s.id === task.subjectId);
    if (subject && subject.total > 0) {
      const percent = (subject.attended / subject.total) * 100;
      if (percent < 75) score += 10;
    }

    const upcomingExam = exams
      .filter((exam) => exam.subjectId === task.subjectId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    if (upcomingExam) {
      const examIn = daysUntil(upcomingExam.date);
      if (examIn <= 7) score += 20;
      if (upcomingExam.weight === "high") score += 10;
    }
  }

  if (task.status === "doing") score += 8;
  return score;
}

export function rankTasks(tasks: Task[], exams: Exam[], subjects: Subject[]) {
  return tasks
    .filter((task) => task.status !== "done")
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      priority: task.priority,
      reason: buildReason(task, exams, subjects),
      score: priorityScore(task, exams, subjects),
    }))
    .sort((a, b) => b.score - a.score);
}

function buildReason(task: Task, exams: Exam[], subjects: Subject[]): string {
  const parts: string[] = [];
  const dueIn = daysUntil(task.dueDate);
  if (task.dueDate) {
    parts.push(dueIn <= 0 ? "Due today or overdue" : `Due in ${dueIn} day(s)`);
  }
  parts.push(`${task.priority} priority`);
  if (task.subjectId) {
    const subject = subjects.find((s) => s.id === task.subjectId);
    if (subject) parts.push(`for ${subject.name}`);
    const exam = exams.find((e) => e.subjectId === task.subjectId);
    if (exam) parts.push(`exam on ${exam.date.split("T")[0]}`);
  }
  return parts.join("; ");
}

export function buildTaskPrioritySummary(
  tasks: Task[],
  exams: Exam[],
  subjects: Subject[]
) {
  return rankTasks(tasks, exams, subjects).slice(0, 5);
}
