import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../server/db';
import type { Exam } from '@/lib/types';

export const runtime = "nodejs";
const FILENAME = 'exams.json';

export async function GET() {
  const exams = readJSON<Exam[]>(FILENAME, []);
  return NextResponse.json(exams);
}

export async function POST(request: Request) {
  const exam = await request.json();
  const exams = readJSON<Exam[]>(FILENAME, []);
  const newExam: Exam = {
    ...exam,
    id: Date.now().toString(),
  };
  exams.push(newExam);
  writeJSON(FILENAME, exams);
  return NextResponse.json(newExam);
}

export async function PUT(request: Request) {
  const updatedExam = await request.json();
  let exams = readJSON<Exam[]>(FILENAME, []);
  exams = exams.map((e) => e.id === updatedExam.id ? updatedExam : e);
  writeJSON(FILENAME, exams);
  return NextResponse.json(updatedExam);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let exams = readJSON<Exam[]>(FILENAME, []);
  exams = exams.filter((e) => e.id !== id);
  writeJSON(FILENAME, exams);
  return NextResponse.json({ success: true });
}
