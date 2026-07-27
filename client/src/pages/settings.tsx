import { useState, useEffect } from "react";
import { useSafetySettings, useUpdateSafetySettings, useSafetyCheck } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { ShieldCheck, Phone, AlertTriangle, Heart, ExternalLink, Info, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: settings, isLoading } = useSafetySettings();
  const { data: safetyCheck } = useSafetyCheck();
  const updateMutation = useUpdateSafetySettings();
  const { toast } = useToast();

  const [moodThreshold, setMoodThreshold] = useState(2);
  const [sustainedDays, setSustainedDays] = useState(7);
  const [anxietyThreshold, setAnxietyThreshold] = useState(4);
  const [anxietyMarkerDays, setAnxietyMarkerDays] = useState(3);
  const [crisisContactName, setCrisisContactName] = useState("");
  const [crisisContactPhone, setCrisisContactPhone] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setMoodThreshold(settings.moodThreshold);
      setSustainedDays(settings.sustainedDays);
      setAnxietyThreshold(settings.anxietyThreshold);
      setAnxietyMarkerDays(settings.anxietyMarkerDays);
      setCrisisContactName(settings.crisisContactName || "");
      setCrisisContactPhone(settings.crisisContactPhone || "");
      setEnabled(settings.enabled);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      moodThreshold,
      sustainedDays,
      anxietyThreshold,
      anxietyMarkerDays,
      crisisContactName,
      crisisContactPhone,
      enabled,
    }, {
      onSuccess: () => toast({ title: "Safety settings saved" }),
    });
  };

  const handleToggleEnabled = () => {
    const newVal = !enabled;
    setEnabled(newVal);
    updateMutation.mutate({ enabled: newVal });
  };

  if (isLoading || !settings) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure safety alerts and crisis resources</p>
      </div>

      {/* Safety Check Status */}
      <Card data-testid="card-safety-status" className={safetyCheck && safetyCheck.alerts.length > 0 ? "border-amber-500/40 bg-amber-500/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${safetyCheck && safetyCheck.alerts.length > 0 ? "bg-amber-500/10" : "bg-green-500/10"}`}>
              <ShieldCheck className={`h-5 w-5 ${safetyCheck && safetyCheck.alerts.length > 0 ? "text-amber-600" : "text-green-600"}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Safety Check Status</h3>
              {safetyCheck && safetyCheck.alerts.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {safetyCheck.alerts.length} active alert{safetyCheck.alerts.length > 1 ? "s" : ""} detected based on your recent mood data.
                  Visit the dashboard for details.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No safety alerts. Your recent mood data is within healthy ranges based on current thresholds.
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={enabled} onCheckedChange={handleToggleEnabled} data-testid="switch-safety-enabled" />
                <span className="text-xs text-muted-foreground">Safety monitoring {enabled ? "active" : "paused"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Settings */}
      <Card data-testid="card-thresholds">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Mood Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Low mood threshold</Label>
              <span className="text-sm font-semibold tabular text-foreground" data-testid="value-mood-threshold">{moodThreshold}/5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={moodThreshold}
              onChange={e => setMoodThreshold(Number(e.target.value))}
              className="w-full accent-primary"
              data-testid="input-mood-threshold"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Alert triggers when mood is at or below this score for the sustained period below.
            </p>
          </div>

          {/* Sustained Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Sustained low mood period</Label>
              <span className="text-sm font-semibold tabular text-foreground" data-testid="value-sustained-days">{sustainedDays} days</span>
            </div>
            <input
              type="range"
              min={3}
              max={14}
              value={sustainedDays}
              onChange={e => setSustainedDays(Number(e.target.value))}
              className="w-full accent-primary"
              data-testid="input-sustained-days"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Number of consecutive days at/below threshold before alert triggers. Default: 7 days.
            </p>
          </div>

          {/* Anxiety Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">High anxiety threshold</Label>
              <span className="text-sm font-semibold tabular text-foreground" data-testid="value-anxiety-threshold">{anxietyThreshold}/5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={anxietyThreshold}
              onChange={e => setAnxietyThreshold(Number(e.target.value))}
              className="w-full accent-primary"
              data-testid="input-anxiety-threshold"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Alert triggers when anxiety is at or above this score for the sustained period.
            </p>
          </div>

          {/* Anxiety Marker Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Anxiety marker frequency</Label>
              <span className="text-sm font-semibold tabular text-foreground" data-testid="value-marker-days">{anxietyMarkerDays} days</span>
            </div>
            <input
              type="range"
              min={2}
              max={7}
              value={anxietyMarkerDays}
              onChange={e => setAnxietyMarkerDays(Number(e.target.value))}
              className="w-full accent-primary"
              data-testid="input-marker-days"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Consecutive days with anxiety markers (panic, racing thoughts, etc.) before alert triggers.
            </p>
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm" data-testid="button-save-settings">
            Save thresholds
          </Button>
        </CardContent>
      </Card>

      {/* Crisis Contact */}
      <Card data-testid="card-crisis-contact">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Crisis Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact-name" className="text-xs text-muted-foreground mb-1.5 block">Trusted person's name</Label>
            <Input
              id="contact-name"
              value={crisisContactName}
              onChange={e => setCrisisContactName(e.target.value)}
              placeholder="e.g. My therapist, Dr. Lee"
              data-testid="input-contact-name"
            />
          </div>
          <div>
            <Label htmlFor="contact-phone" className="text-xs text-muted-foreground mb-1.5 block">Phone number</Label>
            <Input
              id="contact-phone"
              value={crisisContactPhone}
              onChange={e => setCrisisContactPhone(e.target.value)}
              placeholder="e.g. +1-555-0100"
              data-testid="input-contact-phone"
            />
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm" variant="outline" data-testid="button-save-contact">
            Save contact
          </Button>
        </CardContent>
      </Card>

      {/* Crisis Resources */}
      <Card data-testid="card-crisis-resources" className="bg-destructive/5 border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Emergency Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            If you or someone you know is in immediate danger, contact emergency services right away.
            The resources below are available 24/7.
          </p>

          <div className="space-y-2">
            <a href="tel:988" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-foreground/20 transition-colors">
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-destructive" />
                <div>
                  <div className="text-sm font-medium text-foreground">988 Suicide & Crisis Lifeline</div>
                  <div className="text-[11px] text-muted-foreground">Call or text 988 · Available 24/7</div>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>

            <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-foreground/20 transition-colors">
              <div className="flex items-center gap-2.5">
                <Heart className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium text-foreground">988lifeline.org</div>
                  <div className="text-[11px] text-muted-foreground">Online chat available</div>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>

            <a href="sms:741741" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-foreground/20 transition-colors">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium text-foreground">Crisis Text Line</div>
                  <div className="text-[11px] text-muted-foreground">Text HOME to 741741</div>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>

          <div className="flex items-start gap-2 pt-2 border-t border-border">
            <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              MindTrack is a self-tracking tool, not a medical device. It does not diagnose, treat, or prevent
              any condition. Always consult a qualified mental health professional for clinical advice.
              Thresholds are based on wellness-tracking best practices including PHQ-9 and GAD-7 screening guidelines.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
