import { describe, expect, it } from "vitest";
import { 
  calculateDecayedDebt, 
  applySwitchPenalty, 
  debtToFocusScore, 
  getFlowState 
} from "./cognitive-debt";

describe("cognitive debt exponential decay model", () => {
  it("decays cognitive debt exponentially over time", () => {
    const initialDebt = 50;
    const halfLife = 180; // 3 minutes

    // After 180 seconds, debt should be cut in half (~25)
    const decayedAfterHalfLife = calculateDecayedDebt(initialDebt, halfLife, halfLife);
    expect(decayedAfterHalfLife).toBeCloseTo(25, 0);

    // After 360 seconds (two half lives), debt should be ~12.5
    const decayedAfterTwoHalfLives = calculateDecayedDebt(initialDebt, halfLife * 2, halfLife);
    expect(decayedAfterTwoHalfLives).toBeCloseTo(12.5, 0);

    // 0 elapsed time leaves debt unchanged
    expect(calculateDecayedDebt(initialDebt, 0, halfLife)).toBe(50);
  });

  it("penalizes context switches and adds surcharge for rapid context switching", () => {
    const baseDebt = 20;
    const now = 100000;

    // Normal switch (first switch) adds base penalty (15)
    const firstSwitch = applySwitchPenalty(baseDebt, null, now);
    expect(firstSwitch.newDebt).toBe(35);
    expect(firstSwitch.isRapid).toBe(false);

    // Rapid switch 10 seconds later (< 30s threshold) adds base (15) + rapid penalty (10) = 25
    const rapidSwitch = applySwitchPenalty(35, now, now + 10000);
    expect(rapidSwitch.newDebt).toBe(60);
    expect(rapidSwitch.isRapid).toBe(true);
    expect(rapidSwitch.penaltyApplied).toBe(25);
  });

  it("caps debt at 100 and maps correctly to focus clarity score", () => {
    const capped = applySwitchPenalty(95, null);
    expect(capped.newDebt).toBe(100);

    expect(debtToFocusScore(0)).toBe(100);
    expect(debtToFocusScore(30)).toBe(70);
    expect(debtToFocusScore(100)).toBe(0);
  });

  it("classifies flow states correctly", () => {
    expect(getFlowState(90).level).toBe("deep_flow");
    expect(getFlowState(65).level).toBe("moderate");
    expect(getFlowState(40).level).toBe("high_debt");
  });
});
