"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Zap } from "lucide-react";

export function FocusWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Focus Score</CardTitle>
        <Timer className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">85/100</div>
        <div className="flex items-center gap-1 mt-1 text-blue-500">
          <Zap className="h-3 w-3 fill-current" />
          <p className="text-[10px] font-medium">Deep focus mode active</p>
        </div>
      </CardContent>
    </Card>
  );
}
