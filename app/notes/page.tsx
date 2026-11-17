"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, BrainCircuit, ShieldCheck, FileText, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TextbookUploadDialog } from "@/components/notes/textbook-upload-dialog";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const router = useRouter();
  const { notes, fetchNotes } = useLuminaStore();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [isReindexing, setIsReindexing] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });
      if (res.ok) {
        toast.success("Note saved and indexed into local vector DB");
        setIsAdding(false);
        setNewNote({ title: "", content: "" });
        fetchNotes();
      }
    } catch {
      toast.error("Failed to save note");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Note removed");
        fetchNotes();
      }
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const res = await fetch("/api/ai/index", { method: "POST" });
      const data = await res.json();
      toast.success(`TensorFlow.js: Re-indexed ${data.indexed || 0} chunks locally.`);
    } catch {
      toast.error("Re-indexing failed.");
    } finally {
      setIsReindexing(false);
    }
  };

  const askAiAboutNote = (note: any) => {
    const query = encodeURIComponent(`Explain key concepts from: ${note.title}`);
    router.push(`/rag?prompt=${query}`);
  };

  const safeNotes = Array.isArray(notes) ? notes : [];

  const filteredNotes = safeNotes.filter((n) =>
    n?.title?.toLowerCase().includes(search.toLowerCase()) ||
    n?.content?.toLowerCase().includes(search.toLowerCase()) ||
    n?.attachments?.some((a: any) => a.name?.toLowerCase().includes(search.toLowerCase()) || a.textContent?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Second Brain (Local RAG)</h2>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 gap-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Basement Ready
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Offline Semantic RAG powered by on-device TensorFlow.js vectors. Zero data leaves your device.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReindex}
            disabled={isReindexing}
            title="Re-run local TensorFlow.js vector indexing"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isReindexing ? "animate-spin" : ""}`} />
            Re-Index DB
          </Button>

          <TextbookUploadDialog onSuccess={fetchNotes} />

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> New Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Study Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Subject or Topic"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Enter formulas, lecture summaries, or textbook highlights..."
                    className="min-h-[180px]"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={handleAddNote}>Save & Index Note</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Offline Shield Banner */}
      <div className="p-3.5 rounded-lg border bg-emerald-500/5 border-emerald-500/20 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            <strong>Offline Vector Shield:</strong> Local vector database powered by TensorFlow.js. Data is stored on-device and searchable with zero internet connectivity.
          </span>
        </div>
        <span className="text-muted-foreground font-mono text-[11px]">
          {safeNotes.length} document{safeNotes.length === 1 ? "" : "s"} indexed
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search textbook notes or chapters (e.g., 'K-Maps', 'Pumping Lemma', 'Attendance')..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => {
          const hasAttachments = Boolean(note.attachments && note.attachments.length > 0);
          return (
            <Card key={note.id} className="group relative border hover:border-primary/40 transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1 text-base">{note.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "Offline Note"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:bg-primary/10"
                      onClick={() => askAiAboutNote(note)}
                      title="Query in Offline Second Brain RAG"
                    >
                      <BrainCircuit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(note.id)}
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>

                {hasAttachments && (
                  <div className="pt-2 border-t space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3 text-primary" />
                      Attached Chapters / Pages
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {note.attachments?.map((att: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 h-5 font-normal">
                          {att.name} {att.approxPage ? `• p.${att.approxPage}` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-card border rounded-lg">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-base font-semibold">No notes or textbooks found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Upload your textbook PDFs or click &quot;Ingest Textbook PDF&quot; to load sample digital logic and automata chapters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
