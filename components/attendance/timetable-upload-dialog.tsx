"use client";

import { useState } from "react";
import { Upload, FileText, Image as ImageIcon, Loader2, Check, Trash2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  extractTextFromImage, 
  extractTextFromPDF, 
  parseTimetableText, 
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
  const [isSaving, setIsSaving] = useState(false);

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
        toast.success(`OCR detected ${results.length} class session(s)! Review them below.`);
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
      // 1. Check for new subjects and create them if they do not exist
      const subjectMap = new Map<string, string>(); // name.toLowerCase() -> subjectId
      existingSubjects.forEach((s) => subjectMap.set(s.name.toLowerCase().trim(), s.id));

      const finalSessions: ClassSession[] = [];

      for (const entry of parsedEntries) {
        const cleanName = entry.subjectName.trim() || entry.subjectCode || "Class";
        const key = cleanName.toLowerCase();
        let subjectId = subjectMap.get(key);

        if (!subjectId) {
          // Create subject in attendance.json
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

      // 2. Save sessions to timetable.json
      const ttRes = await fetch("/api/timetable?replace=false", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalSessions),
      });

      if (ttRes.ok) {
        toast.success(`Successfully imported ${finalSessions.length} classes into your schedule!`);
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Detected Class Sessions ({parsedEntries.length})</span>
                <Button size="sm" variant="ghost" onClick={handleAddManualEntry}>
                  <Plus className="w-3 h-3 mr-1" /> Add Row
                </Button>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto">
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
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex justify-between sm:justify-between items-center">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> New subjects will be created automatically in attendance.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleImport} disabled={parsedEntries.length === 0 || isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Import to Timetable
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
