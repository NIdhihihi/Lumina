"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { format } from "date-fns";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { tasks } = useLuminaStore();

  const selectedTasks = tasks.filter(t => t.status !== 'done');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Academic Calendar</h2>
        <p className="text-muted-foreground">Manage your deadlines and events.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 p-4">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border shadow-sm w-full"
          />
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">
              Events for {date ? format(date, "MMMM do, yyyy") : "Selected Date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Deadlines</p>
                {selectedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No deadlines for this date.</p>
                ) : (
                  selectedTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{task.title}</span>
                        <span className="text-[10px] text-muted-foreground">Task Deadline</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
