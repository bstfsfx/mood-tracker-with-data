import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Mood Entries ──────────────────────────────────────────────
export const moodEntries = sqliteTable("mood_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  moodScore: integer("mood_score").notNull(), // 1-5
  energyScore: integer("energy_score").notNull(), // 1-5
  anxietyScore: integer("anxiety_score").notNull(), // 1-5
  sleepScore: integer("sleep_score").notNull(), // 1-5
  anxietyMarkers: text("anxiety_markers").notNull().default("[]"), // JSON array
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

// ─── Habits ────────────────────────────────────────────────────
export const habits = sqliteTable("habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("sage"), // sage, blue, amber, rose, lavender
  icon: text("icon").notNull().default("check-circle"), // lucide icon name
  targetPerWeek: integer("target_per_week").notNull().default(7),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
});

// ─── Habit Completions ──────────────────────────────────────────
export const habitCompletions = sqliteTable("habit_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  completed: integer("completed", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({
  id: true,
  createdAt: true,
});

// ─── AI Routine Config ─────────────────────────────────────────
export const aiRoutine = sqliteTable("ai_routine", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  checkInTime: text("check_in_time").notNull().default("09:00"), // HH:MM
  style: text("style").notNull().default("supportive"), // supportive, grounding, journaling, coping
  customPrompt: text("custom_prompt").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertAIRoutineSchema = createInsertSchema(aiRoutine).omit({
  id: true,
  createdAt: true,
});

// ─── Safety Settings ───────────────────────────────────────────
export const safetySettings = sqliteTable("safety_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moodThreshold: integer("mood_threshold").notNull().default(2), // mood <= this triggers concern (1-5)
  sustainedDays: integer("sustained_days").notNull().default(7), // consecutive days at/below threshold
  anxietyThreshold: integer("anxiety_threshold").notNull().default(4), // anxiety >= this triggers concern (1-5)
  anxietyMarkerDays: integer("anxiety_marker_days").notNull().default(3), // consecutive days with markers
  crisisContactName: text("crisis_contact_name").notNull().default(""),
  crisisContactPhone: text("crisis_contact_phone").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  lastAlertDate: text("last_alert_date"),
});

export const insertSafetySettingsSchema = createInsertSchema(safetySettings).omit({
  id: true,
  lastAlertDate: true,
});

// ─── Types ──────────────────────────────────────────────────────
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type AIRoutine = typeof aiRoutine.$inferSelect;
export type InsertAIRoutine = z.infer<typeof insertAIRoutineSchema>;
export type SafetySettings = typeof safetySettings.$inferSelect;
export type InsertSafetySettings = z.infer<typeof insertSafetySettingsSchema>;

// ─── Validation extensions ─────────────────────────────────────
export const moodEntryFormSchema = insertMoodEntrySchema.extend({
  moodScore: z.number().min(1).max(5),
  energyScore: z.number().min(1).max(5),
  anxietyScore: z.number().min(1).max(5),
  sleepScore: z.number().min(1).max(5),
  anxietyMarkers: z.string().default("[]"),
  notes: z.string().max(2000).default(""),
});

export const habitFormSchema = insertHabitSchema.extend({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  targetPerWeek: z.number().min(1).max(7),
});

export const aiRoutineFormSchema = insertAIRoutineSchema.extend({
  name: z.string().min(1).max(100),
  customPrompt: z.string().max(2000).default(""),
});

export const safetySettingsFormSchema = insertSafetySettingsSchema.extend({
  moodThreshold: z.number().min(1).max(5),
  sustainedDays: z.number().min(1).max(30),
  anxietyThreshold: z.number().min(1).max(5),
  anxietyMarkerDays: z.number().min(1).max(14),
});

// ─── Anxiety Markers ───────────────────────────────────────────
export const ANXIETY_MARKERS = [
  { id: "panic", label: "Panic / fear", icon: "AlertTriangle" },
  { id: "racing-thoughts", label: "Racing thoughts", icon: "Zap" },
  { id: "cant-sleep", label: "Can't sleep", icon: "Moon" },
  { id: "overwhelmed", label: "Overwhelmed", icon: "Waves" },
  { id: "avoidance", label: "Avoidance", icon: "ShieldOff" },
  { id: "chest-tightness", label: "Chest tightness", icon: "HeartPulse" },
  { id: "irritable", label: "Irritable", icon: "Flame" },
  { id: "numb", label: "Numb / detached", icon: "CloudFog" },
] as const;

// ─── AI Routine Styles ──────────────────────────────────────────
export const AI_ROUTINE_STYLES = [
  { id: "supportive", label: "Supportive Check-in", description: "Gent encouragement and mood reflection" },
  { id: "grounding", label: "Grounding Exercise", description: "5-4-3-2-1 sensory grounding technique" },
  { id: "journaling", label: "Journaling Prompt", description: "Guided reflective writing prompts" },
  { id: "coping", label: "Coping Strategy", description: "Actionable coping steps for difficult moments" },
] as const;
