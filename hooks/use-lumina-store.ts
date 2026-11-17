import { create } from 'zustand';

interface LuminaState {
  notes: any[];
  attendance: any[];
  expenses: any[];
  tasks: any[];
  chatHistory: any[];
  fetchNotes: () => Promise<void>;
  fetchAttendance: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchChatHistory: () => Promise<void>;
}

export const useLuminaStore = create<LuminaState>((set) => ({
  notes: [],
  attendance: [],
  expenses: [],
  tasks: [],
  chatHistory: [],

  fetchNotes: async () => {
    const res = await fetch('/api/notes');
    const data = await res.json();
    set({ notes: data });
  },

  fetchAttendance: async () => {
    const res = await fetch('/api/attendance');
    const data = await res.json();
    set({ attendance: data });
  },

  fetchExpenses: async () => {
    const res = await fetch('/api/expenses');
    const data = await res.json();
    set({ expenses: data });
  },

  fetchTasks: async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    set({ tasks: data });
  },

  fetchChatHistory: async () => {
    const res = await fetch('/api/ai/chat');
    const data = await res.json();
    set({ chatHistory: data });
  },
}));
