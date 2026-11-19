"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Mail, Flame, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { StressHeatmap } from "@/components/calendar/stress-heatmap";
import { MoodleClassroomSyncDialog } from "@/components/calendar/moodle-classroom-sync-dialog";
import { calculateDailyStress, type StressMeterSummary } from "@/lib/sync/stress-meter";
import { toast } from "sonner";
import type { AcademicEmail, ScannedDeadline } from "@/lib/sync/scanner";

export default function CalendarPage() {
  const [summary, setSummary] = useState<StressMeterSummary | null>(null);
  const [emails, setEmails] = useState<AcademicEmail[]>([]);
  const [scannedDeadlines, setScannedDeadlines] = useState<ScannedDeadline[]>([]);
  const [lastSynced, setLastSynced] = useState<string>(new Date().toISOString());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("heatmap");
  const [moodleOpen, setMoodleOpen] = useState(false);

  const loadSyncData = async () => {
    try {
      const res = await fetch("/api/sync/gmail-calendar");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.stressSummary);
        setEmails(data.emails || []);
        setScannedDeadlines(data.scannedDeadlines || []);
        setLastSynced(data.lastSynced || new Date().toISOString());
      }
    } catch {
      toast.error("Failed to load Calendar & Gmail sync data.");
    }
  };

  useEffect(() => {
    loadSyncData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync/gmail-calendar", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.stressSummary);
        setEmails(data.emails || []);
        setScannedDeadlines(data.scannedDeadlines || []);
        setLastSynced(data.lastSynced);
        toast.success("Gmail & Google Calendar sync complete! Stress Heatmap updated.");
      }
    } catch {
      toast.error("Sync operation failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Academic Calendar & Stress Meter</h2>
            <Badge variant="outline" className="text-xs text-blue-500 border-blue-500/30">
              Gmail & Calendar Live
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Scans academic keywords in emails to generate your color-coded deadline collision heatmap.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMoodleOpen(true)}
            className="text-xs h-9 border-primary/40 hover:border-primary text-primary gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Connect Moodle / Classroom
          </Button>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-56 h-9">
              <TabsTrigger value="heatmap" className="text-xs flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" /> Heatmap
              </TabsTrigger>
              <TabsTrigger value="emails" className="text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Scanned ({emails.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <MoodleClassroomSyncDialog
        open={moodleOpen}
        onOpenChange={setMoodleOpen}
        onSyncSuccess={loadSyncData}
      />

      {summary ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="heatmap" className="mt-0">
            <StressHeatmap
              summary={summary}
              onSync={handleManualSync}
              isSyncing={isSyncing}
              lastSynced={lastSynced}
            />
          </TabsContent>

          <TabsContent value="emails" className="mt-0 space-y-4">
            <Card className="border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Academic Keyword Email Feed
                </CardTitle>
                <CardDescription className="text-xs">
                  Scanned Gmail and Moodle emails with detected deadlines and urgency weights.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {emails.map((mail) => {
                  const deadline = scannedDeadlines.find((d) => d.emailId === mail.id);

                  return (
                    <div
                      key={mail.id}
                      className="p-3.5 rounded-lg border bg-card space-y-2 text-xs transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{mail.subject}</span>
                            <Badge
                              variant="outline"
                              className={
                                mail.source === "gmail"
                                  ? "text-red-500 border-red-500/30 text-[10px]"
                                  : "text-amber-500 border-amber-500/30 text-[10px]"
                              }
                            >
                              {mail.source.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            From: {mail.sender} • Received: {new Date(mail.receivedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {deadline && (
                          <div className="text-right shrink-0">
                            <Badge
                              variant="outline"
                              className={
                                deadline.urgency === "high"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              }
                            >
                              Due: {deadline.detectedDate}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <p className="text-muted-foreground leading-relaxed">{mail.snippet}</p>

                      {deadline && (
                        <div className="pt-2 border-t flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-muted-foreground font-semibold">Matched Keywords:</span>
                          {deadline.matchedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-medium"
                            >
                              #{kw}
                            </span>
                          ))}
                          <span className="ml-auto text-muted-foreground font-mono">
                            Stress Weight: {deadline.stressScore}/10
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading Academic Stress Heatmap...
        </div>
      )}
    </div>
  );
}
