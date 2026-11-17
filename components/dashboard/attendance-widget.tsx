"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { Progress } from "@/components/ui/progress";

export function AttendanceWidget() {
  const { attendance } = useLuminaStore();
  
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

const totalAttended = safeAttendance.reduce(
  (acc, curr) => acc + (curr?.attended || 0),
  0
);

const totalClasses = safeAttendance.reduce(
  (acc, curr) => acc + (curr?.total || 0),
  0
);

const averagePercent =
  totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
        <UserCheck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{averagePercent.toFixed(1)}%</div>
        <Progress value={averagePercent} className="mt-2 h-1" />
        <p className="text-xs text-muted-foreground mt-2">
          {totalAttended} / {totalClasses} total classes
        </p>
      </CardContent>
    </Card>
  );
}
