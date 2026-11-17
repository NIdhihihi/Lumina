"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer as TimerIcon, Coffee, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function FocusPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (mode === "focus") {
      setSessionsCompleted((prev) => prev + 1);
      toast.success("Focus session complete! Take a break.");
      setMode("break");
      setTimeLeft(5 * 60);
    } else {
      toast.success("Break complete! Time to focus.");
      setMode("focus");
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode("focus");
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = mode === "focus" 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Focus System</h2>
        <p className="text-muted-foreground">Deep work sessions for maximum productivity.</p>
      </div>

      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={cn("p-4 rounded-full", mode === "focus" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500")}>
              {mode === "focus" ? <Brain className="w-8 h-8" /> : <Coffee className="w-8 h-8" />}
            </div>
          </div>
          <CardTitle className="text-5xl font-mono font-bold">{formatTime(timeLeft)}</CardTitle>
          <CardDescription className="capitalize font-medium text-lg mt-2">
            {mode} Mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progress} className="h-3" />
          
          <div className="flex justify-center gap-4">
            <Button size="lg" className="w-32" onClick={toggleTimer}>
              {isActive ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Start</>}
            </Button>
            <Button size="lg" variant="outline" className="w-32" onClick={resetTimer}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>

          <div className="pt-6 border-t flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <TimerIcon className="w-4 h-4" />
              <span>Today's Sessions:</span>
            </div>
            <span className="font-bold text-foreground">{sessionsCompleted} / 8</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
        <div className="p-4 rounded-xl border bg-card text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Focus Score</p>
          <p className="text-2xl font-bold">{sessionsCompleted * 12.5}%</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Minutes Today</p>
          <p className="text-2xl font-bold">{sessionsCompleted * 25}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rank</p>
          <p className="text-2xl font-bold">{sessionsCompleted > 4 ? "Elite" : "Deep Thinker"}</p>
        </div>
      </div>
    </div>
  );
}
