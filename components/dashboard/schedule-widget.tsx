"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Check, X, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";
import Link from "next/link";
import type { ClassSession, Subject } from "@/lib/types";

export function ScheduleWidget({ className }: { className?: string }) {
  const { timetable, attendance, fetchTimetable, fetchAttendance } = useLuminaStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchTimetable();
    fetchAttendance();
  }, []);

  const todayDay = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const safeTimetable: ClassSession[] = Array.isArray(timetable) ? timetable : [];
  const safeAttendance: Subject[] = Array.isArray(attendance) ? attendance : [];

  // Filter today's classes and sort by startTime
  const todayClasses = safeTimetable
    .filter((session) => session.dayOfWeek === todayDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getClassStatus = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startTotal = startH * 60 + (startM || 0);
    const endTotal = endH * 60 + (endM || 0);

    if (currentMinutes < startTotal) {
      return { label: "Upcoming", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
    }
    if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
      return { label: "In Progress", color: "text-green-500 bg-green-500/10 border-green-500/20 animate-pulse" };
    }
    return { label: "Completed", color: "text-muted-foreground bg-muted border-border" };
  };

  const handleQuickMark = async (subject: Subject, present: boolean) => {
    const updated = {
      ...subject,
      attended: Math.max(0, subject.attended + (present ? 1 : 0)),
      total: Math.max(0, subject.total + 1),
    };
    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        toast.success(present ? `Marked Present for ${subject.name}` : `Marked Absent for ${subject.name}`);
        fetchAttendance();
      }
    } catch {
      toast.error("Failed to update attendance");
    }
  };

  if (!mounted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center text-sm text-muted-foreground">Loading schedule...</div>
        </CardContent>
      </Card>
    );
  }

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = DAY_NAMES[todayDay];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Schedule ({todayName})
        </CardTitle>
        <Link href="/attendance">
          <Button variant="ghost" size="sm" className="text-xs">
            Manage Timetable
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {todayClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 border rounded-lg border-dashed bg-accent/10">
            <Sparkles className="w-8 h-8 text-green-500" />
            <p className="text-sm font-semibold">No classes scheduled for today!</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Enjoy your Cooling Day or upload your schedule via on-device OCR on the Attendance page.
            </p>
            <Link href="/attendance">
              <Button size="sm" variant="outline" className="mt-2 text-xs">
                Upload Schedule
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {todayClasses.map((item) => {
              const subject = safeAttendance.find((s) => s.id === item.subjectId);
              const subjectName = subject?.name || "Subject Lecture";
              const percent =
                subject && subject.total > 0
                  ? Math.round((subject.attended / subject.total) * 100)
                  : 0;
              const safeBunks =
                subject && subject.total > 0
                  ? Math.max(0, Math.floor(subject.attended / 0.75 - subject.total))
                  : 0;

              const status = getClassStatus(item.startTime, item.endTime);

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-accent/30 gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 rounded-md bg-background border text-xs font-mono font-bold shrink-0">
                      {item.startTime} - {item.endTime}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{subjectName}</p>
                        {subject && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              percent < 75 ? "text-destructive border-destructive/40" : "text-green-500 border-green-500/40"
                            }`}
                          >
                            {percent}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.location || "Classroom"} • Safe Bunks:{" "}
                        <span className={safeBunks > 0 ? "text-green-500 font-semibold" : "text-destructive font-semibold"}>
                          {safeBunks}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${status.color}`}
                    >
                      <Clock className="h-3 w-3" />
                      {status.label}
                    </span>
                    {subject && (
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                          title="Mark Present"
                          onClick={() => handleQuickMark(subject, true)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Mark Absent"
                          onClick={() => handleQuickMark(subject, false)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
