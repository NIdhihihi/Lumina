"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle2, ArrowRightLeft } from "lucide-react";
import type { ContextSwitchEvent } from "@/lib/focus/cognitive-debt";

interface TaskSwitchTimelineProps {
  events: ContextSwitchEvent[];
  sessionStartTime: number | null;
  currentDebt: number;
}

export function TaskSwitchTimeline({
  events,
  sessionStartTime,
  currentDebt,
}: TaskSwitchTimelineProps) {
  const switchCount = events.filter((e) => e.type === "switch_away").length;

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              Real-Time Task-Switching Timeline
            </CardTitle>
            <CardDescription className="text-xs">
              Monitors screen and window events to build your attention timeline.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {switchCount} {switchCount === 1 ? "switch" : "switches"}
            </Badge>
            <Badge
              variant="outline"
              className={currentDebt > 40 ? "text-destructive border-destructive/40" : "text-green-500 border-green-500/40"}
            >
              Debt: {Math.round(currentDebt)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground border rounded-lg border-dashed bg-accent/10">
            <CheckCircle2 className="w-6 h-6 text-green-500 mb-1" />
            <p className="font-medium text-foreground">Zero Context Switches</p>
            <p>Start a focus session and maintain window focus to sustain deep flow.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative border-l-2 border-border ml-3 pl-4 space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {events.slice().reverse().map((event) => {
                const isSwitch = event.type === "switch_away";
                const timeStr = new Date(event.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return (
                  <div key={event.id} className="relative group">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 bg-background ${
                        isSwitch ? "border-destructive bg-destructive/20" : "border-green-500 bg-green-500/20"
                      }`}
                    />
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-start justify-between transition-colors ${
                        isSwitch
                          ? "bg-destructive/5 border-destructive/20"
                          : "bg-green-500/5 border-green-500/20"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          {isSwitch ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          )}
                          <span className={isSwitch ? "text-destructive font-semibold" : "text-green-600 dark:text-green-400 font-semibold"}>
                            {event.label}
                          </span>
                        </div>
                        {event.durationSeconds !== undefined && event.durationSeconds > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Focus stretch duration: {Math.floor(event.durationSeconds / 60)}m {event.durationSeconds % 60}s
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-muted-foreground block">{timeStr}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Debt: {Math.round(event.debtAtEvent)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
