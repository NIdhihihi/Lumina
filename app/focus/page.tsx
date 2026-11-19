"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer as TimerIcon, Coffee, Brain, Zap, ArrowRightLeft, Users, AppWindow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import {
  calculateDecayedDebt,
  applySwitchPenalty,
  debtToFocusScore,
  getFlowState,
  type ContextSwitchEvent,
} from "@/lib/focus/cognitive-debt";
import { TaskSwitchTimeline } from "@/components/focus/task-switch-timeline";
import { StudySquads } from "@/components/focus/study-squads";

export default function FocusPage() {
  const { 
    focusSession, 
    startFocus, 
    pauseFocus, 
    resumeFocus, 
    stopFocus, 
    recordDistraction, 
    setPetMood,
    togglePetEnabled
  } = useLuminaStore();

  const [timeLeft, setTimeLeft] = useState(focusSession.timeLeft || 25 * 60);
  const [isActive, setIsActive] = useState(focusSession.isActive);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Cognitive Debt State
  const [cognitiveDebt, setCognitiveDebt] = useState(15); // baseline starting debt
  const [timelineEvents, setTimelineEvents] = useState<ContextSwitchEvent[]>([]);
  const lastSwitchRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const lastFocusStretchRef = useRef<number>(Date.now());

  const focusScore = debtToFocusScore(cognitiveDebt);
  const flowState = getFlowState(focusScore);

  // Sync state with global store
  useEffect(() => {
    setIsActive(focusSession.isActive);
  }, [focusSession.isActive]);

  useEffect(() => {
    if (focusSession.isActive) {
      setTimeLeft(focusSession.timeLeft);
    }
  }, [focusSession.timeLeft, focusSession.isActive]);

  // Exponential decay of cognitive debt driven by focus timer ticks
  useEffect(() => {
    if (isActive && mode === "focus") {
      setCognitiveDebt((prevDebt) => calculateDecayedDebt(prevDebt, 1));
    }
  }, [focusSession.timeLeft, isActive, mode]);

  useEffect(() => {
    if (isActive && timeLeft === 0) {
      handleTimerComplete();
    }
  }, [isActive, timeLeft]);

  // ContextSwitch Screen & Visibility Event Listeners
  useEffect(() => {
    if (!isActive || mode !== "focus") return;

    const handleVisibilityOrBlur = () => {
      if (document.hidden) {
        const now = Date.now();
        const stretchSeconds = Math.round((now - lastFocusStretchRef.current) / 1000);

        // Apply switch penalty
        const { newDebt, isRapid, penaltyApplied } = applySwitchPenalty(
          cognitiveDebt,
          lastSwitchRef.current,
          now
        );
        lastSwitchRef.current = now;
        setCognitiveDebt(newDebt);

        const newEvent: ContextSwitchEvent = {
          id: `switch-${now}`,
          timestamp: now,
          type: "switch_away",
          label: isRapid
            ? "Rapid Task Switch Detected!"
            : "Context Switch: Switched away from Lumina",
          durationSeconds: stretchSeconds,
          debtAtEvent: newDebt,
        };
        setTimelineEvents((prev) => [...prev, newEvent]);

        toast.error("ContextSwitch: 'You said you were studying. Your screen disagrees.'", {
          description: `+${penaltyApplied} Cognitive Debt penalty applied. Stay focused!`,
        });
      } else {
        // Return event
        const returnNow = Date.now();
        lastFocusStretchRef.current = returnNow;
        setTimelineEvents((prev) => [
          ...prev,
          {
            id: `return-${returnNow}`,
            timestamp: returnNow,
            type: "return",
            label: "Returned to study session",
            debtAtEvent: cognitiveDebt,
          },
        ]);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrBlur);
    window.addEventListener("blur", handleVisibilityOrBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrBlur);
      window.removeEventListener("blur", handleVisibilityOrBlur);
    };
  }, [isActive, mode, cognitiveDebt]);

  const handleTimerComplete = () => {
    setIsActive(false);
    stopFocus();
    if (mode === "focus") {
      setSessionsCompleted((prev) => prev + 1);
      toast.success("Focus block complete! Cognitive debt reduced.");
      setMode("break");
      setTimeLeft(5 * 60);
    } else {
      toast.success("Break complete! Ready for deep flow.");
      setMode("focus");
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    if (!isActive) {
      sessionStartRef.current = Date.now();
      lastFocusStretchRef.current = Date.now();
      if (!focusSession.isActive) {
        startFocus(Math.round(timeLeft / 60) || 25);
      } else {
        resumeFocus();
      }
      setIsActive(true);

      // Auto-open floating mascot across laptop screen
      if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
        window.dispatchEvent(new CustomEvent("lumina-open-pip"));
      }
    } else {
      pauseFocus();
      setIsActive(false);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode("focus");
    setTimeLeft(25 * 60);
    stopFocus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress =
    mode === "focus"
      ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
      : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ContextSwitch & Focus Engine</h2>
          <p className="text-muted-foreground">
            Monitors real-time task switching and calculates Cognitive Debt via exponential decay.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("text-xs px-3 py-1 font-semibold", flowState.badgeClass)}>
            <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
            {flowState.label} ({focusScore}%)
          </Badge>
          <div className="text-xs text-muted-foreground bg-accent px-3 py-1 rounded-full font-mono">
            Debt: {Math.round(cognitiveDebt)}/100
          </div>
          {/* Pet Toggle Symbol */}
          <Button
            variant="outline"
            size="sm"
            onClick={togglePetEnabled}
            className={cn(
              "text-xs px-2.5 py-1 h-7 rounded-full gap-1.5 transition-all",
              focusSession.isPetEnabled
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-border text-muted-foreground hover:bg-accent opacity-60"
            )}
            title={focusSession.isPetEnabled ? "Study Pet Companion: ON (Click to turn off)" : "Study Pet Companion: OFF (Click to turn on)"}
          >
            <span className="text-sm">🐱</span>
            <span className="text-[11px] font-medium hidden sm:inline">
              Pet: {focusSession.isPetEnabled ? "ON" : "OFF"}
            </span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="session" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="session" className="flex items-center gap-2">
            <Brain className="w-4 h-4" /> Deep Focus Session
          </TabsTrigger>
          <TabsTrigger value="squads" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Study Squads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="session" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-7">
            {/* Left: Active Pomodoro & Debt Meter */}
            <div className="md:col-span-3 space-y-4">
              <Card className="border-2 text-center">
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    <div
                      className={cn(
                        "p-4 rounded-full",
                        mode === "focus" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
                      )}
                    >
                      {mode === "focus" ? <Brain className="w-8 h-8" /> : <Coffee className="w-8 h-8" />}
                    </div>
                  </div>
                  <CardTitle className="text-5xl font-mono font-bold">{formatTime(timeLeft)}</CardTitle>
                  <CardDescription className="capitalize font-medium text-base mt-1">
                    {mode} Block • {isActive ? "Tracking Context Switches" : "Ready"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={progress} className="h-2.5" />

                  <div className="flex justify-center gap-4">
                    <Button size="lg" className="w-32" onClick={toggleTimer}>
                      {isActive ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" /> Start Focus
                        </>
                      )}
                    </Button>
                    <Button size="lg" variant="outline" className="w-32" onClick={resetTimer}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                  </div>

                  {/* Pet Symbol Toggle Button & Laptop Screen Float */}
                  <div className="flex flex-wrap justify-center items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={togglePetEnabled}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        focusSession.isPetEnabled
                          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                          : "border-border text-muted-foreground hover:bg-accent/40 opacity-70"
                      )}
                      title="Toggle floating study pet on screen"
                    >
                      <span className="text-sm">🐱</span>
                      <span>Study Pet: <strong>{focusSession.isPetEnabled ? "ON" : "OFF"}</strong></span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("lumina-toggle-pip"));
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Float pet across all windows on your laptop screen"
                    >
                      <AppWindow className="w-3.5 h-3.5" />
                      <span>Float Across Laptop Screen</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-accent/30 text-left">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Cognitive Debt
                      </span>
                      <span className="text-lg font-bold font-mono text-destructive">
                        {Math.round(cognitiveDebt)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-accent/30 text-left">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Flow Clarity
                      </span>
                      <span className="text-lg font-bold font-mono text-green-500">
                        {focusScore}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 rounded-xl border bg-card text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                  Exponential Decay Model
                </p>
                <p>
                  Every rapid tab switch or screen interruption adds an immediate <strong>+15 debt penalty</strong>.
                  Sustained uninterrupted study cuts accumulated debt in half every <strong>3 minutes</strong>.
                </p>
              </div>
            </div>

            {/* Right: Real-time Task-Switching Timeline */}
            <div className="md:col-span-4">
              <TaskSwitchTimeline
                events={timelineEvents}
                sessionStartTime={sessionStartRef.current}
                currentDebt={cognitiveDebt}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="squads">
          <StudySquads userFlowScore={focusScore} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
