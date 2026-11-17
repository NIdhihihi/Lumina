"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Coffee } from "lucide-react";
import { useLuminaStore } from "@/hooks/use-lumina-store";

export function CoolingDayWidget() {
  const { attendance } = useLuminaStore();

const safeAttendance = Array.isArray(attendance) ? attendance : [];

const canBunk = safeAttendance.some((s) => {
  if (s?.total === 0) return false;
  const safeBunks = Math.floor((s?.attended || 0) / 0.75 - (s?.total || 0));
  return safeBunks > 1;
});

  return (
    <Card className={canBunk ? "bg-green-500/10 border-green-500/20" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Cooling Day</CardTitle>
        <Coffee className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{canBunk ? "YES" : "NO"}</div>
        <div className="flex items-center gap-1 mt-1">
          <Smile className={canBunk ? "h-3 w-3 text-green-500" : "h-3 w-3 text-muted-foreground"} />
          <p className="text-[10px] text-muted-foreground">
            {canBunk ? "You have safe bunks available!" : "Stay focused today."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
