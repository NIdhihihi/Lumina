import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../server/db';
import type { ClassSession } from '@/lib/types';

export const runtime = "nodejs";
const FILENAME = 'timetable.json';

export async function GET() {
  const sessions = readJSON<ClassSession[]>(FILENAME, []);
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = await request.json();
  const sessions = readJSON<ClassSession[]>(FILENAME, []);
  const newSession: ClassSession = {
    ...session,
    id: Date.now().toString(),
  };
  sessions.push(newSession);
  writeJSON(FILENAME, sessions);
  return NextResponse.json(newSession);
}

export async function PUT(request: Request) {
  const updatedSession = await request.json();
  let sessions = readJSON<ClassSession[]>(FILENAME, []);
  sessions = sessions.map((s) => s.id === updatedSession.id ? updatedSession : s);
  writeJSON(FILENAME, sessions);
  return NextResponse.json(updatedSession);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let sessions = readJSON<ClassSession[]>(FILENAME, []);
  sessions = sessions.filter((s) => s.id !== id);
  writeJSON(FILENAME, sessions);
  return NextResponse.json({ success: true });
}
