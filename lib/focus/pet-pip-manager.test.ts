import { describe, expect, it, vi } from "vitest";
import {
  isPetPipOpen,
  getPetPipContainer,
  subscribeToPetPip,
  closePetPipWindow,
  openPetPipWindow,
} from "./pet-pip-manager";

describe("Document PiP Manager for Kiko Focus Pet", () => {
  it("initializes with PiP closed and null container", () => {
    expect(isPetPipOpen()).toBe(false);
    expect(getPetPipContainer()).toBeNull();
  });

  it("subscribes and receives container updates", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToPetPip(callback);

    expect(callback).toHaveBeenCalledWith(null);

    unsubscribe();
  });

  it("safely executes closePetPipWindow without errors when no window is active", () => {
    expect(() => closePetPipWindow()).not.toThrow();
    expect(isPetPipOpen()).toBe(false);
  });

  it("handles environment without documentPictureInPicture gracefully", async () => {
    const result = await openPetPipWindow();
    expect(result).toBeNull();
  });
});
