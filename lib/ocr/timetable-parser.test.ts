import { describe, expect, it } from "vitest";
import { parseTimetableText } from "./timetable-parser";

describe("timetable OCR parser", () => {
  it("parses day headers and time slots correctly", () => {
    const rawSample = `
MONDAY
09:00 - 10:00 Data Structures CS201 Room 204
11:00 AM - 12:00 PM Operating Systems CS302 Lab 1

WEDNESDAY
14:00 - 15:30 Database Systems CS301 Room L-105
    `;

    const parsed = parseTimetableText(rawSample);
    expect(parsed.length).toBe(3);

    expect(parsed[0].dayOfWeek).toBe(1); // Monday
    expect(parsed[0].startTime).toBe("09:00");
    expect(parsed[0].endTime).toBe("10:00");
    expect(parsed[0].subjectCode).toBe("CS201");
    expect(parsed[0].location).toMatch(/Room 204/i);

    expect(parsed[1].dayOfWeek).toBe(1); // Monday
    expect(parsed[1].startTime).toBe("11:00");
    expect(parsed[1].endTime).toBe("12:00");

    expect(parsed[2].dayOfWeek).toBe(3); // Wednesday
    expect(parsed[2].startTime).toBe("14:00");
    expect(parsed[2].endTime).toBe("15:30");
    expect(parsed[2].subjectCode).toBe("CS301");
  });

  it("handles 12-hour AM/PM formats", () => {
    const rawSample = `
Friday
2:00 PM - 3:00 PM Computer Networks CS401 Hall-B
    `;
    const parsed = parseTimetableText(rawSample);
    expect(parsed.length).toBe(1);
    expect(parsed[0].dayOfWeek).toBe(5); // Friday
    expect(parsed[0].startTime).toBe("14:00");
    expect(parsed[0].endTime).toBe("15:00");
    expect(parsed[0].location).toMatch(/Hall-B/i);
  });
});
