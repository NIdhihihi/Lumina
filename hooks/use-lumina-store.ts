import { create } from 'zustand';

export interface StudentProfile {
  name: string;
  email: string;
  college: string;
  branch: string;
  semester: string;
}

export interface FocusSessionState {
  isActive: boolean;
  mode: "focus" | "break";
  timeLeft: number;
  totalDuration: number;
  topic: string;
  distractionCount: number;
  petMood: "happy" | "focused" | "angry" | "jealous" | "celebrating";
  petSpeech: string;
  isPetEnabled: boolean;
}

const DEFAULT_PROFILE: StudentProfile = {
  name: "Student",
  email: "student@university.edu",
  college: "Institute of Technology",
  branch: "Computer Science & Engineering",
  semester: "Semester 5",
};

const DEFAULT_FOCUS_SESSION: FocusSessionState = {
  isActive: false,
  mode: "focus",
  timeLeft: 25 * 60,
  totalDuration: 25 * 60,
  topic: "Deep Study",
  distractionCount: 0,
  petMood: "focused",
  petSpeech: "I'm your Study Demon! Lock in and let's get that GPA! ⚡",
  isPetEnabled: true,
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
  focusSession: FocusSessionState;
  updateProfile: (profile: Partial<StudentProfile>) => void;
  setRagPaused: (paused: boolean) => void;
  startFocus: (durationMinutes?: number, topic?: string) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  stopFocus: () => void;
  updateFocusTimeLeft: (timeLeft: number) => void;
  recordDistraction: (speech?: string) => void;
  setPetMood: (mood: FocusSessionState["petMood"], speech?: string) => void;
  togglePetEnabled: () => void;
  setPetEnabled: (enabled: boolean) => void;
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
  focusSession: DEFAULT_FOCUS_SESSION,

  startFocus: (durationMinutes = 25, topic = "Deep Study") => {
    set((state) => ({
      focusSession: {
        ...state.focusSession,
        isActive: true,
        mode: "focus",
        timeLeft: durationMinutes * 60,
        totalDuration: durationMinutes * 60,
        topic,
        distractionCount: 0,
        petMood: "focused",
        petSpeech: "Locked in! I'll be watching your screen! 😼🔥",
      },
    }));
  },

  pauseFocus: () => {
    set((state) => ({
      focusSession: { ...state.focusSession, isActive: false },
    }));
  },

  resumeFocus: () => {
    set((state) => ({
      focusSession: { ...state.focusSession, isActive: true },
    }));
  },

  stopFocus: () => {
    set((state) => ({
      focusSession: {
        ...DEFAULT_FOCUS_SESSION,
        isActive: false,
        isPetEnabled: state.focusSession.isPetEnabled,
      },
    }));
  },

  updateFocusTimeLeft: (timeLeft: number) => {
    set((state) => ({
      focusSession: { ...state.focusSession, timeLeft },
    }));
  },

  recordDistraction: (speech) => {
    set((state) => ({
      focusSession: {
        ...state.focusSession,
        distractionCount: state.focusSession.distractionCount + 1,
        petMood: "angry",
        petSpeech: speech || "HEY! Your screen disagrees! GET BACK TO WORK! 😾💥",
      },
    }));
  },

  setPetMood: (mood, speech) => {
    set((state) => ({
      focusSession: {
        ...state.focusSession,
        petMood: mood,
        ...(speech ? { petSpeech: speech } : {}),
      },
    }));
  },

  togglePetEnabled: () => {
    set((state) => ({
      focusSession: {
        ...state.focusSession,
        isPetEnabled: !state.focusSession.isPetEnabled,
      },
    }));
  },

  setPetEnabled: (enabled: boolean) => {
    set((state) => ({
      focusSession: {
        ...state.focusSession,
        isPetEnabled: enabled,
      },
    }));
  },

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
