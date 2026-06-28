import { generateBoardSummary } from "@/lib/ai";

const sampleCards = [
  { title: "Setup CI", status: "DONE", priority: "HIGH" },
  { title: "Fix login bug", status: "IN_PROGRESS", priority: "URGENT" },
  { title: "Write docs", status: "TODO", priority: "LOW" },
  { title: "Code review", status: "REVIEW", priority: "MEDIUM" },
];

const originalApiKey = process.env.ANTHROPIC_API_KEY;

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

afterAll(() => {
  if (originalApiKey !== undefined) {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  } else {
    delete process.env.ANTHROPIC_API_KEY;
  }
});

describe("generateBoardSummary", () => {
  it("returns fallback summary when no API key is set", async () => {
    const summary = await generateBoardSummary("Sprint 1", sampleCards);

    expect(summary).toContain("## Board Summary: Sprint 1");
    expect(summary).toContain("**Completed (1):**");
    expect(summary).toContain("- Setup CI");
    expect(summary).toContain("**In Progress (1):**");
    expect(summary).toContain("- Fix login bug");
    expect(summary).toContain("**In Review (1):**");
    expect(summary).toContain("- Code review");
    expect(summary).toContain("**Todo (1):**");
    expect(summary).toContain("- Write docs");
    expect(summary).toContain("**High Priority Items (2):**");
    expect(summary).toContain("⚠ Fix login bug [URGENT]");
    expect(summary).toContain("**Progress:** 25% complete (1/4 tasks done)");
  });

  it("returns fallback summary when API call fails", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as typeof fetch;

    const summary = await generateBoardSummary("Sprint 1", sampleCards);

    expect(summary).toContain("## Board Summary: Sprint 1");
    expect(summary).toContain("**Progress:**");
  });

  it("handles empty board", async () => {
    const summary = await generateBoardSummary("Empty Board", []);

    expect(summary).toContain("## Board Summary: Empty Board");
    expect(summary).toContain("**Progress:** 0% complete (0/0 tasks done)");
  });
});
