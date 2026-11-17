import { readJSON, writeJSON } from "@/server/db";
import type { Note, VectorRecord } from "@/lib/types";
import { chunkNotes } from "./chunking";
import { embedText } from "./embeddings";

const VECTORS_FILE = "vectors.json";
const NOTES_FILE = "notes.json";

export function loadVectors(): VectorRecord[] {
  return readJSON<VectorRecord[]>(VECTORS_FILE, []);
}

export function saveVectors(vectors: VectorRecord[]): void {
  writeJSON(VECTORS_FILE, vectors);
}

export async function indexNotes(notes?: Note[]): Promise<{ indexed: number; error?: string }> {
  const sourceNotes = notes ?? readJSON<Note[]>(NOTES_FILE, []);
  const chunks = chunkNotes(sourceNotes);
  const vectors: VectorRecord[] = [];

  for (const chunk of chunks) {
    const embedded = await embedText(chunk.text);
    if (!embedded.ok) {
      return { indexed: vectors.length, error: embedded.error };
    }

    vectors.push({
      id: `${chunk.metadata.noteId}:${chunk.metadata.chunkIndex}:${chunk.metadata.attachmentName ?? "content"}`,
      vector: embedded.vector,
      metadata: {
        noteId: chunk.metadata.noteId,
        noteTitle: chunk.metadata.noteTitle,
        attachmentName: chunk.metadata.attachmentName,
        chunkIndex: chunk.metadata.chunkIndex,
        approxPage: chunk.metadata.approxPage,
        text: chunk.text,
      },
    });
  }

  saveVectors(vectors);
  return { indexed: vectors.length };
}

export async function indexNoteById(noteId: string): Promise<{ indexed: number; error?: string }> {
  const notes = readJSON<Note[]>(NOTES_FILE, []);
  const note = notes.find((n) => n.id === noteId);
  if (!note) return { indexed: 0, error: "Note not found" };

  const existing = loadVectors().filter((v) => v.metadata.noteId !== noteId);
  const chunks = chunkNotes([note]);
  const newVectors: VectorRecord[] = [];

  for (const chunk of chunks) {
    const embedded = await embedText(chunk.text);
    if (!embedded.ok) {
      return { indexed: newVectors.length, error: embedded.error };
    }
    newVectors.push({
      id: `${chunk.metadata.noteId}:${chunk.metadata.chunkIndex}:${chunk.metadata.attachmentName ?? "content"}`,
      vector: embedded.vector,
      metadata: {
        noteId: chunk.metadata.noteId,
        noteTitle: chunk.metadata.noteTitle,
        attachmentName: chunk.metadata.attachmentName,
        chunkIndex: chunk.metadata.chunkIndex,
        approxPage: chunk.metadata.approxPage,
        text: chunk.text,
      },
    });
  }

  saveVectors([...existing, ...newVectors]);
  return { indexed: newVectors.length };
}

export function removeNoteVectors(noteId: string): void {
  const remaining = loadVectors().filter((v) => v.metadata.noteId !== noteId);
  saveVectors(remaining);
}
