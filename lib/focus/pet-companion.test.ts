import { describe, expect, it } from "vitest";
import { getPetReaction } from "./pet-companion";

describe("Study Pet Companion reactions", () => {
  it("triggers angry slap reaction on tab switch distraction", () => {
    const reaction = getPetReaction("tab_switch");
    expect(reaction.mood).toBe("angry");
    expect(reaction.action).toBe("slap");
    expect(reaction.speech).toMatch(/(screen|YouTube|exam|TAB SWITCH|Concentration)/i);
  });

  it("triggers praise reaction during sustained deep focus", () => {
    const reaction = getPetReaction("long_focus");
    expect(reaction.mood).toBe("happy");
    expect(reaction.action).toBe("sparkles");
    expect(reaction.speech).toMatch(/(flow state|cooking|clean focus|solid focus|unbroken)/i);
  });

  it("triggers squad rivalry jealousy reaction with member name", () => {
    const reaction = getPetReaction("squad_rivalry", { squadMember: "Aarav" });
    expect(reaction.mood).toBe("jealous");
    expect(reaction.speech).toContain("Aarav");
    expect(reaction.action).toBe("shake");
  });

  it("celebrates upon session complete", () => {
    const reaction = getPetReaction("session_complete");
    expect(reaction.mood).toBe("celebrating");
    expect(reaction.action).toBe("sparkles");
  });

  it("handles poke interaction with playful warning", () => {
    const reaction = getPetReaction("poke");
    expect(reaction.mood).toBe("focused");
    expect(reaction.speech).toMatch(/(poke|poking)/i);
  });
});
