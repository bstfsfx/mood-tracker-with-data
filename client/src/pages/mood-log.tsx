import { useState } from "react";
import { useMoodEntries, useCreateMoodEntry, useDeleteMoodEntry } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  MOOD_OPTIONS,
  ENERGY_OPTIONS,
  ANXIETY_LEVELS,
  SLEEP_OPTIONS,
  ANXIETY_MARKER_LABELS,
  formatDateLong,
  todayStr,
} from "@/lib/constants";
import { ANXIETY_MARKERS } from "../../../shared/schema";
import { Trash2, Save, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MoodLog() {
  const { data: moodEntries, isLoading } = useMoodEntries();
  const createMutation = useCreateMoodEntry();
  const deleteMutation = useDeleteMoodEntry();
  const { toast } = useToast();

  const today = todayStr();
  const entries = moodEntries ? [...moodEntries].reverse() : [];
  const todayEntry = entries.find(e => e.date === today);

  const [selectedDate, setSelectedDate] = useState(today);
  const [moodScore, setMoodScore] = useState(todayEntry?.moodScore || 3);
  const [energyScore, setEnergyScore] = useState(todayEntry?.energyScore || 3);
  const [anxietyScore, setAnxietyScore] = useState(todayEntry?.anxietyScore || 2);
  const [sleepScore, setSleepScore] = useState(todayEntry?.sleepScore || 3);
  const [anxietyMarkers, setAnxietyMarkers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [historyPage, setHistoryPage] = useState(0);

  const perPage = 8;
  const historyEntries = entries.slice(historyPage * perPage, (historyPage + 1) * perPage);
  const totalPages = Math.ceil(entries.length / perPage);

  const handleSave = () => {
    createMutation.mutate({
      date: selectedDate,
      moodScore,
      energyScore,
      anxietyScore,
      sleepScore,
      anxietyMarkers: JSON.stringify(anxietyMarkers),
      notes,
    }, {
      onSuccess: () => {
        toast({ title: "Mood entry saved", description: formatDateLong(selectedDate) });
      },
    });
  };

  const handleDelete = (date: string) => {
    deleteMutation.mutate(date, {
      onSuccess: () => {
        toast({ title: "Entry deleted", description: formatDateLong(date) });
      },
    });
  };

  const toggleMarker = (id: string) => {
    setAnxietyMarkers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Mood Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track how you feel each day</p>
      </div>

      {/* Entry Form */}
      <Card data-testid="card-mood-form">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{formatDateLong(selectedDate)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Mood Selector */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">How is your mood?</Label>
            <div className="flex gap-2 flex-wrap">
              {MOOD_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = moodScore === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMoodScore(opt.value)}
                    data-testid={`button-mood-${opt.value}`}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all min-w-[60px]",
                      isSelected ? "border-2" : "border-border opacity-60 hover:opacity-100"
                    )}
                    style={isSelected ? { borderColor: opt.color, backgroundColor: `${opt.color}15` } : {}}
                  >
                    <Icon className="h-5 w-5" style={{ color: opt.color }} strokeWidth={2} />
                    <span className="text-[11px] font-medium text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Selector */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Energy level</Label>
            <div className="flex gap-2 flex-wrap">
              {ENERGY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = energyScore === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setEnergyScore(opt.value)}
                    data-testid={`button-energy-${opt.value}`}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all",
                      isSelected ? "border-2" : "border-border opacity-60 hover:opacity-100"
                    )}
                    style={isSelected ? { borderColor: opt.color, backgroundColor: `${opt.color}15` } : {}}
                  >
                    <Icon className="h-4 w-4" style={{ color: opt.color }} strokeWidth={2} />
                    <span className="text-[11px] font-medium text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anxiety Selector */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Anxiety level</Label>
            <div className="flex gap-2 flex-wrap">
              {ANXIETY_LEVELS.map(opt => {
                const isSelected = anxietyScore === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAnxietyScore(opt.value)}
                    data-testid={`button-anxiety-${opt.value}`}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all",
                      isSelected ? "border-2" : "border-border opacity-60 hover:opacity-100"
                    )}
                    style={isSelected ? { borderColor: opt.color, backgroundColor: `${opt.color}15` } : {}}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }} />
                    <span className="text-[11px] font-medium text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sleep Selector */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Sleep quality</Label>
            <div className="flex gap-2 flex-wrap">
              {SLEEP_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = sleepScore === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSleepScore(opt.value)}
                    data-testid={`button-sleep-${opt.value}`}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all",
                      isSelected ? "border-2" : "border-border opacity-60 hover:opacity-100"
                    )}
                    style={isSelected ? { borderColor: opt.color, backgroundColor: `${opt.color}15` } : {}}
                  >
                    <Icon className="h-4 w-4" style={{ color: opt.color }} strokeWidth={2} />
                    <span className="text-[11px] font-medium text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anxiety Markers */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Anxiety markers (optional)
            </Label>
            <div className="flex flex-wrap gap-2">
              {ANXIETY_MARKERS.map(marker => {
                const isSelected = anxietyMarkers.includes(marker.id);
                return (
                  <button
                    key={marker.id}
                    onClick={() => toggleMarker(marker.id)}
                    data-testid={`button-marker-${marker.id}`}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    )}
                  >
                    {marker.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-xs text-muted-foreground mb-2 block">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What's on your mind today?"
              className="min-h-[80px] resize-none text-sm"
              data-testid="input-notes"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending}
              data-testid="button-save-mood"
            >
              <Save className="h-4 w-4 mr-2" />
              Save entry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card data-testid="card-mood-history">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">History</CardTitle>
            <span className="text-xs text-muted-foreground">{entries.length} entries</span>
          </div>
        </CardHeader>
        <CardContent>
          {historyEntries.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Heart className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No entries yet. Start logging today.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {historyEntries.map(entry => {
                  const moodOpt = MOOD_OPTIONS.find(m => m.value === entry.moodScore);
                  const markers = JSON.parse(entry.anxietyMarkers || "[]") as string[];
                  return (
                    <div
                      key={entry.date}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-foreground/20 transition-colors"
                      data-testid={`history-entry-${entry.date}`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: `${moodOpt?.color}18` }}>
                        {(() => { const Icon = moodOpt?.icon || Heart; return <Icon className="h-4 w-4" style={{ color: moodOpt?.color }} />; })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{moodOpt?.label}</span>
                          <span className="text-xs text-muted-foreground">{formatDateLong(entry.date)}</span>
                        </div>
                        <div className="flex gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          <span>Energy: {ENERGY_OPTIONS.find(e => e.value === entry.energyScore)?.label}</span>
                          <span>·</span>
                          <span>Anxiety: {ANXIETY_LEVELS.find(a => a.value === entry.anxietyScore)?.label}</span>
                          <span>·</span>
                          <span>Sleep: {SLEEP_OPTIONS.find(s => s.value === entry.sleepScore)?.label}</span>
                        </div>
                        {markers.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {markers.map(m => (
                              <Badge key={m} variant="secondary" className="text-[10px] h-4 px-1.5">
                                {ANXIETY_MARKER_LABELS[m] || m}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{entry.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(entry.date)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${entry.date}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                    disabled={historyPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {historyPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={historyPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
