import {
  generateInviteCode,
  formatDate,
  timeAgo,
  getStatusLabel,
  getPriorityColor,
  getStatusColor,
} from "@/lib/utils";

describe("generateInviteCode", () => {
  it("returns a 32-character hex string", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(code)).toBe(true);
  });

  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateInviteCode()));
    expect(codes.size).toBe(50);
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2025-01-15T10:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2025-06-01"));
    expect(result).toContain("2025");
  });
});

describe("timeAgo", () => {
  it("returns 'just now' for recent dates", () => {
    expect(timeAgo(new Date())).toBe("just now");
  });

  it("returns minutes for dates within the hour", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours for dates within the day", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(timeAgo(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days for dates within the week", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(timeAgo(threeDaysAgo)).toBe("3d ago");
  });
});

describe("getStatusLabel", () => {
  it("maps status enums to labels", () => {
    expect(getStatusLabel("TODO")).toBe("Todo");
    expect(getStatusLabel("IN_PROGRESS")).toBe("In Progress");
    expect(getStatusLabel("REVIEW")).toBe("Review");
    expect(getStatusLabel("DONE")).toBe("Done");
  });

  it("returns the input for unknown statuses", () => {
    expect(getStatusLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("getPriorityColor", () => {
  it("returns color classes for each priority", () => {
    expect(getPriorityColor("LOW")).toContain("bg-gray");
    expect(getPriorityColor("MEDIUM")).toContain("bg-blue");
    expect(getPriorityColor("HIGH")).toContain("bg-orange");
    expect(getPriorityColor("URGENT")).toContain("bg-red");
  });
});

describe("getStatusColor", () => {
  it("returns color classes for each status", () => {
    expect(getStatusColor("TODO")).toContain("bg-gray");
    expect(getStatusColor("IN_PROGRESS")).toContain("bg-blue");
    expect(getStatusColor("REVIEW")).toContain("bg-yellow");
    expect(getStatusColor("DONE")).toContain("bg-green");
  });
});
