"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudyPlanOutput } from "@/lib/types";
import { toast } from "sonner";

type Props = {
  studyPlan: StudyPlanOutput;
};

export function StudyPlan({ studyPlan }: Props) {
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    setSaving(true);
    try {
      for (const block of studyPlan.blocks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${block.topic} (${block.durationMinutes} min)`,
            dueDate: block.date,
            priority: "medium",
            subjectId: block.subjectId,
          }),
        });
      }
      toast.success("Study plan saved as tasks");
    } catch {
      toast.error("Failed to save study plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-3 border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Suggested Study Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{studyPlan.summary}</p>
        <ul className="space-y-2 text-sm">
          {studyPlan.blocks.map((block, index) => (
            <li key={`${block.date}-${index}`} className="rounded-md border bg-background px-3 py-2">
              <div className="font-medium">{block.topic}</div>
              <div className="text-muted-foreground text-xs">
                {block.date} · {block.durationMinutes} min
              </div>
            </li>
          ))}
        </ul>
        <Button size="sm" onClick={handleAccept} disabled={saving}>
          {saving ? "Saving..." : "Accept & Save as Tasks"}
        </Button>
      </CardContent>
    </Card>
  );
}
