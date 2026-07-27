import { useState } from "react";
import { useAIRoutines, useCreateAIRoutine, useUpdateAIRoutine, useDeleteAIRoutine } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AI_STYLE_PREVIEWS } from "@/lib/constants";
import { AI_ROUTINE_STYLES } from "../../../shared/schema";
import { Plus, Bot, Clock, Trash2, Save, Play, Sparkles, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AISupport() {
  const { data: routines, isLoading } = useAIRoutines();
  const createMutation = useCreateAIRoutine();
  const updateMutation = useUpdateAIRoutine();
  const deleteMutation = useDeleteAIRoutine();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [style, setStyle] = useState("supportive");
  const [customPrompt, setCustomPrompt] = useState("");
  const [previewing, setPreviewing] = useState<number | null>(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      checkInTime,
      style,
      customPrompt: customPrompt.trim(),
      enabled: true,
    }, {
      onSuccess: () => {
        toast({ title: "Routine created", description: name });
        setName("");
        setCheckInTime("09:00");
        setStyle("supportive");
        setCustomPrompt("");
        setShowForm(false);
      },
    });
  };

  const handleToggle = (id: number, enabled: boolean) => {
    updateMutation.mutate({ id, enabled: !enabled });
  };

  const handleDelete = (id: number, routineName: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Routine deleted", description: routineName }),
    });
  };

  const handleSavePrompt = (id: number, prompt: string) => {
    updateMutation.mutate({ id, customPrompt: prompt }, {
      onSuccess: () => toast({ title: "Prompt updated" }),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Support Routine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure your emotional support check-ins</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" data-testid="button-toggle-routine-form">
          <Plus className="h-4 w-4 mr-1.5" />
          New routine
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-primary/5 border-primary/20" data-testid="card-ai-info">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">How this works</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define your own AI emotional support routines with custom prompts and check-in styles.
                Each routine generates a supportive message preview based on the style you choose.
                This is not a substitute for professional mental health care.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {showForm && (
        <Card data-testid="card-create-routine">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Create a new routine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="routine-name" className="text-xs text-muted-foreground mb-1.5 block">Routine name</Label>
              <Input
                id="routine-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Morning Check-in"
                data-testid="input-routine-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check-in-time" className="text-xs text-muted-foreground mb-1.5 block">Check-in time</Label>
                <Input
                  id="check-in-time"
                  type="time"
                  value={checkInTime}
                  onChange={e => setCheckInTime(e.target.value)}
                  data-testid="input-checkin-time"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Style</Label>
                <select
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid="select-style"
                >
                  {AI_ROUTINE_STYLES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="custom-prompt" className="text-xs text-muted-foreground mb-1.5 block">
                Custom prompt (optional)
              </Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Describe what you want the AI to do during this check-in..."
                className="min-h-[80px] resize-none text-sm"
                data-testid="input-custom-prompt"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Preview: "{AI_STYLE_PREVIEWS[style]?.slice(0, 100)}..."
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!name.trim() || createMutation.isPending} size="sm" data-testid="button-create-routine">
                Create routine
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Routine Cards */}
      {routines && routines.length > 0 ? (
        <div className="space-y-3">
          {routines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onSavePrompt={handleSavePrompt}
              previewing={previewing}
              setPreviewing={setPreviewing}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="flex flex-col items-center py-16 text-center">
            <Bot className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No routines yet. Create one to get started.</p>
            <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Create your first routine
            </Button>
          </div>
        )
      )}
    </div>
  );
}

interface RoutineCardProps {
  routine: any;
  onToggle: (id: number, enabled: boolean) => void;
  onDelete: (id: number, name: string) => void;
  onSavePrompt: (id: number, prompt: string) => void;
  previewing: number | null;
  setPreviewing: (id: number | null) => void;
  isUpdating: boolean;
}

function RoutineCard({ routine, onToggle, onDelete, onSavePrompt, previewing, setPreviewing, isUpdating }: RoutineCardProps) {
  const [editPrompt, setEditPrompt] = useState(routine.customPrompt || "");
  const [isEditing, setIsEditing] = useState(false);
  const styleInfo = AI_ROUTINE_STYLES.find(s => s.id === routine.style);

  return (
    <Card data-testid={`routine-card-${routine.id}`} className={cn(!routine.enabled && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{routine.name}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {styleInfo?.label || routine.style}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={routine.enabled}
                  onCheckedChange={() => onToggle(routine.id, routine.enabled)}
                  data-testid={`switch-enabled-${routine.id}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(routine.id, routine.name)}
                  data-testid={`button-delete-routine-${routine.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {routine.checkInTime}
              </span>
              <span>·</span>
              <span>{styleInfo?.description}</span>
            </div>

            {/* Custom Prompt */}
            <div className="mt-3">
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editPrompt}
                    onChange={e => setEditPrompt(e.target.value)}
                    className="min-h-[60px] resize-none text-xs"
                    data-testid={`textarea-edit-prompt-${routine.id}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => { setIsEditing(false); setEditPrompt(routine.customPrompt || ""); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => { onSavePrompt(routine.id, editPrompt); setIsEditing(false); }}
                      disabled={isUpdating}
                      data-testid={`button-save-prompt-${routine.id}`}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                routine.customPrompt && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left w-full"
                    data-testid={`button-edit-prompt-${routine.id}`}
                  >
                    {routine.customPrompt}
                  </button>
                )
              )}
              {!routine.customPrompt && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-primary hover:underline"
                  data-testid={`button-add-prompt-${routine.id}`}
                >
                  + Add custom prompt
                </button>
              )}
            </div>

            {/* Preview */}
            {previewing === routine.id && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border" data-testid={`preview-${routine.id}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageCircle className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Support Preview</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {AI_STYLE_PREVIEWS[routine.style] || AI_STYLE_PREVIEWS.supportive}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPreviewing(previewing === routine.id ? null : routine.id)}
            data-testid={`button-preview-${routine.id}`}
          >
            <Play className="h-3 w-3 mr-1" />
            {previewing === routine.id ? "Hide preview" : "Preview check-in"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
