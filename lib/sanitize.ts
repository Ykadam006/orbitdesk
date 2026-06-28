/**
 * Iteratively strip HTML tags, decode common entities, and remove dangerous URI schemes.
 */
export function sanitizeText(input: string): string {
  let result = input;

  for (let i = 0; i < 5; i++) {
    const previous = result;
    result = result
      .replace(/<[^>]*>/gi, "")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
      .replace(/&#x?[0-9a-f]+;/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/data:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
    if (result === previous) break;
  }

  return result.trim();
}
