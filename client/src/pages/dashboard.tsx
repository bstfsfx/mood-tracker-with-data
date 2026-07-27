import { useMoodEntries, useStreaks, useSafetyCheck, useSeed, type SafetyAlert } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MOOD_OPTIONS, HABIT_COLORS, formatDate, ANXIETY_MARKER_LABELS } from "@/lib/constants";
import { AlertTriangle, ShieldAlert, Phone, TrendingDown, Flame, Calendar, Activity, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: moodEntries, isLoading: moodLoading } = useMoodEntries();
  const { data: streaks, isLoading: streaksLoading } = useStreaks();
  const { data: safetyData, isLoading: safetyLoading } = useSafetyCheck();
  const seedMutation = useSeed();

  const entries = moodEntries ? [...moodEntries].reverse() : [];
  const last30 = entries.slice(-30);

  const chartData = last30.map(e => ({
    date: formatDate(e.date),
    mood: e.moodScore,
    anxiety: e.anxietyScore,
    energy: e.energyScore,
    sleep: e.sleepScore,
  }));

  const todayEntry = entries.find(e => e.date === new Date().toISOString().slice(0, 10));
  const avgMood = entries.length > 0 ? (entries.reduce((a, e) => a + e.moodScore, 0) / entries.length).toFixed(1) : "—";
  const avgAnxiety = entries.length > 0 ? (entries.reduce((a, e) => a + e.anxietyScore, 0) / entries.length).toFixed(1) : "—";
  const totalEntries = entries.length;

  const recent7 = entries.slice(-7);
  const recent7MoodAvg = recent7.length > 0 ? recent7.reduce((a, e) => a + e.moodScore, 0) / recent7.length : 0;

  const isLoading = moodLoading || streaksLoading || safetyLoading;
  const hasData = entries.length > 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Welcome to MindTrack</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Track your daily mood, build healthy habits, and get AI-powered support — all in one private, local dashboard.
          </p>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            data-testid="button-seed-demo"
          >
            Load demo data to explore
          </Button>
        </div>
      </div>
    );
  }

  const alerts = safetyData?.alerts || [];

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/mood">
          <Button variant="outline" size="sm" data-testid="button-log-mood">
            <Activity className="h-4 w-4 mr-2" />
            Log today's mood
          </Button>
        </Link>
      </div>

      {/* Safety Alerts */}
      {alerts.length > 0 && (
        <SafetyAlertBanner alerts={alerts} />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-avg-mood">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Avg Mood (all time)</span>
              {recent7MoodAvg <= 2 ? (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              ) : null}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular text-foreground">{avgMood}</span>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </div>
            {recent7.length > 0 && (
              <div className="text-[11px] text-muted-foreground mt-1">
                Last 7 days: {(recent7.reduce((a, e) => a + e.moodScore, 0) / recent7.length).toFixed(1)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-avg-anxiety">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Avg Anxiety</span>
              {Number(avgAnxiety) >= 4 ? (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              ) : null}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular text-foreground">{avgAnxiety}</span>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </div>
            {recent7.length > 0 && (
              <div className="text-[11px] text-muted-foreground mt-1">
                Last 7 days: {(recent7.reduce((a, e) => a + e.anxietyScore, 0) / recent7.length).toFixed(1)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-entries">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Entries Logged</span>
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular text-foreground">{totalEntries}</span>
              <span className="text-xs text-muted-foreground">days</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {todayEntry ? "Logged today" : "Not logged today"}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-best-streak">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Best Habit Streak</span>
              <Flame className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular text-foreground">
                {streaks && streaks.length > 0 ? Math.max(...streaks.map(s => s.bestStreak)) : 0}
              </span>
              <span className="text-xs text-muted-foreground">days</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {streaks && streaks.length > 0 ? streaks.length : 0} active habits
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood Trend Chart */}
      <Card data-testid="card-mood-chart">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Mood & Anxiety Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anxietyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" maxTickGap={40} />
              <YAxis domain={[0, 6]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--popover-border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <ReferenceLine y={2} stroke="#dc2626" strokeDasharray="2 4" opacity={0.4} />
              <Area type="monotone" dataKey="mood" stroke="#22c55e" strokeWidth={2} fill="url(#moodGrad)" name="Mood" />
              <Area type="monotone" dataKey="anxiety" stroke="#f97316" strokeWidth={2} fill="url(#anxietyGrad)" name="Anxiety" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Mood</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /> Anxiety</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-red-600 opacity-40" /> Low mood threshold</span>
          </div>
        </CardContent>
      </Card>

      {/* Habit Streaks */}
      <Card data-testid="card-habit-streaks">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Habit Streaks</CardTitle>
            <Link href="/habits">
              <Button variant="ghost" size="sm" className="text-xs h-7">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {streaks && streaks.length > 0 ? (
            streaks.slice(0, 5).map(s => (
              <div key={s.habitId} className="flex items-center gap-3" data-testid={`streak-${s.habitId}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: `${HABIT_COLORS[s.color] || "#5b8c6a"}22` }}>
                  <Flame className="h-4 w-4" style={{ color: HABIT_COLORS[s.color] || "#5b8c6a" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{s.habitName}</span>
                    <span className="text-xs tabular text-muted-foreground ml-2 whitespace-nowrap">
                      {s.currentStreak}d current · {s.bestStreak}d best
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={(s.weekCompletion / s.targetPerWeek) * 100} className="h-1.5" />
                    <span className="text-[10px] tabular text-muted-foreground whitespace-nowrap">
                      {s.weekCompletion}/{s.targetPerWeek} this week
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No habits yet. <Link href="/habits" className="text-primary underline">Create one</Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Entries Preview */}
      <Card data-testid="card-recent-entries">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Mood Entries</CardTitle>
            <Link href="/mood">
              <Button variant="ghost" size="sm" className="text-xs h-7">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entries.slice(-5).reverse().map(e => {
              const moodOpt = MOOD_OPTIONS.find(m => m.value === e.moodScore);
              const markers = JSON.parse(e.anxietyMarkers || "[]") as string[];
              return (
                <div key={e.date} className="flex items-center gap-3 py-2 border-b border-border last:border-0" data-testid={`entry-${e.date}`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${moodOpt?.color}22` }}>
                    {(() => { const Icon = moodOpt?.icon || Activity; return <Icon className="h-4 w-4" style={{ color: moodOpt?.color }} />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{moodOpt?.label}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                    </div>
                    {markers.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {markers.slice(0, 3).map(m => (
                          <Badge key={m} variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
                            {ANXIETY_MARKER_LABELS[m] || m}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {e.notes && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden md:block">{e.notes}</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SafetyAlertBanner({ alerts }: { alerts: SafetyAlert[] }) {
  const highAlerts = alerts.filter(a => a.severity === "high");
  const isHigh = highAlerts.length > 0;

  return (
    <Card
      data-testid="card-safety-alert"
      className={isHigh ? "border-destructive/40 bg-destructive/5" : "border-amber-500/30 bg-amber-500/5"}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${isHigh ? "bg-destructive/10" : "bg-amber-500/10"}`}>
            <ShieldAlert className={`h-5 w-5 ${isHigh ? "text-destructive" : "text-amber-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-semibold ${isHigh ? "text-destructive" : "text-amber-700 dark:text-amber-500"}`}>
                Safety Check Alert
              </h3>
              <Badge variant={isHigh ? "destructive" : "default"} className="text-[10px] h-4">
                {isHigh ? "Action recommended" : "Heads up"}
              </Badge>
            </div>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className="text-xs">
                  <p className="font-medium text-foreground">{alert.message}</p>
                  <p className="text-muted-foreground mt-0.5">{alert.details}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <a href="tel:988" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="destructive" className="h-8 text-xs w-full sm:w-auto" data-testid="button-crisis-988">
                  <Phone className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span>988 Crisis Line</span>
                </Button>
              </a>
              <Link href="/settings">
                <Button size="sm" variant="outline" className="h-8 text-xs w-full sm:w-auto" data-testid="button-safety-settings">
                  <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                  Review safety settings
                </Button>
              </Link>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              This is not a medical diagnosis or a substitute for professional care. If you are in immediate danger, call your local emergency number.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
