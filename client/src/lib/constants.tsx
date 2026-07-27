import {
  Heart,
  Frown,
  Meh,
  Smile,
  Laugh,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Zap,
  AlertTriangle,
  Moon,
  Waves,
  ShieldOff,
  HeartPulse,
  Flame,
  CloudFog,
} from "lucide-react";

export const MOOD_OPTIONS = [
  { value: 1, label: "Very Low", icon: Frown, color: "#dc2626" },
  { value: 2, label: "Low", icon: Meh, color: "#f97316" },
  { value: 3, label: "Neutral", icon: Smile, color: "#eab308" },
  { value: 4, label: "Good", icon: Laugh, color: "#84cc16" },
  { value: 5, label: "Great", icon: Heart, color: "#22c55e" },
];

export const ENERGY_OPTIONS = [
  { value: 1, label: "Drained", icon: BatteryLow, color: "#dc2626" },
  { value: 2, label: "Low", icon: Battery, color: "#f97316" },
  { value: 3, label: "Moderate", icon: BatteryMedium, color: "#eab308" },
  { value: 4, label: "Good", icon: BatteryFull, color: "#84cc16" },
  { value: 5, label: "Energetic", icon: Zap, color: "#22c55e" },
];

export const ANXIETY_LEVELS = [
  { value: 1, label: "Calm", color: "#22c55e" },
  { value: 2, label: "Mild", color: "#84cc16" },
  { value: 3, label: "Moderate", color: "#eab308" },
  { value: 4, label: "High", color: "#f97316" },
  { value: 5, label: "Severe", color: "#dc2626" },
];

export const SLEEP_OPTIONS = [
  { value: 1, label: "Poor", icon: Moon, color: "#dc2626" },
  { value: 2, label: "Fair", icon: Moon, color: "#f97316" },
  { value: 3, label: "Okay", icon: Moon, color: "#eab308" },
  { value: 4, label: "Good", icon: Moon, color: "#84cc16" },
  { value: 5, label: "Restful", icon: Moon, color: "#22c55e" },
];

export const HABIT_COLORS: Record<string, string> = {
  sage: "#5b8c6a",
  blue: "#4a90b8",
  amber: "#d4a04c",
  rose: "#c4758a",
  lavender: "#8b7ec4",
};

export const ANXIETY_MARKER_ICONS: Record<string, typeof AlertTriangle> = {
  "panic": AlertTriangle,
  "racing-thoughts": Zap,
  "cant-sleep": Moon,
  "overwhelmed": Waves,
  "avoidance": ShieldOff,
  "chest-tightness": HeartPulse,
  "irritable": Flame,
  "numb": CloudFog,
};

export const ANXIETY_MARKER_LABELS: Record<string, string> = {
  "panic": "Panic / fear",
  "racing-thoughts": "Racing thoughts",
  "cant-sleep": "Can't sleep",
  "overwhelmed": "Overwhelmed",
  "avoidance": "Avoidance",
  "chest-tightness": "Chest tightness",
  "irritable": "Irritable",
  "numb": "Numb / detached",
};

export const AI_STYLE_PREVIEWS: Record<string, string> = {
  supportive: "Hi there. How are you feeling today? Remember that every emotion you experience is valid. Take a moment to acknowledge where you are right now. What's one small thing that went okay today?",
  grounding: "Let's ground ourselves. Name 5 things you can see right now. Now 4 things you can feel. 3 things you can hear. 2 things you can smell. 1 thing you can taste. You are here, in this moment, and you are safe.",
  journaling: "Write freely for a few minutes. What's on your mind? What's weighing on you? What are you grateful for? Don't edit yourself — just let the words flow. There are no wrong answers here.",
  coping: "When things feel overwhelming, try the 4-7-8 technique: breathe in for 4 seconds, hold for 7, exhale for 8. Repeat 3 times. Now, what's one small step you can take right now to care for yourself?",
};

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
