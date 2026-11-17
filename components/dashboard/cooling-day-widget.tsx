"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Coffee, Flame, ArrowRight } from "lucide-react";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CoolingDayWidget() {
  const { attendance } = useLuminaStore();
  const [stressStatus, setStressStatus] = useState<"relax" | "moderate" | "collision">("relax");

  useEffect(() => {
    fetch("/api/sync/gmail-calendar")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stressSummary?.todayStress?.status) {
          setStressStatus(data.stressSummary.todayStress.status);
        }
      })
      .catch(() => undefined);
  }, []);

  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const canBunk = safeAttendance.some((s) => {
    if (s?.total === 0) return false;
    const safeBunks = Math.floor((s?.attended || 0) / 0.75 - (s?.total || 0));
    return safeBunks > 1;
  });

  const isCollision = stressStatus === "collision";
  const isCooling = canBunk && !isCollision;

  return (
    <Card
      className={cn(
        "transition-colors hover:border-primary/40",
        isCollision
          ? "bg-destructive/10 border-destructive/30"
          : isCooling
          ? "bg-emerald-500/10 border-emerald-500/30"
          : ""
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Stress & Cooling Status</CardTitle>
        {isCollision ? (
          <Flame className="h-4 w-4 text-destructive" />
        ) : (
          <Coffee className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div
            className={cn(
              "text-2xl font-bold",
              isCollision ? "text-destructive" : isCooling ? "text-emerald-500" : ""
            )}
          >
            {isCollision ? "COLLISION" : isCooling ? "COOLING DAY" : "MODERATE"}
          </div>
          <Link href="/calendar" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
            Stress Meter <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex items-center gap-1 mt-1">
          {isCollision ? (
            <Flame className="h-3 w-3 text-destructive" />
          ) : (
            <Smile className={isCooling ? "h-3 w-3 text-emerald-500" : "h-3 w-3 text-muted-foreground"} />
          )}
          <p className="text-[10px] text-muted-foreground">
            {isCollision
              ? "Deadlines colliding today — prioritize tasks!"
              : isCooling
              ? "Safe bunks available & no collisions. Time to relax!"
              : "Classes active today. Maintain steady pace."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
