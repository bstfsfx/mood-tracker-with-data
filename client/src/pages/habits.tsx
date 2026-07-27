import { useState } from "react";
import { useHabits, useCreateHabit, useToggleHabit, useDeleteHabit, useStreaks, useHabitCompletions } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HABIT_COLORS, todayStr } from "@/lib/constants";
import { Plus, Flame, Trash2, Check, Target, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HABIT_COLOR_OPTIONS = [
  { id: "sage", color: "#5b8c6a", label: "Sage" },
  { id: "blue", color: "#4a90b8", label: "Blue" },
  { id: "amber", color: "#d4a04c", label: "Amber" },
  { id: "rose", color: "#c4758a", label: "Rose" },
  { id: "lavender", color: "#8b7ec4", label: "Lavender" },
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function Habits() {
  const { data: habits, isLoading } = useHabits();
  const { data: streaks } = useStreaks();
  const { data: completions } = useHabitCompletions();
  const createMutation = useCreateHabit();
  const toggleMutation = useToggleHabit();
  const deleteMutation = useDeleteHabit();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("sage");
  const [targetPerWeek, setTargetPerWeek] = useState(7);

  const today = todayStr();

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      color,
      targetPerWeek,
      icon: "check-circle",
    }, {
      onSuccess: () => {
        toast({ title: "Habit created", description: name });
        setName("");
        setDescription("");
        setColor("sage");
        setTargetPerWeek(7);
        setShowForm(false);
      },
    });
  };

  const handleToggle = (habitId: number) => {
    toggleMutation.mutate({ habitId, date: today });
  };

  const handleDelete = (id: number, name: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Habit deleted", description: name }),
    });
  };

  const isCompletedToday = (habitId: number) => {
    return completions?.some(c => c.habitId === habitId && c.date === today && c.completed) || false;
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  };

  const last7Days = getLast7Days();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const activeHabits = habits?.filter(h => h.active) || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Habits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Build and maintain healthy routines</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-toggle-form" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New habit
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card data-testid="card-create-habit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Create a new habit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="habit-name" className="text-xs text-muted-foreground mb-1.5 block">Name</Label>
              <Input
                id="habit-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Morning meditation"
                data-testid="input-habit-name"
              />
            </div>
            <div>
              <Label htmlFor="habit-desc" className="text-xs text-muted-foreground mb-1.5 block">Description (optional)</Label>
              <Textarea
                id="habit-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does this habit involve?"
                className="min-h-[60px] resize-none text-sm"
                data-testid="input-habit-desc"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Color</Label>
                <div className="flex gap-2">
                  {HABIT_COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setColor(opt.id)}
                      data-testid={`button-color-${opt.id}`}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        color === opt.id ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: opt.color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Target per week: {targetPerWeek} days</Label>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={targetPerWeek}
                  onChange={e => setTargetPerWeek(Number(e.target.value))}
                  className="w-full accent-primary"
                  data-testid="input-target-week"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!name.trim() || createMutation.isPending} size="sm" data-testid="button-create-habit">
                Create habit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Habit Cards */}
      {activeHabits.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Target className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No habits yet. Create one to start tracking.</p>
          <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Create your first habit
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeHabits.map(habit => {
            const streak = streaks?.find(s => s.habitId === habit.id);
            const completedToday = isCompletedToday(habit.id);
            const habitColor = HABIT_COLORS[habit.color] || "#5b8c6a";

            return (
              <Card key={habit.id} data-testid={`habit-card-${habit.id}`} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(habit.id)}
                      data-testid={`button-toggle-habit-${habit.id}`}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all flex-shrink-0 mt-0.5",
                        completedToday
                          ? "border-transparent text-white"
                          : "border-border hover:border-foreground/30 text-muted-foreground"
                      )}
                      style={completedToday ? { backgroundColor: habitColor } : {}}
                    >
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: habitColor }} />
                          <span className="text-sm font-semibold text-foreground">{habit.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {streak && streak.currentStreak > 0 && (
                            <span className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400" data-testid={`streak-current-${habit.id}`}>
                              <Flame className="h-3.5 w-3.5" />
                              {streak.currentStreak}d
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(habit.id, habit.name)}
                            data-testid={`button-delete-habit-${habit.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {habit.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>
                      )}

                      {/* Week view */}
                      <div className="flex items-center gap-1.5 mt-3">
                        {last7Days.map((date, i) => {
                          const isCompleted = completions?.some(c => c.habitId === habit.id && c.date === date && c.completed) || false;
                          const isToday = date === today;
                          return (
                            <div key={date} className="flex flex-col items-center gap-1">
                              <span className={cn(
                                "text-[10px]",
                                isToday ? "text-foreground font-semibold" : "text-muted-foreground"
                              )}>
                                {WEEKDAYS[new Date(date + "T00:00:00").getDay()]}
                              </span>
                              <div
                                className={cn(
                                  "h-6 w-6 rounded-md flex items-center justify-center transition-colors",
                                  isCompleted ? "" : "bg-muted"
                                )}
                                style={isCompleted ? { backgroundColor: `${habitColor}30`, border: `1px solid ${habitColor}` } : {}}
                              >
                                {isCompleted && <Check className="h-3 w-3" style={{ color: habitColor }} strokeWidth={3} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Progress */}
                      {streak && (
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={(streak.weekCompletion / habit.targetPerWeek) * 100} className="h-1.5" />
                          <span className="text-[10px] tabular text-muted-foreground whitespace-nowrap">
                            {streak.weekCompletion}/{habit.targetPerWeek}
                          </span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">Best: {streak.bestStreak}d</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
