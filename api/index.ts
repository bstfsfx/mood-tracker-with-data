import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import path from "node:path";
import fs from "node:fs";

const dataDir = process.env.DATA_DIR || ".";
const dbPath = path.join(dataDir, "data.db");
if (dataDir !== "." && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const moodEntries = sqliteTable("mood_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  moodScore: integer("mood_score").notNull(),
  energyScore: integer("energy_score").notNull(),
  anxietyScore: integer("anxiety_score").notNull(),
  sleepScore: integer("sleep_score").notNull(),
  anxietyMarkers: text("anxiety_markers").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

const habits = sqliteTable("habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("sage"),
  icon: text("icon").notNull().default("check-circle"),
  targetPerWeek: integer("target_per_week").notNull().default(7),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

const habitCompletions = sqliteTable("habit_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

const aiRoutine = sqliteTable("ai_routine", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  checkInTime: text("check_in_time").notNull().default("09:00"),
  style: text("style").notNull().default("supportive"),
  customPrompt: text("custom_prompt").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

const safetySettings = sqliteTable("safety_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moodThreshold: integer("mood_threshold").notNull().default(2),
  sustainedDays: integer("sustained_days").notNull().default(7),
  anxietyThreshold: integer("anxiety_threshold").notNull().default(4),
  anxietyMarkerDays: integer("anxiety_marker_days").notNull().default(3),
  crisisContactName: text("crisis_contact_name").notNull().default(""),
  crisisContactPhone: text("crisis_contact_phone").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  lastAlertDate: text("last_alert_date"),
});

const db = drizzle(sqlite, { schema: { moodEntries, habits, habitCompletions, aiRoutine, safetySettings } });

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    mood_score INTEGER NOT NULL,
    energy_score INTEGER NOT NULL,
    anxiety_score INTEGER NOT NULL,
    sleep_score INTEGER NOT NULL,
    anxiety_markers TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'sage',
    icon TEXT NOT NULL DEFAULT 'check-circle',
    target_per_week INTEGER NOT NULL DEFAULT 7,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS habit_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ai_routine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    check_in_time TEXT NOT NULL DEFAULT '09:00',
    style TEXT NOT NULL DEFAULT 'supportive',
    custom_prompt TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS safety_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mood_threshold INTEGER NOT NULL DEFAULT 2,
    sustained_days INTEGER NOT NULL DEFAULT 7,
    anxiety_threshold INTEGER NOT NULL DEFAULT 4,
    anxiety_marker_days INTEGER NOT NULL DEFAULT 3,
    crisis_contact_name TEXT NOT NULL DEFAULT '',
    crisis_contact_phone TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    last_alert_date TEXT
  );
`);

async function seedDemoData() {
  const existingMoods = db.select().from(moodEntries).all();
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

    db.insert(moodEntries).values({
      date: dateStr,
      moodScore: moods[i],
      energyScore: energies[i],
      anxietyScore: anxieties[i],
      sleepScore: sleeps[i],
      anxietyMarkers: JSON.stringify(markers),
      notes: notes[i],
    }).run();
  }

  const habitDefs = [
    { name: "Morning Meditation", description: "10 minutes of mindful breathing", color: "sage", icon: "brain", targetPerWeek: 7 },
    { name: "Exercise", description: "30 minutes of physical activity", color: "blue", icon: "dumbbell", targetPerWeek: 5 },
    { name: "Journaling", description: "Write 3 things I'm grateful for", color: "amber", icon: "book-open", targetPerWeek: 7 },
    { name: "Social Connection", description: "Reach out to a friend or family member", color: "rose", icon: "users", targetPerWeek: 3 },
    { name: "Sleep Schedule", description: "In bed by 11 PM", color: "lavender", icon: "moon", targetPerWeek: 7 },
  ];

  for (const h of habitDefs) {
    const habit = db.insert(habits).values(h).returning().get();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const shouldComplete = Math.random() > (1 - habit.targetPerWeek / 7);
      if (shouldComplete) {
        db.insert(habitCompletions).values({ habitId: habit.id, date: dateStr, completed: true }).run();
      }
    }
  }

  db.insert(aiRoutine).values({
    name: "Morning Check-in",
    checkInTime: "09:00",
    style: "supportive",
    customPrompt: "Check in with me about my mood. Remind me of three things I'm grateful for. Suggest one small action I can take today to support my wellbeing.",
    enabled: true,
  }).run();

  db.insert(aiRoutine).values({
    name: "Evening Wind-down",
    checkInTime: "21:00",
    style: "grounding",
    customPrompt: "Guide me through a 5-4-3-2-1 grounding exercise. Then ask how my day went and what I learned about myself.",
    enabled: false,
  }).run();

  if (!db.select().from(safetySettings).get()) {
    db.insert(safetySettings).values({}).run();
  }
}

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use((req, _res, next) => {
  next();
});

app.get("/api/mood-entries", async (_req, res) => {
  const entries = db.select().from(moodEntries).orderBy(desc(moodEntries.date)).all();
  res.json(entries);
});

app.get("/api/mood-entries/range", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end || typeof start !== "string" || typeof end !== "string") {
    return res.status(400).json({ message: "start and end query params required" });
  }
  const entries = db.select().from(moodEntries)
    .where(and(gte(moodEntries.date, start), lte(moodEntries.date, end)))
    .orderBy(desc(moodEntries.date)).all();
  res.json(entries);
});

app.get("/api/mood-entries/:date", async (req, res) => {
  const entry = db.select().from(moodEntries).where(eq(moodEntries.date, req.params.date)).get();
  if (!entry) return res.status(404).json({ message: "Not found" });
  res.json(entry);
});

app.post("/api/mood-entries", async (req, res) => {
  const { date, moodScore, energyScore, anxietyScore, sleepScore, anxietyMarkers, notes } = req.body || {};
  if (!date || typeof moodScore !== "number" || typeof energyScore !== "number" ||
      typeof anxietyScore !== "number" || typeof sleepScore !== "number") {
    return res.status(400).json({ message: "invalid payload" });
  }
  const existing = db.select().from(moodEntries).where(eq(moodEntries.date, date)).get();
  if (existing) {
    db.update(moodEntries).set({
      moodScore, energyScore, anxietyScore, sleepScore,
      anxietyMarkers: JSON.stringify(anxietyMarkers || []),
      notes: notes || "",
    }).where(eq(moodEntries.date, date)).run();
    return res.json(db.select().from(moodEntries).where(eq(moodEntries.date, date)).get());
  }
  const entry = db.insert(moodEntries).values({
    date, moodScore, energyScore, anxietyScore, sleepScore,
    anxietyMarkers: JSON.stringify(anxietyMarkers || []),
    notes: notes || "",
  }).returning().get();
  res.status(201).json(entry);
});

app.patch("/api/mood-entries/:date", async (req, res) => {
  db.update(moodEntries).set(req.body).where(eq(moodEntries.date, req.params.date)).run();
  const updated = db.select().from(moodEntries).where(eq(moodEntries.date, req.params.date)).get();
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
});

app.delete("/api/mood-entries/:date", async (req, res) => {
  db.delete(moodEntries).where(eq(moodEntries.date, req.params.date)).run();
  res.status(204).send();
});

app.get("/api/habits", async (_req, res) => {
  res.json(db.select().from(habits).orderBy(desc(habits.createdAt)).all());
});

app.post("/api/habits", async (req, res) => {
  const habit = db.insert(habits).values(req.body).returning().get();
  res.status(201).json(habit);
});

app.patch("/api/habits/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  db.update(habits).set(req.body).where(eq(habits.id, id)).run();
  const habit = db.select().from(habits).where(eq(habits.id, id)).get();
  if (!habit) return res.status(404).json({ message: "Not found" });
  res.json(habit);
});

app.delete("/api/habits/:id", async (req, res) => {
  db.delete(habits).where(eq(habits.id, parseInt(req.params.id))).run();
  res.status(204).send();
});

app.get("/api/habit-completions", async (req, res) => {
  const { start, end } = req.query;
  if (start && end && typeof start === "string" && typeof end === "string") {
    res.json(db.select().from(habitCompletions)
      .where(and(gte(habitCompletions.date, start), lte(habitCompletions.date, end)))
      .orderBy(desc(habitCompletions.date)).all());
  } else {
    res.json(db.select().from(habitCompletions).orderBy(desc(habitCompletions.date)).all());
  }
});

app.post("/api/habit-completions/toggle", async (req, res) => {
  const { habitId, date } = req.body || {};
  const existing = db.select().from(habitCompletions)
    .where(and(eq(habitCompletions.habitId, habitId), eq(habitCompletions.date, date))).get();
  if (existing) {
    db.update(habitCompletions).set({ completed: !existing.completed })
      .where(eq(habitCompletions.id, existing.id)).run();
    return res.json(db.select().from(habitCompletions).where(eq(habitCompletions.id, existing.id)).get());
  }
  const created = db.insert(habitCompletions).values({ habitId, date, completed: true }).returning().get();
  res.json(created);
});

app.get("/api/ai-routines", async (_req, res) => {
  res.json(db.select().from(aiRoutine).orderBy(desc(aiRoutine.createdAt)).all());
});

app.post("/api/ai-routines", async (req, res) => {
  res.status(201).json(db.insert(aiRoutine).values(req.body).returning().get());
});

app.patch("/api/ai-routines/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  db.update(aiRoutine).set(req.body).where(eq(aiRoutine.id, id)).run();
  const routine = db.select().from(aiRoutine).where(eq(aiRoutine.id, id)).get();
  if (!routine) return res.status(404).json({ message: "Not found" });
  res.json(routine);
});

app.delete("/api/ai-routines/:id", async (req, res) => {
  db.delete(aiRoutine).where(eq(aiRoutine.id, parseInt(req.params.id))).run();
  res.status(204).send();
});

app.get("/api/safety-settings", async (_req, res) => {
  let settings = db.select().from(safetySettings).get();
  if (!settings) settings = db.insert(safetySettings).values({}).returning().get();
  res.json(settings);
});

app.patch("/api/safety-settings", async (req, res) => {
  let settings = db.select().from(safetySettings).get();
  if (settings) {
    db.update(safetySettings).set(req.body).where(eq(safetySettings.id, settings.id)).run();
    settings = db.select().from(safetySettings).where(eq(safetySettings.id, settings.id)).get();
  } else {
    settings = db.insert(safetySettings).values(req.body).returning().get();
  }
  res.json(settings);
});

app.get("/api/safety-check", async (_req, res) => {
  const settings = db.select().from(safetySettings).get() || (await db.insert(safetySettings).values({}).returning().get());
  const entries = [...db.select().from(moodEntries).orderBy(desc(moodEntries.date)).all()].reverse();
  const alerts: Array<{ type: string; severity: string; message: string; details: string }> = [];
  if (settings && settings.enabled && entries.length > 0) {
    const recentEntries = entries.slice(-settings.sustainedDays);
    if (recentEntries.length >= settings.sustainedDays) {
      if (recentEntries.every((e) => e.moodScore <= settings.moodThreshold)) {
        alerts.push({
          type: "sustained_low_mood",
          severity: "high",
          message: `Mood has been at or below ${settings.moodThreshold}/5 for ${settings.sustainedDays} consecutive days.`,
          details: "Your mood logs show a sustained period of low mood. Consider reaching out to a mental health professional for support. This is not a diagnosis — it's an invitation to connect with someone who can help.",
        });
      }
    }
    const recentAnxiety = entries.slice(-settings.sustainedDays);
    if (recentAnxiety.length >= settings.sustainedDays) {
      if (recentAnxiety.every((e) => e.anxietyScore >= settings.anxietyThreshold)) {
        alerts.push({
          type: "sustained_anxiety",
          severity: "high",
          message: `Anxiety has been at or above ${settings.anxietyThreshold}/5 for ${settings.sustainedDays} consecutive days.`,
          details: "Your logs show persistent elevated anxiety. Consider speaking with a mental health professional about what you're experiencing.",
        });
      }
    }
    const recentMarkers = entries.slice(-settings.anxietyMarkerDays);
    if (recentMarkers.length >= settings.anxietyMarkerDays) {
      if (recentMarkers.every((e) => JSON.parse(e.anxietyMarkers || "[]").length > 0)) {
        alerts.push({
          type: "anxiety_markers",
          severity: "moderate",
          message: `Anxiety markers present for ${settings.anxietyMarkerDays} consecutive days.`,
          details: "You've logged anxiety markers like racing thoughts, panic, or overwhelm on multiple consecutive days. Consider reaching out to a trusted support person or mental health professional.",
        });
      }
    }
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

app.post("/api/seed", async (_req, res) => {
  await seedDemoData();
  res.json({ message: "Demo data seeded" });
});

app.get("/api/streaks", async (_req, res) => {
  const allHabits = db.select().from(habits).where(eq(habits.active, true)).orderBy(desc(habits.createdAt)).all();
  const allCompletions = db.select().from(habitCompletions).orderBy(desc(habitCompletions.date)).all();

  const streaks = allHabits.map((habit) => {
    const habitComps = allCompletions
      .filter((c) => c.habitId === habit.id && c.completed)
      .sort((a, b) => b.date.localeCompare(a.date));

    let currentStreak = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < habitComps.length; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (habitComps.find((c) => c.date === dateStr)) currentStreak++;
      else if (dateStr !== today) break;
    }

    let bestStreak = 0;
    let tempStreak = 0;
    const sortedDates = habitComps.map((c) => c.date).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) tempStreak = 1;
      else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        tempStreak = diff === 1 ? tempStreak + 1 : 1;
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    }

    const weekCompletion = allCompletions.filter((c) => c.habitId === habit.id && c.completed).length;
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

seedDemoData().catch((err) => console.error("seed failed", err));

export default app;