export interface ContextSwitchEvent {
  id: string;
  timestamp: number; // Unix epoch ms
  type: "switch_away" | "return" | "focus_stretch";
  label: string;
  durationSeconds?: number;
  debtAtEvent: number;
}

export interface CognitiveDebtConfig {
  halfLifeSeconds: number; // e.g. 180s (3 min of deep focus halves the debt)
  basePenalty: number;     // e.g. 15 points per switch
  rapidSwitchThreshold: number; // e.g. 30s
  rapidSwitchPenalty: number;   // e.g. 10 extra points
}

export const DEFAULT_CONFIG: CognitiveDebtConfig = {
  halfLifeSeconds: 180,
  basePenalty: 15,
  rapidSwitchThreshold: 30,
  rapidSwitchPenalty: 10,
};

/**
 * Calculates decayed cognitive debt after `elapsedSeconds` of uninterrupted focus.
 * Formula: Debt(t) = Debt_0 * e^(-lambda * elapsedSeconds)
 * where lambda = ln(2) / halfLifeSeconds
 */
export function calculateDecayedDebt(
  debt: number,
  elapsedSeconds: number,
  halfLifeSeconds: number = DEFAULT_CONFIG.halfLifeSeconds
): number {
  if (debt <= 0 || elapsedSeconds <= 0) return Math.max(0, debt);
  const lambda = Math.LN2 / halfLifeSeconds;
  const decayed = debt * Math.exp(-lambda * elapsedSeconds);
  return Math.max(0, Math.round(decayed * 10) / 10);
}

/**
 * Applies a switch penalty when the student interrupts focus (window blur / tab switch).
 * If the switch happens within rapidSwitchThreshold seconds of the previous switch,
 * a rapid switching surcharge is applied.
 */
export function applySwitchPenalty(
  currentDebt: number,
  lastSwitchTimestamp: number | null,
  currentTimestamp: number = Date.now(),
  config: CognitiveDebtConfig = DEFAULT_CONFIG
): { newDebt: number; isRapid: boolean; penaltyApplied: number } {
  let penalty = config.basePenalty;
  let isRapid = false;

  if (lastSwitchTimestamp !== null) {
    const elapsedSinceLastSwitch = (currentTimestamp - lastSwitchTimestamp) / 1000;
    if (elapsedSinceLastSwitch <= config.rapidSwitchThreshold) {
      penalty += config.rapidSwitchPenalty;
      isRapid = true;
    }
  }

  const newDebt = Math.min(100, Math.round((currentDebt + penalty) * 10) / 10);
  return { newDebt, isRapid, penaltyApplied: penalty };
}

/**
 * Computes Focus Score from Cognitive Debt (0 - 100)
 */
export function debtToFocusScore(debt: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - debt)));
}

export type FlowLevel = "deep_flow" | "moderate" | "high_debt";

export function getFlowState(focusScore: number): {
  level: FlowLevel;
  label: string;
  color: string;
  badgeClass: string;
} {
  if (focusScore >= 80) {
    return {
      level: "deep_flow",
      label: "Deep Flow",
      color: "#22c55e",
      badgeClass: "bg-green-500/10 text-green-500 border-green-500/20",
    };
  }
  if (focusScore >= 50) {
    return {
      level: "moderate",
      label: "Fragmented Focus",
      color: "#f59e0b",
      badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    };
  }
  return {
    level: "high_debt",
    label: "High Cognitive Debt",
    color: "#ef4444",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20 animate-pulse",
  };
}
