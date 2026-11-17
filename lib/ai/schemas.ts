import { z } from "zod";

export const studyPlanBlockSchema = z.object({
  date: z.string(),
  subjectId: z.string().optional(),
  topic: z.string(),
  durationMinutes: z.number().int().positive(),
});

export const studyPlanSchema = z.object({
  summary: z.string(),
  blocks: z.array(studyPlanBlockSchema).min(1),
});

export const taskPrioritySchema = z.object({
  taskId: z.string(),
  title: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  reason: z.string(),
});

export const taskPriorityListSchema = z.array(taskPrioritySchema).min(1);

export function parseStudyPlan(raw: string) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { ok: false as const, error: "No JSON study plan found in model output." };
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const validated = studyPlanSchema.safeParse(parsed);
    if (!validated.success) {
      return { ok: false as const, error: validated.error.message };
    }
    return { ok: true as const, data: validated.data };
  } catch {
    return { ok: false as const, error: "Study plan JSON could not be parsed." };
  }
}

export function parseTaskPriorities(raw: string) {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return { ok: false as const, error: "No JSON task priority list found in model output." };
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const validated = taskPriorityListSchema.safeParse(parsed);
    if (!validated.success) {
      return { ok: false as const, error: validated.error.message };
    }
    return { ok: true as const, data: validated.data };
  } catch {
    return { ok: false as const, error: "Task priority JSON could not be parsed." };
  }
}
