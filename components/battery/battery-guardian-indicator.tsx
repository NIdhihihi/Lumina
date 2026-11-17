"use client";

import { useState } from "react";
import { Battery, BatteryCharging, BatteryWarning, ShieldAlert, Zap, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBatteryGuardian } from "@/hooks/use-battery-guardian";

export function BatteryGuardianIndicator() {
  const [open, setOpen] = useState(false);
  const { batteryLevel, isCharging, policy, isRagPaused, isSimulated, simulateBattery, resetSimulation } =
    useBatteryGuardian();

  const isCritical = policy.status === "critical";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 px-2.5 gap-1.5 transition-all text-xs border ${
            isCritical
              ? "bg-destructive/10 text-destructive border-destructive/40 animate-pulse"
              : isCharging
              ? "text-emerald-500 border-emerald-500/30 hover:border-emerald-500"
              : "text-muted-foreground border-border"
          }`}
          title="Smart Battery Guardian"
        >
          {isCharging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
          ) : isCritical ? (
            <BatteryWarning className="w-3.5 h-3.5 text-destructive" />
          ) : (
            <Battery className="w-3.5 h-3.5" />
          )}

          <span className="font-mono font-medium">{batteryLevel}%</span>

          {isCritical && (
            <Badge variant="destructive" className="h-4 px-1 text-[9px] font-bold">
              PAUSED
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Smart Battery Guardian
          </DialogTitle>
          <DialogDescription className="text-xs">
            Proactive power optimization for engineering students on low phone battery (&lt;15%).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Status Banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              isCritical
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : isCharging
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-accent/40 border-border"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isCharging ? (
                <BatteryCharging className="w-6 h-6 text-emerald-500" />
              ) : isCritical ? (
                <BatteryWarning className="w-6 h-6 text-destructive animate-bounce" />
              ) : (
                <Battery className="w-6 h-6 text-primary" />
              )}
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  {batteryLevel}% Battery {isCharging && "(Charging)"}
                  {isSimulated && <span className="text-[10px] text-muted-foreground font-normal">(Simulated)</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isCritical ? "Guardian Active: Critical Battery Protocol" : "Normal Power Operation"}
                </div>
              </div>
            </div>

            <Badge variant={isCritical ? "destructive" : "outline"} className="text-xs">
              {policy.status.toUpperCase()}
            </Badge>
          </div>

          {/* Autonomous Actions Taken */}
          <div className="space-y-2 border rounded-lg p-3 bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Autonomous Safety Measures:
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isRagPaused ? "text-amber-500" : "text-muted-foreground/40"
                  }`}
                />
                <div>
                  <span className="font-medium">Heavy RAG Indexing: </span>
                  <span className={isRagPaused ? "text-amber-500 font-semibold" : "text-muted-foreground"}>
                    {isRagPaused ? "Paused to prevent CPU/battery drain" : "Active / Standby"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isCritical ? "text-emerald-500" : "text-muted-foreground/40"
                  }`}
                />
                <div>
                  <span className="font-medium">Final Kanban Cloud Sync: </span>
                  <span className={isCritical ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                    {isCritical ? "Pushed successfully before phone shutdown" : "Standard periodic sync"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Demonstration / Simulation Controls */}
          <div className="pt-2 border-t space-y-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Interactive Simulation Trigger:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-destructive/30 hover:border-destructive text-destructive"
                onClick={() => simulateBattery(12, false)}
              >
                Simulate 12% Battery ⚠️
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-emerald-500/30 hover:border-emerald-500 text-emerald-500"
                onClick={() => simulateBattery(90, true)}
              >
                Simulate 90% (Charging) ⚡
              </Button>
            </div>
            {isSimulated && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground h-7"
                onClick={resetSimulation}
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Reset to Real Device Battery
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
