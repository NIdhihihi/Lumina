"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getFlowState } from "@/lib/focus/cognitive-debt";

export function FocusWidget() {
  // Can be wired to stored session score or default 85%
  const focusScore = 85;
  const flow = getFlowState(focusScore);

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Focus & Flow Score</CardTitle>
        <Timer className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{focusScore}/100</div>
          <Link href="/focus" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
            Focus Room <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-green-500">
          <Zap className="h-3 w-3 fill-current" />
          <p className="text-[10px] font-medium">{flow.label} • Debt: 15</p>
        </div>
      </CardContent>
    </Card>
  );
}
