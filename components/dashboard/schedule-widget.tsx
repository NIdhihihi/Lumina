"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

export function ScheduleWidget({ className }: { className?: string }) {
  const schedule = [
    { time: "09:00 AM", subject: "Mathematics III", room: "L-201" },
    { time: "11:30 AM", subject: "Data Structures", room: "Lab-4" },
    { time: "02:00 PM", subject: "Digital Electronics", room: "L-105" },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedule.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-accent/30">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-md bg-background border text-xs font-mono font-bold">
                  {item.time}
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.subject}</p>
                  <p className="text-xs text-muted-foreground">{item.room}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded">
                <Clock className="h-3 w-3" />
                Upcoming
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
