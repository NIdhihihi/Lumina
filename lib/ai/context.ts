import { readJSON } from "@/server/db";
import type {
  AcademicContext,
  ClassSession,
  CopilotIntent,
  Exam,
  Note,
  Subject,
  Task,
} from "@/lib/types";

const ATTENDANCE_FILE = "attendance.json";
const TIMETABLE_FILE = "timetable.json";
const EXAMS_FILE = "exams.json";
const TASKS_FILE = "tasks.json";
const NOTES_FILE = "notes.json";

function trimNotes(notes: Note[]): Note[] {
  return notes.map(({ id, title, content, createdAt, subjectId, attachments }) => ({
    id,
    title,
    content,
    createdAt,
    subjectId,
    attachments: attachments?.map(({ name, approxPage }) => ({ name, textContent: "", approxPage })),
  }));
}

export function buildAcademicContext(
  intent: CopilotIntent,
  params: { studentName?: string } = {}
): AcademicContext {
  const currentDate = new Date().toISOString();
  const studentProfile = { name: params.studentName || "Student" };

  switch (intent) {
    case "attendance": {
      const subjects = readJSON<Subject[]>(ATTENDANCE_FILE, []);
      const timetable = readJSON<ClassSession[]>(TIMETABLE_FILE, []);
      return {
        studentProfile,
        subjects,
        timetable,
        exams: [],
        tasks: [],
        notes: [],
        currentDate,
      };
    }
    case "document": {
      const notes = readJSON<Note[]>(NOTES_FILE, []);
      return {
        studentProfile,
        subjects: [],
        timetable: [],
        exams: [],
        tasks: [],
        notes: trimNotes(notes),
        currentDate,
      };
    }
    case "study_plan": {
      const subjects = readJSON<Subject[]>(ATTENDANCE_FILE, []);
      const timetable = readJSON<ClassSession[]>(TIMETABLE_FILE, []);
      const exams = readJSON<Exam[]>(EXAMS_FILE, []);
      const tasks = readJSON<Task[]>(TASKS_FILE, []);
      const notes = readJSON<Note[]>(NOTES_FILE, []);
      return {
        studentProfile,
        subjects,
        timetable,
        exams,
        tasks,
        notes: trimNotes(notes),
        currentDate,
      };
    }
    case "task_priority": {
      const tasks = readJSON<Task[]>(TASKS_FILE, []);
      const exams = readJSON<Exam[]>(EXAMS_FILE, []);
      const subjects = readJSON<Subject[]>(ATTENDANCE_FILE, []);
      return {
        studentProfile,
        subjects,
        timetable: [],
        exams,
        tasks,
        notes: [],
        currentDate,
      };
    }
    case "general":
    default: {
      const subjects = readJSON<Subject[]>(ATTENDANCE_FILE, []);
      const tasks = readJSON<Task[]>(TASKS_FILE, []);
      return {
        studentProfile,
        subjects,
        timetable: [],
        exams: [],
        tasks,
        notes: [],
        currentDate,
      };
    }
  }
}

export function formatContextForPrompt(context: AcademicContext): string {
  return JSON.stringify(context, null, 2);
}
