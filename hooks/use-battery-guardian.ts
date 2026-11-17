"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { evaluateBatteryPolicy, type BatteryState, type BatteryPolicyResult } from "@/lib/battery/battery-guardian";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";

export function useBatteryGuardian() {
  const { setRagPaused } = useLuminaStore();
  const [batteryState, setBatteryState] = useState<BatteryState>({ level: 100, isCharging: true });
  const [policy, setPolicy] = useState<BatteryPolicyResult>({
    status: "normal",
    shouldPauseRag: false,
    shouldTriggerFinalSync: false,
  });
  const [isSimulated, setIsSimulated] = useState(false);
  const finalSyncTriggered = useRef(false);

  const applyPolicy = useCallback(async (state: BatteryState) => {
    const nextPolicy = evaluateBatteryPolicy(state);
    setPolicy(nextPolicy);
    setRagPaused(nextPolicy.shouldPauseRag);

    if (nextPolicy.shouldTriggerFinalSync && !finalSyncTriggered.current) {
      finalSyncTriggered.current = true;

      // 1. Trigger Final Sync of the Kanban board to team server
      try {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `[FINAL BATTERY SYNC ${Math.round(state.level)}%] Automated Progress Checkpoint`,
            status: "doing",
            priority: "high",
            projectName: "Lumina Core Sync",
            phase: "Phase 8: Guardian Final Sync",
            assignee: { name: "Vatsal & Renee", avatar: "VR" },
          }),
        });
      } catch (err) {
        console.error("Final sync network fallback:", err);
      }

      // 2. Alert the user proactively
      toast.error(nextPolicy.alertTitle || "Smart Battery Guardian", {
        description: nextPolicy.alertMessage,
        duration: 9000,
      });
    }

    // Reset sync trigger flag if student plugged phone in to charge
    if (state.isCharging || state.level > 15) {
      finalSyncTriggered.current = false;
    }
  }, []);

  useEffect(() => {
    if (isSimulated) return;

    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateState = () => {
          const nextState: BatteryState = {
            level: Math.round(battery.level * 100),
            isCharging: battery.charging,
          };
          setBatteryState(nextState);
          applyPolicy(nextState);
        };

        updateState();
        battery.addEventListener("levelchange", updateState);
        battery.addEventListener("chargingchange", updateState);

        return () => {
          battery.removeEventListener("levelchange", updateState);
          battery.removeEventListener("chargingchange", updateState);
        };
      }).catch(() => {
        // Fallback default state
        setBatteryState({ level: 82, isCharging: false });
      });
    } else {
      // Browser doesn't support getBattery
      setBatteryState({ level: 78, isCharging: false });
    }
  }, [isSimulated, applyPolicy]);

  const simulateBattery = (level: number, isCharging: boolean) => {
    setIsSimulated(true);
    const simulatedState = { level, isCharging };
    setBatteryState(simulatedState);
    applyPolicy(simulatedState);
  };

  const resetSimulation = () => {
    setIsSimulated(false);
    finalSyncTriggered.current = false;
    setRagPaused(false);
    setBatteryState({ level: 85, isCharging: true });
    setPolicy({
      status: "normal",
      shouldPauseRag: false,
      shouldTriggerFinalSync: false,
    });
  };

  return {
    batteryLevel: batteryState.level,
    isCharging: batteryState.isCharging,
    policy,
    isRagPaused: policy.shouldPauseRag,
    isSimulated,
    simulateBattery,
    resetSimulation,
  };
}
