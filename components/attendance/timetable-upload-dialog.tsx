"use client";

import { useState, useMemo } from "react";
import { Upload, FileText, Image as ImageIcon, Loader2, Check, Trash2, Plus, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  extractTextFromImage, 
  extractTextFromPDF, 
  parseTimetableText, 
  extractUniqueSubjects,
  type ParsedTimetableEntry 
} from "@/lib/ocr/timetable-parser";
import type { Subject, ClassSession } from "@/lib/types";

interface TimetableUploadDialogProps {
  existingSubjects: Subject[];
  onImportComplete: () => void;
}

const DAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

export function TimetableUploadDialog({ existingSubjects, onImportComplete }: TimetableUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [parsedEntries, setParsedEntries] = useState<ParsedTimetableEntry[]>([]);
  const [syncToAttendance, setSyncToAttendance] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const detectedSubjects = useMemo(() => extractUniqueSubjects(parsedEntries), [parsedEntries]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedEntries([]);
    }
  };

  const handleRunOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setOcrProgress(5);

    try {
      let extractedText = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setOcrProgress(30);
        extractedText = await extractTextFromPDF(file);
        setOcrProgress(100);
      } else {
        extractedText = await extractTextFromImage(file, (p) => setOcrProgress(p));
      }

      if (!extractedText.trim()) {
        toast.error("Could not extract any text from the document. Please try a clearer image.");
        setIsProcessing(false);
        return;
      }

      const results = parseTimetableText(extractedText);
      if (results.length === 0) {
        toast.warning("Extracted text, but could not detect structured schedule times. You can add entries manually below.");
        setParsedEntries([
          {
            id: `manual-${Date.now()}`,
            subjectName: "Sample Subject",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "10:00",
            location: "Room 101",
          },
        ]);
      } else {
        setParsedEntries(results);
        const uniqueCount = extractUniqueSubjects(results).length;
        toast.success(`OCR detected ${results.length} class session(s) across ${uniqueCount} unique subject(s)!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run OCR";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEntryChange = (id: string, field: keyof ParsedTimetableEntry, value: any) => {
    setParsedEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveEntry = (id: string) => {
    setParsedEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddManualEntry = () => {
    setParsedEntries((prev) => [
      ...prev,
      {
        id: `entry-${Date.now()}`,
        subjectName: "",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        location: "",
      },
    ]);
  };

  const handleImport = async () => {
    if (parsedEntries.length === 0) {
      toast.error("No entries to import.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Build map of existing subjects
      const subjectMap = new Map<string, string>(); // name.toLowerCase() -> subjectId
      existingSubjects.forEach((s) => {
        subjectMap.set(s.name.toLowerCase().trim(), s.id);
        if (s.code) subjectMap.set(s.code.toLowerCase().trim(), s.id);
      });

      let newSubjectsCreated = 0;

      // 2. Pre-create missing unique subjects if auto-sync is enabled
      if (syncToAttendance) {
        for (const sub of detectedSubjects) {
          const key = sub.name.toLowerCase().trim();
          const codeKey = sub.code ? sub.code.toLowerCase().trim() : "";
          if (!subjectMap.has(key) && (!codeKey || !subjectMap.has(codeKey))) {
            const newSubRes = await fetch("/api/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: sub.name,
                code: sub.code || "",
                color: sub.color,
                type: "college",
              }),
            });
            if (newSubRes.ok) {
              const created = await newSubRes.json();
              if (created && created.id) {
                const newId = String(created.id);
                subjectMap.set(key, newId);
                if (codeKey) subjectMap.set(codeKey, newId);
                newSubjectsCreated++;
              }
            }
          }
        }
      }

      // 3. Map parsed entries to final sessions
      const finalSessions: ClassSession[] = [];

      for (const entry of parsedEntries) {
        const cleanName = entry.subjectName.trim() || entry.subjectCode || "Class";
        const key = cleanName.toLowerCase();
        const codeKey = entry.subjectCode ? entry.subjectCode.toLowerCase().trim() : "";
        let subjectId = subjectMap.get(key) || (codeKey ? subjectMap.get(codeKey) : undefined);

        if (!subjectId) {
          // If auto-sync was disabled or subject wasn't in map, attempt creation
          const newSubRes = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: cleanName,
              code: entry.subjectCode || "",
              color: "#3b82f6",
              type: "college",
            }),
          });
          if (newSubRes.ok) {
            const created = await newSubRes.json();
            if (created && created.id) {
              const newId = String(created.id);
              subjectId = newId;
              subjectMap.set(key, newId);
            }
          }
        }

        if (subjectId) {
          finalSessions.push({
            id: `session-${Date.now()}-${finalSessions.length}`,
            subjectId,
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            location: entry.location || "",
          });
        }
      }

      // 4. Save sessions to timetable.json
      const ttRes = await fetch("/api/timetable?replace=false", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalSessions),
      });

      if (ttRes.ok) {
        const msg = newSubjectsCreated > 0
          ? `Imported ${finalSessions.length} classes & auto-synced ${newSubjectsCreated} new subject(s) to 75% Attendance Tracker!`
          : `Successfully imported ${finalSessions.length} classes into your timetable!`;
        toast.success(msg);
        setOpen(false);
        setFile(null);
        setParsedEntries([]);
        onImportComplete();
      } else {
        toast.error("Failed to save timetable sessions.");
      }
    } catch {
      toast.error("An error occurred during timetable import.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" /> Upload Timetable (OCR)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Timetable Parser (On-Device OCR)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
          <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3 bg-accent/20">
            <div className="flex justify-center gap-2 text-muted-foreground">
              <ImageIcon className="w-8 h-8" />
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload your timetable image or PDF</p>
              <p className="text-xs text-muted-foreground">Lumina runs on-device OCR without sending your files anywhere</p>
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
            />
          </div>

          {file && !parsedEntries.length && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <span className="text-sm font-medium truncate max-w-[280px]">{file.name}</span>
              <Button size="sm" onClick={handleRunOcr} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recognizing ({ocrProgress}%)
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" /> Start OCR Parse
                  </>
                )}
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Scanning document structure and time slots...</span>
                <span>{ocrProgress}%</span>
              </div>
              <Progress value={ocrProgress} className="h-2" />
            </div>
          )}

          {parsedEntries.length > 0 && (
            <div className="space-y-4">
              {/* Auto-sync to Attendance Tracker Banner */}
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="sync-attendance" 
                    checked={syncToAttendance}
                    onCheckedChange={(checked) => setSyncToAttendance(!!checked)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <label 
                      htmlFor="sync-attendance" 
                      className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Auto-sync detected subjects into 75% Attendance Tracker
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Creates attendance monitoring cards with safe bunk analytics, cut-off thresholds, and live class links.
                    </p>
                  </div>
                </div>

                {detectedSubjects.length > 0 && (
                  <div className="pt-1 border-t border-primary/10 flex flex-wrap gap-1.5">
                    {detectedSubjects.map((sub) => {
                      const exists = existingSubjects.some(
                        (es) => es.name.toLowerCase().trim() === sub.name.toLowerCase().trim()
                      );
                      return (
                        <Badge 
                          key={sub.name} 
                          variant="secondary" 
                          className="text-[10px] gap-1 py-0 px-2"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                          <span>{sub.name}</span>
                          {sub.code && <span className="text-muted-foreground font-mono text-[9px]">({sub.code})</span>}
                          <span className="opacity-70 text-[9px]">{sub.sessionCount}x/wk</span>
                          {exists ? (
                            <span className="text-emerald-500 font-semibold text-[9px]">✓ linked</span>
                          ) : (
                            <span className="text-primary font-semibold text-[9px]">+ new card</span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Detected Class Sessions ({parsedEntries.length})</span>
                  <Button size="sm" variant="ghost" onClick={handleAddManualEntry}>
                    <Plus className="w-3 h-3 mr-1" /> Add Row
                  </Button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {parsedEntries.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md border bg-card text-xs">
                      <div className="col-span-3">
                        <Input
                          placeholder="Subject"
                          value={item.subjectName}
                          onChange={(e) => handleEntryChange(item.id, "subjectName", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={String(item.dayOfWeek)}
                          onValueChange={(val) => handleEntryChange(item.id, "dayOfWeek", Number(val))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map((d) => (
                              <SelectItem key={d.value} value={d.value}>
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => handleEntryChange(item.id, "startTime", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => handleEntryChange(item.id, "endTime", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Room"
                          value={item.location || ""}
                          onChange={(e) => handleEntryChange(item.id, "location", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleRemoveEntry(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex justify-between sm:justify-between items-center">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {syncToAttendance 
              ? "Detected subjects will automatically create cards in the 75% Attendance Tracker." 
              : "Only timetable schedule sessions will be saved."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleImport} disabled={parsedEntries.length === 0 || isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Import & Sync
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
