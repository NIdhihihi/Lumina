export interface BatteryState {
  level: number; // 0 to 100
  isCharging: boolean;
}

export interface BatteryPolicyResult {
  status: "normal" | "low" | "critical" | "charging";
  shouldPauseRag: boolean;
  shouldTriggerFinalSync: boolean;
  alertTitle?: string;
  alertMessage?: string;
}

export const BATTERY_CRITICAL_THRESHOLD = 15; // 15% as specified in hackathon problem statement

/**
 * Smart Battery Guardian Decision Engine:
 * If the student's phone battery drops below 15%, the agent proactively:
 * 1. Pauses heavy background RAG indexing to preserve device uptime.
 * 2. Triggers a Final Sync of the Kanban board so team members don't lose updates.
 */
export function evaluateBatteryPolicy(battery: BatteryState): BatteryPolicyResult {
  const { level, isCharging } = battery;

  if (isCharging) {
    return {
      status: "charging",
      shouldPauseRag: false,
      shouldTriggerFinalSync: false,
    };
  }

  if (level <= BATTERY_CRITICAL_THRESHOLD) {
    return {
      status: "critical",
      shouldPauseRag: true,
      shouldTriggerFinalSync: true,
      alertTitle: "Smart Battery Guardian Active (Below 15%)",
      alertMessage: `Phone battery dropped to ${Math.round(level)}%. Proactively paused background RAG indexing and pushed a Final Sync of your Kanban board to your team before shutdown.`,
    };
  }

  if (level <= 25) {
    return {
      status: "low",
      shouldPauseRag: false,
      shouldTriggerFinalSync: false,
      alertTitle: "Battery Low",
      alertMessage: `Battery at ${Math.round(level)}%. Consider plugging in soon.`,
    };
  }

  return {
    status: "normal",
    shouldPauseRag: false,
    shouldTriggerFinalSync: false,
  };
}
