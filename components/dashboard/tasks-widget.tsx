"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Circle } from "lucide-react";
import { useLuminaStore } from "@/hooks/use-lumina-store";

export function TasksWidget({ className }: { className?: string }) {
  const { tasks } = useLuminaStore();

const safeTasks = Array.isArray(tasks) ? tasks : [];

const activeTasks = safeTasks
  .filter((t) => t?.status !== "done")
  .slice(0, 4);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Active Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeTasks.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              All caught up! 🎉
            </div>
          ) : (
            activeTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border">
                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm leading-none mb-1">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{task.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
