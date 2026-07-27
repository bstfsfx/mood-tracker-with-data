import type { Express } from "express";
import type { Server } from "node:http";
import { storage } from "./storage";
import {
  moodEntryFormSchema,
  habitFormSchema,
  aiRoutineFormSchema,
  safetySettingsFormSchema,
  insertHabitCompletionSchema,
} from "../shared/schema";

export async function registerRoutes(_server: Server, app: Express) {
  // ─── Mood Entries ──────────────────────────────────
  app.get("/api/mood-entries", async (_req, res) => {
    const entries = await storage.getMoodEntries();
    res.json(entries);
  });

  app.get("/api/mood-entries/range", async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end || typeof start !== "string" || typeof end !== "string") {
      return res.status(400).json({ message: "start and end query params required" });
    }
    const entries = await storage.getMoodEntriesByDateRange(start, end);
    res.json(entries);
  });

  app.get("/api/mood-entries/:date", async (req, res) => {
    const entry = await storage.getMoodEntryByDate(req.params.date);
    if (!entry) return res.status(404).json({ message: "Not found" });
    res.json(entry);
  });

  app.post("/api/mood-entries", async (req, res) => {
    const parsed = moodEntryFormSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
    const existing = await storage.getMoodEntryByDate(parsed.data.date);
    if (existing) {
      const updated = await storage.updateMoodEntry(parsed.data.date, parsed.data);
      return res.json(updated);
    }
    const entry = await storage.createMoodEntry(parsed.data);
    res.status(201).json(entry);
  });

  app.patch("/api/mood-entries/:date", async (req, res) => {
    const updated = await storage.updateMoodEntry(req.params.date, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/mood-entries/:date", async (req, res) => {
    await storage.deleteMoodEntry(req.params.date);
    res.status(204).send();
  });

  // ─── Habits ────────────────────────────────────────
  app.get("/api/habits", async (_req, res) => {
    const allHabits = await storage.getHabits();
    res.json(allHabits);
  });

  app.post("/api/habits", async (req, res) => {
    const parsed = habitFormSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
    const habit = await storage.createHabit(parsed.data);
    res.status(201).json(habit);
  });

  app.patch("/api/habits/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const habit = await storage.updateHabit(id, req.body);
    if (!habit) return res.status(404).json({ message: "Not found" });
    res.json(habit);
  });

  app.delete("/api/habits/:id", async (req, res) => {
    await storage.deleteHabit(parseInt(req.params.id));
    res.status(204).send();
  });

  // ─── Habit Completions ────────────────────────────
  app.get("/api/habit-completions", async (req, res) => {
    const { start, end } = req.query;
    if (start && end && typeof start === "string" && typeof end === "string") {
      const completions = await storage.getHabitCompletionsByDateRange(start, end);
      res.json(completions);
    } else {
      const completions = await storage.getHabitCompletions();
      res.json(completions);
    }
  });

  app.post("/api/habit-completions/toggle", async (req, res) => {
    const parsed = insertHabitCompletionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
    const completion = await storage.toggleHabitCompletion(parsed.data.habitId, parsed.data.date);
    res.json(completion);
  });

  // ─── AI Routines ───────────────────────────────────
  app.get("/api/ai-routines", async (_req, res) => {
    const routines = await storage.getAIRoutines();
    res.json(routines);
  });

  app.post("/api/ai-routines", async (req, res) => {
    const parsed = aiRoutineFormSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
    const routine = await storage.createAIRoutine(parsed.data);
    res.status(201).json(routine);
  });

  app.patch("/api/ai-routines/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const routine = await storage.updateAIRoutine(id, req.body);
    if (!routine) return res.status(404).json({ message: "Not found" });
    res.json(routine);
  });

  app.delete("/api/ai-routines/:id", async (req, res) => {
    await storage.deleteAIRoutine(parseInt(req.params.id));
    res.status(204).send();
  });

  // ─── Safety Settings ──────────────────────────────
  app.get("/api/safety-settings", async (_req, res) => {
    const settings = await storage.getSafetySettings();
    res.json(settings);
  });

  app.patch("/api/safety-settings", async (req, res) => {
    const parsed = safetySettingsFormSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
    const settings = await storage.updateSafetySettings(parsed.data);
    res.json(settings);
  });

  // ─── Safety Check ──────────────────────────────────
  app.get("/api/safety-check", async (_req, res) => {
    const settings = await storage.getSafetySettings();
    const allEntries = await storage.getMoodEntries();
    const entries = [...allEntries].reverse(); // oldest first

    if (!settings || entries.length === 0) {
      return res.json({ alerts: [], settings });
    }

    const alerts: Array<{ type: string; severity: string; message: string; details: string }> = [];

    // Check 1: Sustained low mood
    if (settings.enabled) {
      const recentEntries = entries.slice(-settings.sustainedDays);
      if (recentEntries.length >= settings.sustainedDays) {
        const sustainedLow = recentEntries.every(e => e.moodScore <= settings.moodThreshold);
        if (sustainedLow) {
          alerts.push({
            type: "sustained_low_mood",
            severity: "high",
            message: `Mood has been at or below ${settings.moodThreshold}/5 for ${settings.sustainedDays} consecutive days.`,
            details: "Your mood logs show a sustained period of low mood. Consider reaching out to a mental health professional for support. This is not a diagnosis — it's an invitation to connect with someone who can help.",
          });
        }
      }

      // Check 2: Sustained high anxiety
      const recentAnxiety = entries.slice(-settings.sustainedDays);
      if (recentAnxiety.length >= settings.sustainedDays) {
        const sustainedAnxiety = recentAnxiety.every(e => e.anxietyScore >= settings.anxietyThreshold);
        if (sustainedAnxiety) {
          alerts.push({
            type: "sustained_anxiety",
            severity: "high",
            message: `Anxiety has been at or above ${settings.anxietyThreshold}/5 for ${settings.sustainedDays} consecutive days.`,
            details: "Your logs show persistent elevated anxiety. Consider speaking with a mental health professional about what you're experiencing.",
          });
        }
      }

      // Check 3: Anxiety markers on consecutive days
      const recentMarkers = entries.slice(-settings.anxietyMarkerDays);
      if (recentMarkers.length >= settings.anxietyMarkerDays) {
        const consecutiveMarkers = recentMarkers.every(e => {
          const markers = JSON.parse(e.anxietyMarkers || "[]");
          return markers.length > 0;
        });
        if (consecutiveMarkers) {
          alerts.push({
            type: "anxiety_markers",
            severity: "moderate",
            message: `Anxiety markers present for ${settings.anxietyMarkerDays} consecutive days.`,
            details: "You've logged anxiety markers like racing thoughts, panic, or overwhelm on multiple consecutive days. Consider reaching out to a trusted support person or mental health professional.",
          });
        }
      }

      // Check 4: Very low single-day mood (immediate concern)
      const latest = entries[entries.length - 1];
      if (latest && latest.moodScore === 1) {
        alerts.push({
          type: "very_low_mood",
          severity: "moderate",
          message: "Today's mood is at the lowest level.",
          details: "If you're going through a difficult time, please consider reaching out to someone you trust. You don't have to handle this alone.",
        });
      }
    }

    res.json({ alerts, settings, entryCount: entries.length });
  });

  // ─── Seed ──────────────────────────────────────────
  app.post("/api/seed", async (_req, res) => {
    await storage.seedDemoData();
    res.json({ message: "Demo data seeded" });
  });

  // ─── Streaks ───────────────────────────────────────
  app.get("/api/streaks", async (_req, res) => {
    const allHabits = await storage.getActiveHabits();
    const allCompletions = await storage.getHabitCompletions();

    const streaks = allHabits.map(habit => {
      const habitComps = allCompletions
        .filter(c => c.habitId === habit.id && c.completed)
        .sort((a, b) => b.date.localeCompare(a.date));

      let currentStreak = 0;
      const today = new Date().toISOString().slice(0, 10);

      for (let i = 0; i < habitComps.length; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        if (habitComps.find(c => c.date === dateStr)) {
          currentStreak++;
        } else if (dateStr !== today) {
          break;
        }
      }

      let bestStreak = 0;
      let tempStreak = 0;
      const sortedDates = habitComps.map(c => c.date).sort();
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      }

      const last7 = allCompletions.filter(c => c.habitId === habit.id && c.completed);
      const weekCompletion = last7.length;

      return {
        habitId: habit.id,
        habitName: habit.name,
        color: habit.color,
        icon: habit.icon,
        targetPerWeek: habit.targetPerWeek,
        currentStreak,
        bestStreak,
        weekCompletion,
        totalCompletions: habitComps.length,
      };
    });

    res.json(streaks);
  });
}
