export type PetMood = "happy" | "focused" | "angry" | "jealous" | "celebrating";

export interface PetReaction {
  mood: PetMood;
  speech: string;
  action: "none" | "slap" | "shake" | "sparkles";
}

const ANGRY_SLAP_LINES = [
  "HEY! Your screen disagrees! GET BACK TO WORK! 😾💥",
  "Did you just open YouTube/Instagram?! *SLAPS SCREEN* 💢",
  "That semester exam isn't passing itself! Eyes on the screen! 💥",
  "TAB SWITCH DETECTED! Don't make me slap you again! 😤",
  "Concentration broken! Minus brownie points! BACK TO IT! ⚡",
];

const PRAISE_LINES = [
  "Flow state unlocked! Let's get that 9.0 CGPA 🔥",
  "You're actually cooking right now. Keep this momentum! 🚀",
  "Clean focus stretch. Keep this pace going 🎓",
  "45 minutes unbroken. Solid focus block ✨",
];

const JEALOUS_SQUAD_LINES = [
  "Meanwhile, Priya has been locked in for 45 mins. Don't let her beat you! 😤",
  "Arjun from your squad just finished 2 Pomodoro sets. Catch up! ⚡",
  "Squad rank is slipping! Stop slacking or we lose the daily streak! 🏆",
  "Neha is currently #1 in the study squad. Time to dethrone her! 🔥",
];

const CELEBRATION_LINES = [
  "Session finished! 25 minutes logged. Step away and take a break 🎉",
  "Timer hit zero! Mission accomplished. Take a walk! 🥳",
  "Top tier session! Focus block secured! 🌟",
];

const POKE_LINES = [
  "Hey! Don't poke me, read your notes! 📚",
  "I'm keeping watch! Stop poking and solve problems! 👀",
  "Poke your syllabus, not me! 😼",
];

export function getPetReaction(
  event: "tab_switch" | "long_focus" | "squad_rivalry" | "session_complete" | "poke",
  context?: { squadMember?: string; focusMinutes?: number }
): PetReaction {
  switch (event) {
    case "tab_switch": {
      const idx = Math.floor(Math.random() * ANGRY_SLAP_LINES.length);
      return {
        mood: "angry",
        speech: ANGRY_SLAP_LINES[idx],
        action: "slap",
      };
    }
    case "long_focus": {
      const idx = Math.floor(Math.random() * PRAISE_LINES.length);
      return {
        mood: "happy",
        speech: PRAISE_LINES[idx],
        action: "sparkles",
      };
    }
    case "squad_rivalry": {
      const member = context?.squadMember || "Priya";
      const line = `Meanwhile, ${member} is locked in with a 45-min streak. Don't drag the squad down! 😤`;
      return {
        mood: "jealous",
        speech: line,
        action: "shake",
      };
    }
    case "session_complete": {
      const idx = Math.floor(Math.random() * CELEBRATION_LINES.length);
      return {
        mood: "celebrating",
        speech: CELEBRATION_LINES[idx],
        action: "sparkles",
      };
    }
    case "poke": {
      const idx = Math.floor(Math.random() * POKE_LINES.length);
      return {
        mood: "focused",
        speech: POKE_LINES[idx],
        action: "shake",
      };
    }
    default:
      return {
        mood: "focused",
        speech: "Locked in. Keep going!",
        action: "none",
      };
  }
}
