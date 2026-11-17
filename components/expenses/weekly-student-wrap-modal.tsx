"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Coffee, 
  Wallet, 
  ShieldCheck, 
  Share2,
  Calendar
} from "lucide-react";
import { generateWeeklyStudentWrap, type ExpenseRecord, type StudentWrapSummary } from "@/lib/expenses/student-wrap";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WeeklyStudentWrapModalProps {
  expenses: ExpenseRecord[];
}

export function WeeklyStudentWrapModal({ expenses }: WeeklyStudentWrapModalProps) {
  const [open, setOpen] = useState(false);
  const wrap: StudentWrapSummary = generateWeeklyStudentWrap(expenses, new Date(), 2);

  const handleShare = () => {
    navigator.clipboard.writeText(
      `🎓 My Lumina Weekly Student Wrap:\nTotal Spent: ₹${wrap.totalSpent}\nProductive Ratio: ${wrap.goodRatioPercent}%\nBadge: ${wrap.personaBadge.icon} ${wrap.personaBadge.title}\nCooling Day Savings: ₹${wrap.coolingDaySavings}`
    );
    toast.success("Weekly Student Wrap summary copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-xs bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-purple-500/30">
          <Sparkles className="w-4 h-4 mr-1.5 text-purple-500" /> Weekly Student Wrap
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden border-2">
        {/* Story Header Banner with Gradient */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white text-center space-y-2 relative">
          <Badge className="bg-white/20 hover:bg-white/30 text-white text-[10px] uppercase tracking-wider backdrop-blur-sm border-none">
            {wrap.periodLabel}
          </Badge>
          <div className="text-5xl my-2">{wrap.personaBadge.icon}</div>
          <h2 className="text-2xl font-bold tracking-tight">{wrap.personaBadge.title}</h2>
          <p className="text-xs text-white/90 max-w-xs mx-auto leading-relaxed">
            {wrap.personaBadge.description}
          </p>
        </div>

        {/* Breakdown Body */}
        <div className="p-6 space-y-5 bg-card">
          {/* Main Key Metrics */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl border bg-accent/20">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Spent</span>
              <span className="text-2xl font-bold font-mono">₹{wrap.totalSpent}</span>
            </div>
            <div className="p-3 rounded-xl border bg-accent/20">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Productive Ratio</span>
              <span className="text-2xl font-bold font-mono text-emerald-500">{wrap.goodRatioPercent}%</span>
            </div>
          </div>

          {/* Good vs Bad Ratio Visual Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingDown className="w-3.5 h-3.5" /> Productive Essentials: ₹{wrap.goodSpent}
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <TrendingUp className="w-3.5 h-3.5" /> Impulse/Snacks: ₹{wrap.badSpent}
              </span>
            </div>
            <Progress value={wrap.goodRatioPercent} className="h-2.5 bg-destructive/20" />
          </div>

          {/* Cooling Day Savings Card */}
          <div className="p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Cooling Day Savings</p>
                <p className="text-[11px] text-muted-foreground">Saved by staying local on safe bunk days</p>
              </div>
            </div>
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +₹{wrap.coolingDaySavings}
            </span>
          </div>

          {/* Top Categories */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Spending Distribution
            </span>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {wrap.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs p-1.5 rounded-md hover:bg-accent/40">
                  <span className="font-medium">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px]">({cat.percent}%)</span>
                    <span className="font-mono font-bold">₹{cat.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share / Done Button */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleShare}>
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share Wrap
            </Button>
            <Button size="sm" className="w-full text-xs" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
