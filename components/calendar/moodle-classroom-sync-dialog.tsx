"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, BookOpen, CheckCircle2, Loader2, Sparkles, AlertCircle, Link as LinkIcon, FileText } from "lucide-react";
import { SAMPLE_MOODLE_ICAL_FEED } from "@/lib/sync/moodle-ical";
import { toast } from "sonner";

interface MoodleClassroomSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncSuccess: () => void;
}

export function MoodleClassroomSyncDialog({
  open,
  onOpenChange,
  onSyncSuccess,
}: MoodleClassroomSyncDialogProps) {
  const [activeTab, setActiveTab] = useState<"moodle" | "classroom">("moodle");
  const [moodleUrl, setMoodleUrl] = useState("");
  const [moodleIcalText, setMoodleIcalText] = useState("");
  const [showRawIcal, setShowRawIcal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSyncMoodle = async () => {
    setIsSubmitting(true);
    try {
      const payload = moodleUrl.trim()
        ? { action: "sync_moodle_url", icalUrl: moodleUrl.trim() }
        : { action: "sync_moodle_text", icalText: moodleIcalText.trim() || SAMPLE_MOODLE_ICAL_FEED };

      const res = await fetch("/api/sync/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Synced ${data.syncedCount} real Moodle deadlines into Stress Heatmap & Kanban!`);
        onSyncSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || "Moodle sync failed.");
      }
    } catch {
      toast.error("Failed to connect to Moodle feed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncClassroom = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sync/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_classroom" }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Imported ${data.syncedCount} Google Classroom assignments into Stress Heatmap & Kanban!`);
        onSyncSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || "Classroom sync failed.");
      }
    } catch {
      toast.error("Failed to sync Classroom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadSampleMoodle = () => {
    setMoodleIcalText(SAMPLE_MOODLE_ICAL_FEED);
    setShowRawIcal(true);
    toast.info("Loaded sample engineering Moodle feed (CS301 & EE301 deadlines). Click Sync to import!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-primary" />
            Connect College Moodle & Google Classroom
          </DialogTitle>
          <DialogDescription className="text-xs">
            Sync real college assignment deadlines, lab submission dates, and quizzes into Lumina.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-3">
            <TabsTrigger value="moodle" className="text-xs flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> College Moodle (iCal)
            </TabsTrigger>
            <TabsTrigger value="classroom" className="text-xs flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Google Classroom
            </TabsTrigger>
          </TabsList>

          {/* Moodle Tab */}
          <TabsContent value="moodle" className="space-y-3 mt-0">
            {/* Step-by-Step Instructions */}
            <div className="bg-accent/40 border rounded-lg p-3 space-y-1.5 text-xs">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Zero Admin Permissions Required:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                <li>Log in to your university Moodle portal.</li>
                <li>Go to <strong>Calendar</strong> (left navigation) → scroll down and click <strong>&quot;Export Calendar&quot;</strong>.</li>
                <li>Select <strong>&quot;All events&quot;</strong> and <strong>&quot;Recent and next 60 days&quot;</strong> → Click <strong>&quot;Get calendar URL&quot;</strong>.</li>
                <li>Paste your private Moodle export URL below!</li>
              </ol>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="moodle-url" className="text-xs flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                Moodle Calendar Export URL
              </Label>
              <Input
                id="moodle-url"
                placeholder="https://moodle.yourcollege.edu/calendar/export_execute.php?userid=..."
                value={moodleUrl}
                onChange={(e) => setMoodleUrl(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Toggle Raw iCal / Sample */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowRawIcal(!showRawIcal)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                {showRawIcal ? "Hide raw .ics text box" : "Or paste / test raw .ics text"}
              </button>

              <button
                type="button"
                onClick={handleLoadSampleMoodle}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Load Sample Moodle Feed
              </button>
            </div>

            {showRawIcal && (
              <div className="space-y-1">
                <Label className="text-xs">Raw iCalendar (.ics) Content</Label>
                <Textarea
                  value={moodleIcalText}
                  onChange={(e) => setMoodleIcalText(e.target.value)}
                  placeholder="BEGIN:VCALENDAR..."
                  className="font-mono text-xs min-h-[90px]"
                />
              </div>
            )}
          </TabsContent>

          {/* Google Classroom Tab */}
          <TabsContent value="classroom" className="space-y-3 mt-0">
            <div className="bg-accent/40 border rounded-lg p-3 space-y-1.5 text-xs">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Google Classroom Live Coursework:
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connect your institutional Google account to fetch coursework due dates from your registered Google Classroom courses.
              </p>
            </div>

            <div className="p-4 border rounded-lg text-center space-y-2">
              <BookOpen className="w-8 h-8 text-blue-500 mx-auto" />
              <div className="text-sm font-semibold">Google Classroom Integration</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Sync pending assignments and lab manuals directly to your Stress Heatmap.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncClassroom}
                disabled={isSubmitting}
                className="gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Import Classroom Coursework
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          {activeTab === "moodle" ? (
            <Button size="sm" onClick={handleSyncMoodle} disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
              Sync Moodle Deadlines
            </Button>
          ) : (
            <Button size="sm" onClick={handleSyncClassroom} disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
              Sync Google Classroom
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
