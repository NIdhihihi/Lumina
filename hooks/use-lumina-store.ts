import { create } from 'zustand';

export interface StudentProfile {
  name: string;
  email: string;
  college: string;
  branch: string;
  semester: string;
}

const DEFAULT_PROFILE: StudentProfile = {
  name: "Student",
  email: "student@university.edu",
  college: "Institute of Technology",
  branch: "Computer Science & Engineering",
  semester: "Semester 5",
};

interface LuminaState {
  profile: StudentProfile;
  notes: any[];
  attendance: any[];
  expenses: any[];
  tasks: any[];
  chatHistory: any[];
  timetable: any[];
  isRagPaused: boolean;
  updateProfile: (profile: Partial<StudentProfile>) => void;
  setRagPaused: (paused: boolean) => void;
  fetchNotes: () => Promise<void>;
  fetchAttendance: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchChatHistory: () => Promise<void>;
  fetchTimetable: () => Promise<void>;
  clearData: (target?: string) => Promise<void>;
}

export const useLuminaStore = create<LuminaState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  notes: [],
  attendance: [],
  expenses: [],
  tasks: [],
  chatHistory: [],
  timetable: [],
  isRagPaused: false,

  updateProfile: (updated) => {
    set((state) => {
      const next = { ...state.profile, ...updated };
      if (typeof window !== "undefined") {
        localStorage.setItem("lumina_student_profile", JSON.stringify(next));
      }
      return { profile: next };
    });
  },

  setRagPaused: (paused: boolean) => set({ isRagPaused: paused }),

  fetchNotes: async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      set({ notes: Array.isArray(data) ? data : [] });
    } catch {
      set({ notes: [] });
    }
  },

  fetchAttendance: async () => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      set({ attendance: Array.isArray(data) ? data : [] });
    } catch {
      set({ attendance: [] });
    }
  },

  fetchExpenses: async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      set({ expenses: Array.isArray(data) ? data : [] });
    } catch {
      set({ expenses: [] });
    }
  },

  fetchTasks: async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      set({ tasks: Array.isArray(data) ? data : [] });
    } catch {
      set({ tasks: [] });
    }
  },

  fetchChatHistory: async () => {
    try {
      const res = await fetch('/api/ai/chat');
      const data = await res.json();
      set({ chatHistory: Array.isArray(data) ? data : [] });
    } catch {
      set({ chatHistory: [] });
    }
  },

  fetchTimetable: async () => {
    try {
      const res = await fetch('/api/timetable');
      const data = await res.json();
      set({ timetable: Array.isArray(data) ? data : [] });
    } catch {
      set({ timetable: [] });
    }
  },

  clearData: async (target = "all") => {
    try {
      await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      await Promise.all([
        get().fetchNotes(),
        get().fetchExpenses(),
        get().fetchTasks(),
        get().fetchTimetable(),
        get().fetchChatHistory(),
      ]);
    } catch (err) {
      console.error("Clear data error:", err);
    }
  },
}));
