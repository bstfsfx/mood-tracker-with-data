import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MoodEntry, Habit, HabitCompletion, AIRoutine, SafetySettings } from "../../../shared/schema";

// ─── Mood Entries ─────────────────────────────────────
export function useMoodEntries() {
  return useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });
}

export function useCreateMoodEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MoodEntry>) => {
      const res = await apiRequest("POST", "/api/mood-entries", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      qc.invalidateQueries({ queryKey: ["/api/safety-check"] });
      qc.invalidateQueries({ queryKey: ["/api/streaks"] });
    },
  });
}

export function useDeleteMoodEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      await apiRequest("DELETE", `/api/mood-entries/${date}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      qc.invalidateQueries({ queryKey: ["/api/safety-check"] });
    },
  });
}

// ─── Habits ────────────────────────────────────────────
export function useHabits() {
  return useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Habit>) => {
      const res = await apiRequest("POST", "/api/habits", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/habits"] });
      qc.invalidateQueries({ queryKey: ["/api/streaks"] });
      qc.invalidateQueries({ queryKey: ["/api/habit-completions"] });
    },
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Habit>) => {
      const res = await apiRequest("PATCH", `/api/habits/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/habits"] });
      qc.invalidateQueries({ queryKey: ["/api/streaks"] });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/habits/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/habits"] });
      qc.invalidateQueries({ queryKey: ["/api/streaks"] });
      qc.invalidateQueries({ queryKey: ["/api/habit-completions"] });
    },
  });
}

// ─── Habit Completions ─────────────────────────────────
export function useHabitCompletions() {
  return useQuery<HabitCompletion[]>({
    queryKey: ["/api/habit-completions"],
  });
}

export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      const res = await apiRequest("POST", "/api/habit-completions/toggle", { habitId, date });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/habit-completions"] });
      qc.invalidateQueries({ queryKey: ["/api/streaks"] });
    },
  });
}

// ─── AI Routines ──────────────────────────────────────
export function useAIRoutines() {
  return useQuery<AIRoutine[]>({
    queryKey: ["/api/ai-routines"],
  });
}

export function useCreateAIRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AIRoutine>) => {
      const res = await apiRequest("POST", "/api/ai-routines", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ai-routines"] });
    },
  });
}

export function useUpdateAIRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<AIRoutine>) => {
      const res = await apiRequest("PATCH", `/api/ai-routines/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ai-routines"] });
    },
  });
}

export function useDeleteAIRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ai-routines/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ai-routines"] });
    },
  });
}

// ─── Safety ────────────────────────────────────────────
export function useSafetySettings() {
  return useQuery<SafetySettings>({
    queryKey: ["/api/safety-settings"],
  });
}

export function useUpdateSafetySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SafetySettings>) => {
      const res = await apiRequest("PATCH", "/api/safety-settings", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/safety-settings"] });
      qc.invalidateQueries({ queryKey: ["/api/safety-check"] });
    },
  });
}

export interface SafetyAlert {
  type: string;
  severity: string;
  message: string;
  details: string;
}

export function useSafetyCheck() {
  return useQuery<{ alerts: SafetyAlert[]; settings: SafetySettings; entryCount: number }>({
    queryKey: ["/api/safety-check"],
  });
}

// ─── Streaks ───────────────────────────────────────────
export interface StreakData {
  habitId: number;
  habitName: string;
  color: string;
  icon: string;
  targetPerWeek: number;
  currentStreak: number;
  bestStreak: number;
  weekCompletion: number;
  totalCompletions: number;
}

export function useStreaks() {
  return useQuery<StreakData[]>({
    queryKey: ["/api/streaks"],
  });
}

// ─── Seed ──────────────────────────────────────────────
export function useSeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
