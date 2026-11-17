import { describe, it, expect } from "vitest";
import { evaluateBatteryPolicy, BATTERY_CRITICAL_THRESHOLD } from "./battery-guardian";

describe("Smart Battery Guardian", () => {
  it("triggers critical safety protocol when battery drops to or below 15% and discharging", () => {
    const policy = evaluateBatteryPolicy({ level: 14, isCharging: false });

    expect(policy.status).toBe("critical");
    expect(policy.shouldPauseRag).toBe(true);
    expect(policy.shouldTriggerFinalSync).toBe(true);
    expect(policy.alertTitle).toContain("Below 15%");
    expect(policy.alertMessage).toContain("paused background RAG indexing");
    expect(policy.alertMessage).toContain("Final Sync");
  });

  it("does not pause RAG or trigger panic sync when battery is charging even at 10%", () => {
    const policy = evaluateBatteryPolicy({ level: 10, isCharging: true });

    expect(policy.status).toBe("charging");
    expect(policy.shouldPauseRag).toBe(false);
    expect(policy.shouldTriggerFinalSync).toBe(false);
  });

  it("operates normally when battery is above threshold", () => {
    const policy = evaluateBatteryPolicy({ level: 65, isCharging: false });

    expect(policy.status).toBe("normal");
    expect(policy.shouldPauseRag).toBe(false);
    expect(policy.shouldTriggerFinalSync).toBe(false);
  });

  it("handles exact 15% threshold as critical boundary", () => {
    const policy = evaluateBatteryPolicy({ level: BATTERY_CRITICAL_THRESHOLD, isCharging: false });

    expect(policy.status).toBe("critical");
    expect(policy.shouldPauseRag).toBe(true);
    expect(policy.shouldTriggerFinalSync).toBe(true);
  });
});
