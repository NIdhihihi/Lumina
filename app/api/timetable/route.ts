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
  const { searchParams } = new URL(request.url);
  const isReplace = searchParams.get('replace') === 'true';
  const body = await request.json();
  const existing = isReplace ? [] : readJSON<ClassSession[]>(FILENAME, []);

  if (Array.isArray(body)) {
    const newSessions: ClassSession[] = body.map((s, idx) => ({
      ...s,
      id: s.id || `${Date.now()}-${idx}`,
    }));
    const combined = [...existing, ...newSessions];
    writeJSON(FILENAME, combined);
    return NextResponse.json(combined);
  }

  const newSession: ClassSession = {
    ...body,
    id: body.id || Date.now().toString(),
  };
  existing.push(newSession);
  writeJSON(FILENAME, existing);
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
