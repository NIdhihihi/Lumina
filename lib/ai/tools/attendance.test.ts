import { describe, expect, it } from "vitest";
import {
  attendanceRiskLevel,
  classesCanMiss,
  classesNeededToReachTarget,
  currentAttendancePercent,
  projectedAttendance,
} from "./attendance";
import type { Subject } from "@/lib/types";

const subject: Subject = {
  id: "1",
  name: "Theory of Computation",
  attended: 28,
  total: 35,
};

describe("attendance tools", () => {
  it("computes current attendance percent", () => {
    expect(currentAttendancePercent(subject)).toBe(80);
    expect(currentAttendancePercent({ ...subject, total: 0 })).toBe(0);
  });

  it("projects attendance after missing classes", () => {
    expect(projectedAttendance(subject, 1)).toBeCloseTo(77.8, 1);
    expect(projectedAttendance(subject, 0)).toBe(80);
  });

  it("computes classes that can be missed", () => {
    expect(classesCanMiss(subject, 75)).toBe(2);
    expect(classesCanMiss({ ...subject, attended: 20, total: 30 }, 75)).toBe(0);
  });

  it("computes classes needed to reach target", () => {
    expect(classesNeededToReachTarget(subject, 75)).toBe(0);
    expect(classesNeededToReachTarget({ ...subject, attended: 20, total: 30 }, 75)).toBe(10);
  });

  it("assigns attendance risk levels", () => {
    expect(attendanceRiskLevel(80, 75)).toBe("safe");
    expect(attendanceRiskLevel(74, 75)).toBe("warning");
    expect(attendanceRiskLevel(60, 75)).toBe("critical");
  });
});
