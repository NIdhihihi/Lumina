"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BookOpen, UploadCloud, FileText, CheckCircle2, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { extractPagesFromPDF, pagesToNoteAttachments, type ExtractedPage } from "@/lib/ai/rag/textbook-parser";
import { toast } from "sonner";

interface TextbookUploadDialogProps {
  onSuccess: () => void;
}

const SAMPLE_TEXTBOOK_CHAPTERS = [
  {
    title: "Digital Logic & Computer Design (Mano)",
    content: "Fundamental concepts of Boolean Algebra, Logic Gates, and Karnaugh Map (K-Map) simplification for combinational circuits.",
    attachments: [
      {
        name: "Chapter 2 - Boolean Algebra & Logic Gates",
        approxPage: 48,
        textContent: "Boolean Algebra is a mathematical system of logic in which propositions may only be true or false. Basic operations are AND, OR, and NOT. DeMorgan's laws state that NOT(A AND B) = NOT A OR NOT B, and NOT(A OR B) = NOT A AND NOT B. In digital circuits, NAND and NOR gates are universal gates because any boolean function can be implemented solely using them.",
      },
      {
        name: "Chapter 3 - Karnaugh Maps (K-Maps)",
        approxPage: 72,
        textContent: "The Karnaugh map (K-map) provides a systematic method for simplifying Boolean expressions without relying on algebraic theorems. In a 4-variable K-map representing variables A,B,C,D, adjacent cells differ by only one literal (Gray code order). Groups of 1s in powers of 2 (1, 2, 4, 8, 16) are identified to eliminate redundant minterms and derive minimal sum-of-products (SOP) forms.",
      },
    ],
  },
  {
    title: "Theory of Computation & Automata (Hopcroft)",
    content: "Deterministic Finite Automata (DFA), Non-deterministic Finite Automata (NFA), Regular Expressions, and the Pumping Lemma.",
    attachments: [
      {
        name: "Chapter 4 - Pumping Lemma for Regular Languages",
        approxPage: 126,
        textContent: "The Pumping Lemma for regular languages states: If language L is regular, then there exists a constant p (pumping length) such that any string w in L with |w| >= p can be divided into three parts, w = xyz, satisfying:\n1. For each i >= 0, xy^i z is in L\n2. |y| > 0\n3. |xy| <= p.\nThe pumping lemma is primarily used to prove by contradiction that a given language is NOT regular, such as L = {0^n 1^n | n >= 0}.",
      },
    ],
  },
];

export function TextbookUploadDialog({ onSuccess }: TextbookUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF document.");
      return;
    }

    setFile(selected);
    setTitle(selected.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
    setIsProcessing(true);
    setProgress(30);

    try {
      const pages = await extractPagesFromPDF(selected);
      setExtractedPages(pages);
      setProgress(100);
      toast.success(`Extracted ${pages.length} page(s) on-device from ${selected.name}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to parse PDF on device.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!file || extractedPages.length === 0) return;
    setIsProcessing(true);

    try {
      const attachments = pagesToNoteAttachments(file.name, extractedPages);
      const notePayload = {
        title: title || file.name,
        content: `Textbook PDF indexed offline: ${file.name} (${extractedPages.length} pages). Ready for TensorFlow.js semantic search.`,
        subjectId: subject || undefined,
        attachments,
      };

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notePayload),
      });

      if (!res.ok) throw new Error("Failed to save note");

      // Trigger TensorFlow.js vector indexing
      await fetch("/api/ai/index", { method: "POST" });

      toast.success("Textbook indexed into local TensorFlow.js vector database! Offline search ready.");
      setOpen(false);
      resetState();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Error saving textbook note.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async (sampleIndex: number) => {
    setIsProcessing(true);
    const sample = SAMPLE_TEXTBOOK_CHAPTERS[sampleIndex];

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sample),
      });

      if (!res.ok) throw new Error("Failed to load sample note");

      await fetch("/api/ai/index", { method: "POST" });

      toast.success(`Loaded "${sample.title}" and indexed into TensorFlow.js Vector DB!`);
      setOpen(false);
      resetState();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Error saving sample.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setTitle("");
    setSubject("");
    setProgress(0);
    setExtractedPages([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/30 hover:border-primary">
          <BookOpen className="w-4 h-4 mr-2 text-primary" />
          Ingest Textbook PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Local Textbook & Notes Ingestion (TensorFlow.js)
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md w-fit mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Offline • Zero Data Leaves Device • College Basement Ready
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dropzone */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/40 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadCloud className="w-10 h-10 text-muted-foreground" />
              <div className="text-sm font-medium">
                {file ? file.name : "Drop textbook PDF here or browse"}
              </div>
              <p className="text-xs text-muted-foreground">
                Supports syllabi, lab manuals, and chapter PDFs. Parsed entirely on-device.
              </p>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Extracting pages and computing TF.js tensors...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {extractedPages.length > 0 && (
            <div className="space-y-3 bg-accent/20 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {extractedPages.length} pages ready for local vectorization
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-title" className="text-xs">Document Title</Label>
                <Input
                  id="book-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Morris Mano - Digital Design"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or load pre-configured offline engineering textbooks:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs h-auto py-2 justify-start text-left"
                disabled={isProcessing}
                onClick={() => handleLoadSample(0)}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 shrink-0 text-primary" />
                <div>
                  <div className="font-medium">Digital Logic & K-Maps</div>
                  <div className="text-[10px] text-muted-foreground">Mano • Logic Gates & SOP</div>
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs h-auto py-2 justify-start text-left"
                disabled={isProcessing}
                onClick={() => handleLoadSample(1)}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 shrink-0 text-primary" />
                <div>
                  <div className="font-medium">Automata & Pumping Lemma</div>
                  <div className="text-[10px] text-muted-foreground">Hopcroft • DFA & Regularity</div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!file || extractedPages.length === 0 || isProcessing}
            className="gap-2"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Save & Index Offline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
