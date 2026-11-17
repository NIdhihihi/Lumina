import { buildAcademicContext, formatContextForPrompt } from "@/lib/ai/context";
import {
  classifyIntent,
  extractDayOfWeek,
  extractMissingClassCount,
  extractSubjectHint,
  extractTomorrowDayOfWeek,
} from "@/lib/ai/intent";
import { generateCompletion, type ChatMessage } from "@/lib/ai/provider";
import { parseStudyPlan, parseTaskPriorities } from "@/lib/ai/schemas";
import { wrapRetrievedContent } from "@/lib/ai/rag/guard";
import { chunksToCitations, retrieveRelevantChunks } from "@/lib/ai/rag/retrieval";
import {
  attendanceRiskLevel,
  classesCanMiss,
  classesNeededToReachTarget,
  countClassesOnDay,
  currentAttendancePercent,
  findSubjectByName,
  projectedAttendance,
} from "@/lib/ai/tools/attendance";
import { buildTaskPrioritySummary } from "@/lib/ai/tools/tasks";
import type {
  CopilotIntent,
  SourceCitation,
  StudyPlanOutput,
  TaskPriorityOutput,
} from "@/lib/types";

export type OrchestratorResult = {
  intent: CopilotIntent;
  response: string;
  sources: SourceCitation[];
  studyPlan?: StudyPlanOutput;
  taskPriorities?: TaskPriorityOutput[];
  recommendation?: string;
  aiUnavailable?: boolean;
  toolData?: Record<string, unknown>;
};

const ATTENDANCE_THRESHOLD = 75;

function buildAttendanceToolData(message: string, context: ReturnType<typeof buildAcademicContext>) {
  const hint = extractSubjectHint(message) || message;
  const subject =
    findSubjectByName(context.subjects, hint) ||
    context.subjects.find((s) => /toc|theory of computation/i.test(s.name)) ||
    context.subjects[0];

  if (!subject) {
    return { error: "No attendance subjects found." };
  }

  const missingClasses = extractMissingClassCount(message);
  const day =
    extractDayOfWeek(message) ??
    (/tomorrow/i.test(message) ? extractTomorrowDayOfWeek(new Date(context.currentDate)) : undefined);

  const classesOnDay = day !== undefined
    ? countClassesOnDay(context.timetable, day, subject.id)
    : 0;

  const effectiveMissing = classesOnDay > 0 ? classesOnDay : missingClasses;
  const current = currentAttendancePercent(subject);
  const projected = projectedAttendance(subject, effectiveMissing);
  const safeBunks = classesCanMiss(subject, ATTENDANCE_THRESHOLD);
  const needed = classesNeededToReachTarget(subject, ATTENDANCE_THRESHOLD);
  const risk = attendanceRiskLevel(current, ATTENDANCE_THRESHOLD);

  return {
    subject: subject.name,
    subjectId: subject.id,
    currentPercent: current,
    projectedPercent: projected,
    missingClasses: effectiveMissing,
    classesOnSelectedDay: classesOnDay,
    safeBunksRemaining: safeBunks,
    classesNeededForTarget: needed,
    riskLevel: risk,
    threshold: ATTENDANCE_THRESHOLD,
  };
}

function buildRecommendation(context: ReturnType<typeof buildAcademicContext>): string | undefined {
  const risky = context.subjects
    .map((subject) => ({
      subject,
      percent: currentAttendancePercent(subject),
    }))
    .filter((item) => item.percent < ATTENDANCE_THRESHOLD)
    .sort((a, b) => a.percent - b.percent)[0];

  if (risky) {
    return `${risky.subject.name} is at ${risky.percent}% attendance. Consider attending upcoming classes before skipping.`;
  }

  const nextExam = [...context.exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )[0];
  if (nextExam) {
    return `Your next exam is ${nextExam.title} on ${nextExam.date.split("T")[0]}. Block focused study time this week.`;
  }

  return undefined;
}

export async function runCopilot(message: string): Promise<OrchestratorResult> {
  const intent = classifyIntent(message);
  const context = buildAcademicContext(intent);
  let sources: SourceCitation[] = [];
  let toolData: Record<string, unknown> | undefined;
  let studyPlan: StudyPlanOutput | undefined;
  let taskPriorities: TaskPriorityOutput[] | undefined;

  const systemParts = [
    "You are Lumina, an academic copilot for a student.",
    "Explain results clearly in plain language.",
    "Never invent attendance percentages or policy facts when tool results or retrieved documents are provided.",
    "If deterministic tool output is present, explain it without recalculating the numbers.",
  ];

  if (intent === "attendance") {
    toolData = buildAttendanceToolData(message, context);
    systemParts.push("Deterministic attendance tool output:", JSON.stringify(toolData, null, 2));
  }

  if (intent === "document" || intent === "study_plan") {
    const retrieval = await retrieveRelevantChunks(message, 4);
    if (retrieval.error) {
      return {
        intent,
        response: retrieval.error,
        sources: [],
        aiUnavailable: true,
      };
    }
    sources = chunksToCitations(retrieval.chunks);
    if (retrieval.chunks.length > 0) {
      systemParts.push(
        wrapRetrievedContent(retrieval.chunks.map((chunk) => chunk.text))
      );
    }
  }

  if (intent === "study_plan") {
    systemParts.push(
      "Return a JSON study plan object with shape {\"summary\": string, \"blocks\": [{\"date\": string, \"subjectId\": string?, \"topic\": string, \"durationMinutes\": number}]}.",
      "Academic context:",
      formatContextForPrompt(context)
    );
  }

  if (intent === "task_priority") {
    const ranked = buildTaskPrioritySummary(context.tasks, context.exams, context.subjects);
    taskPriorities = ranked.map(({ taskId, title, priority, reason }) => ({
      taskId,
      title,
      priority,
      reason,
    }));
    systemParts.push(
      "Deterministic task ranking:",
      JSON.stringify(taskPriorities, null, 2),
      "Explain the ranking briefly. Also return the same JSON array."
    );
  }

  if (intent === "general") {
    systemParts.push("Academic context:", formatContextForPrompt(context));
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemParts.join("\n\n") },
    { role: "user", content: message },
  ];

  const completion = await generateCompletion(messages, { maxTokens: 1200 });
  if (!completion.ok) {
    return {
      intent,
      response: completion.error,
      sources,
      taskPriorities,
      aiUnavailable: true,
      toolData,
    };
  }

  if (intent === "study_plan") {
    const parsed = parseStudyPlan(completion.content);
    if (parsed.ok) studyPlan = parsed.data;
  }

  if (intent === "task_priority" && !taskPriorities) {
    const parsed = parseTaskPriorities(completion.content);
    if (parsed.ok) taskPriorities = parsed.data;
  }

  const recommendation = buildRecommendation(context);

  return {
    intent,
    response: completion.content,
    sources,
    studyPlan,
    taskPriorities,
    recommendation,
    toolData,
  };
}
