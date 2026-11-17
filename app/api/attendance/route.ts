import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../server/db';
const FILENAME = 'attendance.json';
export const runtime = "nodejs";
export async function GET() {
  const subjects = readJSON<any[]>(FILENAME, []);
  return NextResponse.json(subjects);
}

export async function POST(request: Request) {
  const subject = await request.json();
  const subjects = readJSON<any[]>(FILENAME, []);
  const newSubject = { 
    ...subject, 
    id: Date.now().toString(), 
    attended: 0, 
    total: 0 
  };
  subjects.push(newSubject);
  writeJSON(FILENAME, subjects);
  return NextResponse.json(newSubject);
}

export async function PUT(request: Request) {
  const updatedSubject = await request.json();
  let subjects = readJSON<any[]>(FILENAME, []);
  subjects = subjects.map((s: any) => s.id === updatedSubject.id ? updatedSubject : s);
  writeJSON(FILENAME, subjects);
  return NextResponse.json(updatedSubject);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let subjects = readJSON<any[]>(FILENAME, []);
  subjects = subjects.filter((s: any) => s.id !== id);
  writeJSON(FILENAME, subjects);
  return NextResponse.json({ success: true });
}
