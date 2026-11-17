"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Flame, 
  Smile, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  RotateCw, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  Mail
} from "lucide-react";
import type { DayStress, StressMeterSummary } from "@/lib/sync/stress-meter";
import { cn } from "@/lib/utils";

interface StressHeatmapProps {
  summary: StressMeterSummary;
  onSync: () => void;
  isSyncing: boolean;
  lastSynced: string;
}

export function StressHeatmap({
  summary,
  onSync,
  isSyncing,
  lastSynced,
}: StressHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string>(summary.todayStress.date);

  const selectedDay = summary.days.find((d) => d.date === selectedDate) || summary.todayStress;
  const isCollision = summary.overallStatus === "collision";
  const isRelax = summary.overallStatus === "relax";

  return (
    <div className="space-y-6">
      {/* Dynamic Stress Meter Banner (Turns Red on collision, Green when relaxed) */}
      <div
        className={cn(
          "p-4 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm",
          isCollision
            ? "bg-destructive/10 border-destructive/40 text-destructive"
            : isRelax
            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            : "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2.5 rounded-lg shrink-0",
              isCollision ? "bg-destructive/20" : isRelax ? "bg-emerald-500/20" : "bg-amber-500/20"
            )}
          >
            {isCollision ? (
              <Flame className="w-6 h-6 text-destructive animate-bounce" />
            ) : isRelax ? (
              <Smile className="w-6 h-6 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">{summary.alertHeadline}</h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase font-bold tracking-wider",
                  isCollision ? "border-destructive text-destructive" : isRelax ? "border-emerald-500 text-emerald-500" : "border-amber-500 text-amber-500"
                )}
              >
                {summary.overallStatus.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              {summary.alertDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-muted-foreground block">Gmail & Calendar Sync</span>
            <span className="text-[11px] font-mono font-medium text-foreground">
              {new Date(lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onSync}
            disabled={isSyncing}
            className="text-xs h-8 border-current hover:bg-black/5 dark:hover:bg-white/5"
          >
            <RotateCw className={cn("w-3.5 h-3.5 mr-1.5", isSyncing && "animate-spin")} />
            Sync Now
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Left: 30-Day Visual Stress Heatmap Grid */}
        <Card className="md:col-span-4 border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  30-Day Academic Stress Heatmap
                </CardTitle>
                <CardDescription className="text-xs">
                  Green indicates cooling/relax days; Red flags deadline collisions.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Relax
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Collision
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-muted-foreground mb-1.5">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {summary.days.map((day) => {
                const isSelected = day.date === selectedDate;
                const dayNum = parseInt(day.date.split("-")[2], 10);
                const hasDeliverables = day.deadlines.length > 0 || day.exams.length > 0;

                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={cn(
                      "aspect-square p-1 rounded-lg border text-left flex flex-col justify-between transition-all relative overflow-hidden group hover:scale-[1.03]",
                      day.colorClass,
                      isSelected ? "ring-2 ring-primary ring-offset-2 scale-[1.03] shadow-sm" : ""
                    )}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-mono font-bold leading-none">{dayNum}</span>
                      {day.status === "collision" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
                      )}
                    </div>

                    <div className="text-right">
                      {hasDeliverables ? (
                        <span className="text-[9px] font-bold block leading-none">
                          {day.deadlines.length + day.exams.length} due
                        </span>
                      ) : (
                        <span className="text-[8px] opacity-70 block leading-none">Cool</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right: Selected Day Details Card */}
        <Card className="md:col-span-3 border flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedDay.dayName}, {selectedDay.date}
                </CardTitle>
                <CardDescription className="text-xs">
                  Academic load: {selectedDay.score} pts • {selectedDay.classesCount} class(es)
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={cn("text-[10px] capitalize font-bold", selectedDay.colorClass)}
              >
                {selectedDay.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
            {selectedDay.exams.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-destructive uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Examination Scheduled
                </span>
                {selectedDay.exams.map((exam, i) => (
                  <div key={i} className="p-2.5 rounded-lg border bg-destructive/10 border-destructive/20 text-xs font-semibold text-destructive">
                    {exam}
                  </div>
                ))}
              </div>
            )}

            {selectedDay.deadlines.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Synced Email Deadlines
                </span>
                <div className="space-y-2">
                  {selectedDay.deadlines.map((dl, i) => (
                    <div key={i} className="p-2.5 rounded-lg border bg-card text-xs space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{dl.title}</span>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {dl.urgency}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{dl.source}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDay.deadlines.length === 0 && selectedDay.exams.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground space-y-2">
                <Smile className="w-8 h-8 text-emerald-500 opacity-80" />
                <p className="font-semibold text-foreground text-sm">Clear Academic Horizon</p>
                <p className="max-w-[200px]">
                  No exams or assignment deadlines on this date. Perfect for study sprints or cooling down.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
