"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { currentAttendancePercent } from "@/lib/ai/tools/attendance";

export function AIRecommendationWidget() {
  const { attendance } = useLuminaStore();
  const subjects = Array.isArray(attendance) ? attendance : [];

  const risky = subjects
    .map((subject) => ({
      subject,
      percent: currentAttendancePercent(subject),
    }))
    .filter((item) => item.percent < 75)
    .sort((a, b) => a.percent - b.percent)[0];

  const recommendation = risky
    ? `${risky.subject.name} is at ${risky.percent}% attendance. Ask the copilot before skipping classes.`
    : "Attendance looks healthy. Use AI Study to plan for upcoming exams.";

  return (
    <Card className="col-span-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{recommendation}</p>
      </CardContent>
    </Card>
  );
}
