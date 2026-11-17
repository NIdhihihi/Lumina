import { describe, expect, it } from "vitest";
import { generateWeeklyStudentWrap, type ExpenseRecord } from "./student-wrap";

describe("Weekly Student Wrap Generator", () => {
  const sampleExpenses: ExpenseRecord[] = [
    { id: "1", amount: 80, category: "Food", type: "good", date: "2026-11-17" },
    { id: "2", amount: 40, category: "Transport", type: "good", date: "2026-11-16" },
    { id: "3", amount: 160, category: "Entertainment", type: "bad", date: "2026-11-15" },
    { id: "4", amount: 200, category: "Study", type: "good", date: "2026-11-14" },
  ];

  it("calculates total, good vs bad ratio, and top categories", () => {
    const wrap = generateWeeklyStudentWrap(sampleExpenses, new Date(), 2);
    expect(wrap.totalSpent).toBe(480);
    expect(wrap.goodSpent).toBe(320); // 80 + 40 + 200
    expect(wrap.badSpent).toBe(160);
    expect(wrap.goodRatioPercent).toBe(67); // 320/480 = ~67%
    expect(wrap.topCategory.name).toBe("Study"); // 200
    expect(wrap.coolingDaySavings).toBe(300); // 2 * 150
    expect(wrap.personaBadge.title).toBe("Frugal Scholar");
  });

  it("handles empty expenses cleanly", () => {
    const emptyWrap = generateWeeklyStudentWrap([]);
    expect(emptyWrap.totalSpent).toBe(0);
    expect(emptyWrap.personaBadge.title).toBe("Clean Slate Scholar");
  });
});
