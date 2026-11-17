import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../server/db';
import { indexNoteById, removeNoteVectors } from '@/lib/ai/rag/vector-store';
import type { Note } from '@/lib/types';

export const runtime = "nodejs";
const FILENAME = 'notes.json';

export async function GET() {
  const notes = readJSON<Note[]>(FILENAME, []);
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const note = await request.json();
  const notes = readJSON<Note[]>(FILENAME, []);
  const newNote: Note = {
    ...note,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  notes.push(newNote);
  writeJSON(FILENAME, notes);
  await indexNoteById(newNote.id);
  return NextResponse.json(newNote);
}

export async function PUT(request: Request) {
  const updatedNote = await request.json();
  let notes = readJSON<Note[]>(FILENAME, []);
  notes = notes.map((n) => n.id === updatedNote.id ? updatedNote : n);
  writeJSON(FILENAME, notes);
  await indexNoteById(updatedNote.id);
  return NextResponse.json(updatedNote);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let notes = readJSON<Note[]>(FILENAME, []);
  notes = notes.filter((n) => n.id !== id);
  writeJSON(FILENAME, notes);
  if (id) removeNoteVectors(id);
  return NextResponse.json({ success: true });
}
