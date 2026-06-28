import { sanitizeText } from "@/lib/sanitize";

describe("sanitizeText", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
    expect(sanitizeText("<b>Bold</b> text")).toBe("Bold text");
  });

  it("removes javascript: URIs", () => {
    expect(sanitizeText("javascript:alert(1)")).toBe("alert(1)");
  });

  it("removes data: URIs", () => {
    expect(sanitizeText("data:text/html,<script>alert(1)</script>")).toBe(
      "text/html,alert(1)"
    );
  });

  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("strips nested/malformed tags iteratively", () => {
    expect(sanitizeText("<<script>script>alert(1)<</script>/script>")).not.toContain("<");
  });

  it("preserves plain text", () => {
    expect(sanitizeText("Fix login bug by EOD")).toBe("Fix login bug by EOD");
  });
});
