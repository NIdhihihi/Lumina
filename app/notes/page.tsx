"use client";
import { NotebookPen } from "lucide-react";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const router = useRouter();
  const { notes, fetchNotes } = useLuminaStore();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [isAiProcessing, setIsAiProcessing] = useState<string | null>(null);

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
        toast.success("Note saved");
        setIsAdding(false);
        setNewNote({ title: "", content: "" });
        fetchNotes();
      }
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Note deleted");
        fetchNotes();
      }
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const askAiAboutNote = (note: any) => {
    router.push(`/rag?prompt=Explain this note in detail: ${note.title} - ${note.content}`);
  };

  const safeNotes = Array.isArray(notes) ? notes : [];

const filteredNotes = safeNotes.filter((n) => 
  n?.title?.toLowerCase().includes(search.toLowerCase()) || 
  n?.content?.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Second Brain</h2>
          <p className="text-muted-foreground">Manage your study notes and knowledge base.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="Subject or Topic" 
                  value={newNote.title}
                  onChange={e => setNewNote({...newNote, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content (Markdown supported)</label>
                <Textarea 
                  placeholder="Your notes here..." 
                  className="min-h-[200px]"
                  value={newNote.content}
                  onChange={e => setNewNote({...newNote, content: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAddNote}>Save Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search notes..." 
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="group relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="line-clamp-1">{note.title}</CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => askAiAboutNote(note)}>
                    <BrainCircuit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(note.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <CardDescription>{new Date(note.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                {note.content}
              </p>
            </CardContent>
          </Card>
        ))}
        {filteredNotes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-card border rounded-lg">
            <NotebookPen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No notes found</h3>
            <p className="text-muted-foreground">Start by creating your first note.</p>
          </div>
        )}
      </div>
    </div>
  );
}

