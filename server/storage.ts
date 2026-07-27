import { db } from "./db";
import {
  moodEntries,
  habits,
  habitCompletions,
  aiRoutine,
  safetySettings,
  type MoodEntry,
  type Habit,
  type HabitCompletion,
  type AIRoutine,
  type SafetySettings,
  type InsertMoodEntry,
  type InsertHabit,
  type InsertHabitCompletion,
  type InsertAIRoutine,
  type InsertSafetySettings,
} from "../shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Mood entries
  getMoodEntries(): Promise<MoodEntry[]>;
  getMoodEntriesByDateRange(start: string, end: string): Promise<MoodEntry[]>;
  getMoodEntryByDate(date: string): Promise<MoodEntry | undefined>;
  createMoodEntry(data: InsertMoodEntry): Promise<MoodEntry>;
  updateMoodEntry(date: string, data: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined>;
  deleteMoodEntry(date: string): Promise<void>;

  // Habits
  getHabits(): Promise<Habit[]>;
  getActiveHabits(): Promise<Habit[]>;
  getHabit(id: number): Promise<Habit | undefined>;
  createHabit(data: InsertHabit): Promise<Habit>;
  updateHabit(id: number, data: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<void>;

  // Habit completions
  getHabitCompletions(): Promise<HabitCompletion[]>;
  getHabitCompletionsByDateRange(start: string, end: string): Promise<HabitCompletion[]>;
  getHabitCompletionsByHabit(habitId: number): Promise<HabitCompletion[]>;
  toggleHabitCompletion(habitId: number, date: string): Promise<HabitCompletion>;

  // AI routines
  getAIRoutines(): Promise<AIRoutine[]>;
  createAIRoutine(data: InsertAIRoutine): Promise<AIRoutine>;
  updateAIRoutine(id: number, data: Partial<InsertAIRoutine>): Promise<AIRoutine | undefined>;
  deleteAIRoutine(id: number): Promise<void>;

  // Safety settings
  getSafetySettings(): Promise<SafetySettings | undefined>;
  updateSafetySettings(data: Partial<InsertSafetySettings>): Promise<SafetySettings>;

  // Seed
  seedDemoData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ─── Mood Entries ──────────────────────────────────
  async getMoodEntries(): Promise<MoodEntry[]> {
    return db.select().from(moodEntries).orderBy(desc(moodEntries.date)).all();
  }

  async getMoodEntriesByDateRange(start: string, end: string): Promise<MoodEntry[]> {
    return db.select().from(moodEntries)
      .where(and(gte(moodEntries.date, start), lte(moodEntries.date, end)))
      .orderBy(desc(moodEntries.date)).all();
  }

  async getMoodEntryByDate(date: string): Promise<MoodEntry | undefined> {
    return db.select().from(moodEntries).where(eq(moodEntries.date, date)).get();
  }

  async createMoodEntry(data: InsertMoodEntry): Promise<MoodEntry> {
    return db.insert(moodEntries).values(data).returning().get();
  }

  async updateMoodEntry(date: string, data: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined> {
    db.update(moodEntries).set(data).where(eq(moodEntries.date, date)).run();
    return this.getMoodEntryByDate(date);
  }

  async deleteMoodEntry(date: string): Promise<void> {
    db.delete(moodEntries).where(eq(moodEntries.date, date)).run();
  }

  // ─── Habits ────────────────────────────────────────
  async getHabits(): Promise<Habit[]> {
    return db.select().from(habits).orderBy(desc(habits.createdAt)).all();
  }

  async getActiveHabits(): Promise<Habit[]> {
    return db.select().from(habits).where(eq(habits.active, true)).orderBy(desc(habits.createdAt)).all();
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    return db.select().from(habits).where(eq(habits.id, id)).get();
  }

  async createHabit(data: InsertHabit): Promise<Habit> {
    return db.insert(habits).values(data).returning().get();
  }

  async updateHabit(id: number, data: Partial<InsertHabit>): Promise<Habit | undefined> {
    db.update(habits).set(data).where(eq(habits.id, id)).run();
    return this.getHabit(id);
  }

  async deleteHabit(id: number): Promise<void> {
    db.delete(habits).where(eq(habits.id, id)).run();
  }

  // ─── Habit Completions ────────────────────────────
  async getHabitCompletions(): Promise<HabitCompletion[]> {
    return db.select().from(habitCompletions).orderBy(desc(habitCompletions.date)).all();
  }

  async getHabitCompletionsByDateRange(start: string, end: string): Promise<HabitCompletion[]> {
    return db.select().from(habitCompletions)
      .where(and(gte(habitCompletions.date, start), lte(habitCompletions.date, end)))
      .orderBy(desc(habitCompletions.date)).all();
  }

  async getHabitCompletionsByHabit(habitId: number): Promise<HabitCompletion[]> {
    return db.select().from(habitCompletions)
      .where(eq(habitCompletions.habitId, habitId))
      .orderBy(desc(habitCompletions.date)).all();
  }

  async toggleHabitCompletion(habitId: number, date: string): Promise<HabitCompletion> {
    const existing = db.select().from(habitCompletions)
      .where(and(eq(habitCompletions.habitId, habitId), eq(habitCompletions.date, date)))
      .get();

    if (existing) {
      const updated = db.update(habitCompletions)
        .set({ completed: !existing.completed })
        .where(eq(habitCompletions.id, existing.id))
        .returning().get();
      return updated;
    }

    return db.insert(habitCompletions)
      .values({ habitId, date, completed: true })
      .returning().get();
  }

  // ─── AI Routines ───────────────────────────────────
  async getAIRoutines(): Promise<AIRoutine[]> {
    return db.select().from(aiRoutine).orderBy(desc(aiRoutine.createdAt)).all();
  }

  async createAIRoutine(data: InsertAIRoutine): Promise<AIRoutine> {
    return db.insert(aiRoutine).values(data).returning().get();
  }

  async updateAIRoutine(id: number, data: Partial<InsertAIRoutine>): Promise<AIRoutine | undefined> {
    db.update(aiRoutine).set(data).where(eq(aiRoutine.id, id)).run();
    return db.select().from(aiRoutine).where(eq(aiRoutine.id, id)).get();
  }

  async deleteAIRoutine(id: number): Promise<void> {
    db.delete(aiRoutine).where(eq(aiRoutine.id, id)).run();
  }

  // ─── Safety Settings ───────────────────────────────
  async getSafetySettings(): Promise<SafetySettings | undefined> {
    const settings = db.select().from(safetySettings).get();
    if (!settings) {
      // Create default settings
      return db.insert(safetySettings).values({}).returning().get();
    }
    return settings;
  }

  async updateSafetySettings(data: Partial<InsertSafetySettings>): Promise<SafetySettings> {
    const existing = await this.getSafetySettings();
    if (existing) {
      return db.update(safetySettings).set(data).where(eq(safetySettings.id, existing.id)).returning().get();
    }
    return db.insert(safetySettings).values(data).returning().get();
  }

  // ─── Seed Demo Data ────────────────────────────────
  async seedDemoData(): Promise<void> {
    const existingMoods = await this.getMoodEntries();
    if (existingMoods.length > 0) return;

    const today = new Date();
    const moods = [3, 3, 2, 2, 2, 1, 2, 3, 3, 4, 3, 2, 2, 1, 2, 2, 3, 3, 4, 4, 3, 2, 2, 2, 1, 2, 2, 2];
    const energies = [3, 4, 2, 3, 2, 1, 2, 3, 4, 4, 3, 2, 2, 1, 2, 3, 4, 3, 4, 5, 4, 3, 2, 2, 1, 2, 2, 2];
    const anxieties = [2, 3, 4, 3, 4, 5, 4, 3, 2, 2, 3, 4, 4, 5, 4, 3, 2, 2, 1, 1, 2, 3, 4, 4, 5, 4, 4, 4];
    const sleeps = [3, 2, 2, 3, 2, 1, 2, 3, 4, 4, 3, 2, 2, 1, 2, 3, 4, 3, 4, 5, 4, 3, 2, 2, 1, 2, 2, 2];
    const notes = [
      "Felt okay today, went for a walk.",
      "Work was stressful but manageable.",
      "Struggled to focus, felt low energy.",
      "Difficult morning, better after lunch.",
      "Rough day. Couldn't shake the worry.",
      "Really hard day. Felt overwhelmed.",
      "Still struggling but reached out to a friend.",
      "Slightly better. Did some exercise.",
      "Good progress today. Felt more like myself.",
      "Great day! Accomplished a lot.",
      "Decent day, nothing special.",
      "Down again. Not sure why.",
      "Anxious about upcoming deadline.",
      "Very low. Couldn't get out of bed early.",
      "Still feeling low but trying.",
      "Better today. Talked to someone.",
      "Good day. Went outside.",
      "Okay day, stayed productive.",
      "Really good day! Felt positive.",
      "Excellent day. Socialized with friends.",
      "Good mood. Exercised and ate well.",
      "Slipped a bit. Felt anxious.",
      "Hard day. Racing thoughts.",
      "Struggling again. Can't sleep well.",
      "Very difficult. Felt panic.",
      "Still down but trying coping strategies.",
      "Improving. Used grounding exercise.",
      "Still low. Trying to stay positive.",
    ];

    for (let i = 0; i < moods.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (moods.length - 1 - i));
      const dateStr = d.toISOString().slice(0, 10);

      const markers: string[] = [];
      if (anxieties[i] >= 4) {
        markers.push("racing-thoughts");
        if (anxieties[i] >= 5) markers.push("overwhelmed");
      }
      if (sleeps[i] <= 2) markers.push("cant-sleep");
      if (moods[i] <= 2) markers.push("avoidance");

      await this.createMoodEntry({
        date: dateStr,
        moodScore: moods[i],
        energyScore: energies[i],
        anxietyScore: anxieties[i],
        sleepScore: sleeps[i],
        anxietyMarkers: JSON.stringify(markers),
        notes: notes[i],
      });
    }

    // Seed habits
    const habitDefs = [
      { name: "Morning Meditation", description: "10 minutes of mindful breathing", color: "sage", icon: "brain", targetPerWeek: 7 },
      { name: "Exercise", description: "30 minutes of physical activity", color: "blue", icon: "dumbbell", targetPerWeek: 5 },
      { name: "Journaling", description: "Write 3 things I'm grateful for", color: "amber", icon: "book-open", targetPerWeek: 7 },
      { name: "Social Connection", description: "Reach out to a friend or family member", color: "rose", icon: "users", targetPerWeek: 3 },
      { name: "Sleep Schedule", description: "In bed by 11 PM", color: "lavender", icon: "moon", targetPerWeek: 7 },
    ];

    for (const h of habitDefs) {
      const habit = await this.createHabit(h);
      // Seed some completions
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const shouldComplete = Math.random() > (1 - habit.targetPerWeek / 7);
        if (shouldComplete) {
          await db.insert(habitCompletions).values({
            habitId: habit.id,
            date: dateStr,
            completed: true,
          }).run();
        }
      }
    }

    // Seed AI routine
    await this.createAIRoutine({
      name: "Morning Check-in",
      checkInTime: "09:00",
      style: "supportive",
      customPrompt: "Check in with me about my mood. Remind me of three things I'm grateful for. Suggest one small action I can take today to support my wellbeing.",
      enabled: true,
    });

    await this.createAIRoutine({
      name: "Evening Wind-down",
      checkInTime: "21:00",
      style: "grounding",
      customPrompt: "Guide me through a 5-4-3-2-1 grounding exercise. Then ask how my day went and what I learned about myself.",
      enabled: false,
    });

    // Ensure safety settings exist
    await this.getSafetySettings();
  }
}

export const storage = new DatabaseStorage();
