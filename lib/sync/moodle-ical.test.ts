import { describe, it, expect } from "vitest";
import { parseMoodleIcal, parseIcalDate, SAMPLE_MOODLE_ICAL_FEED } from "./moodle-ical";

describe("College Moodle iCalendar (.ics) Parser", () => {
  it("parses standard iCal date timestamps accurately", () => {
    const res = parseIcalDate("20261122T182900Z");
    expect(res.date).toBe("2026-11-22");
    expect(res.time).toBe("18:29");

    const allDay = parseIcalDate("20261125");
    expect(allDay.date).toBe("2026-11-25");
  });

  it("extracts real college Moodle assignments, quizzes, and labs from raw .ics feed", () => {
    const events = parseMoodleIcal(SAMPLE_MOODLE_ICAL_FEED);

    expect(events.length).toBe(3);

    // Assignment 1
    expect(events[0].courseName).toBe("CS301");
    expect(events[0].type).toBe("assignment");
    expect(events[0].dueDate).toBe("2026-11-22");
    expect(events[0].title).toContain("Assignment 3");

    // Quiz 2
    expect(events[1].courseName).toBe("CS304");
    expect(events[1].type).toBe("quiz");
    expect(events[1].urgency).toBe("high");

    // Lab 3
    expect(events[2].courseName).toBe("EE301");
    expect(events[2].type).toBe("lab");
  });

  it("handles malformed or empty feed gracefully without crashing", () => {
    expect(parseMoodleIcal("")).toEqual([]);
    expect(parseMoodleIcal("HELLO WORLD NOT CALENDAR")).toEqual([]);
  });
});
