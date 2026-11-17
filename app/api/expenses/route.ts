import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../server/db';
const FILENAME = 'expenses.json';
export const runtime = "nodejs";
export async function GET() {
  const expenses = readJSON<any[]>(FILENAME, []);
  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const expense = await request.json();
  const expenses = readJSON<any[]>(FILENAME, []);
  const newExpense = { ...expense, id: Date.now().toString(), date: new Date().toISOString() };
  expenses.push(newExpense);
  writeJSON(FILENAME, expenses);
  return NextResponse.json(newExpense);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let expenses = readJSON<any[]>(FILENAME, []);
  expenses = expenses.filter((e: any) => e.id !== id);
  writeJSON(FILENAME, expenses);
  return NextResponse.json({ success: true });
}
