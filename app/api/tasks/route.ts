import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../server/db';
export const runtime = "nodejs";
const FILENAME = 'tasks.json';

export async function GET() {
  const tasks = readJSON<any[]>(FILENAME, []);
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const task = await request.json();
  const tasks = readJSON<any[]>(FILENAME, []);
  const newTask = { 
    ...task, 
    id: task.id || Date.now().toString(), 
    status: task.status || 'want_to_do' 
  };
  tasks.push(newTask);
  writeJSON(FILENAME, tasks);
  return NextResponse.json(newTask);
}

export async function PUT(request: Request) {
  const updatedTask = await request.json();
  let tasks = readJSON<any[]>(FILENAME, []);
  tasks = tasks.map((t: any) => t.id === updatedTask.id ? updatedTask : t);
  writeJSON(FILENAME, tasks);
  return NextResponse.json(updatedTask);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let tasks = readJSON<any[]>(FILENAME, []);
  tasks = tasks.filter((t: any) => t.id !== id);
  writeJSON(FILENAME, tasks);
  return NextResponse.json({ success: true });
}
