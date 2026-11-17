"use client";

import { useEffect } from "react";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { AttendanceWidget } from "@/components/dashboard/attendance-widget";
import { ExpenseWidget } from "@/components/dashboard/expense-widget";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { FocusWidget } from "@/components/dashboard/focus-widget";
import { ScheduleWidget } from "@/components/dashboard/schedule-widget";
import { CoolingDayWidget } from "@/components/dashboard/cooling-day-widget";
import { AIRecommendationWidget } from "@/components/dashboard/ai-recommendation-widget";

export default function Dashboard() {
  const { fetchNotes, fetchAttendance, fetchExpenses, fetchTasks, fetchTimetable } = useLuminaStore();

  useEffect(() => {
    fetchNotes();
    fetchAttendance();
    fetchExpenses();
    fetchTasks();
    fetchTimetable();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, Student</h2>
        <p className="text-muted-foreground">Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AttendanceWidget />
        <ExpenseWidget />
        <FocusWidget />
        <CoolingDayWidget />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ScheduleWidget className="col-span-4" />
        <TasksWidget className="col-span-3" />
      </div>

      <AIRecommendationWidget />
    </div>
  );
}
