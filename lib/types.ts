export interface NoteAttachment {
  name: string;
  textContent: string;
  approxPage?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  subjectId?: string;
  attachments?: NoteAttachment[];
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  attended: number;
  total: number;
  color?: string;
  schedule?: { day: number; time: string }[];
  type?: "college" | "personal";
}

export interface TaskAssignee {
  name: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "want_to_do" | "doing" | "done" | "todo";
  dueDate?: string;
  priority: "low" | "medium" | "high";
  subjectId?: string;
  projectName?: string;
  phase?: string;
  assignee?: TaskAssignee;
  attendancePercent?: number;
  safeBunks?: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  type: "good" | "bad";
  description: string;
  date: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "class" | "deadline" | "personal" | "cooling" | "event" | "task" | "reminder";
  date: string;
  time?: string;
  subjectId?: string;
}

export interface ChatMessage {
  id: string;
  prompt: string;
  response: string;
  timestamp: string;
  intent?: CopilotIntent;
  sources?: SourceCitation[];
  studyPlan?: StudyPlanOutput;
  taskPriorities?: TaskPriorityOutput[];
  recommendation?: string;
  aiUnavailable?: boolean;
  toolData?: Record<string, unknown>;
}

export interface FocusSession {
  id: string;
  date: string;
  score: number;
  duration: number;
  distractions: number;
}

export interface Alert {
  id: string;
  source: "gmail" | "moodle";
  title: string;
  message: string;
  timestamp: string;
  type: "assignment" | "announcement" | "grade" | "message" | "reminder";
  read: boolean;
  urgent: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface ClassSession {
  id: string;
  subjectId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  date: string;
  weight?: "low" | "medium" | "high";
}

export interface AcademicContext {
  studentProfile: { name: string };
  subjects: Subject[];
  timetable: ClassSession[];
  exams: Exam[];
  tasks: Task[];
  notes: Note[];
  currentDate: string;
}

export interface SourceCitation {
  noteId: string;
  noteTitle: string;
  attachmentName?: string;
  approxPage?: number;
  snippet: string;
}

export interface StudyPlanBlock {
  date: string;
  subjectId?: string;
  topic: string;
  durationMinutes: number;
}

export interface StudyPlanOutput {
  summary: string;
  blocks: StudyPlanBlock[];
}

export interface TaskPriorityOutput {
  taskId: string;
  title: string;
  priority: "low" | "medium" | "high";
  reason: string;
}

export interface VectorRecord {
  id: string;
  vector: number[];
  metadata: {
    noteId: string;
    noteTitle: string;
    attachmentName?: string;
    chunkIndex: number;
    approxPage?: number;
    text: string;
  };
}

export type CopilotIntent =
  | "attendance"
  | "document"
  | "study_plan"
  | "task_priority"
  | "general";

export interface ChunkMetadata {
  noteId: string;
  noteTitle: string;
  attachmentName?: string;
  chunkIndex: number;
  approxPage?: number;
}

export interface TextChunk {
  text: string;
  metadata: ChunkMetadata;
}
