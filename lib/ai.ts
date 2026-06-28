import { rateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

interface CardData {
  title: string;
  status: string;
  priority: string;
  assignedTo?: string | null;
  dueDate?: string | null;
}

const AI_TIMEOUT_MS = 30_000;
const AI_RATE_LIMIT = 5;
const AI_RATE_WINDOW_MS = 60_000;

export async function generateBoardSummary(
  boardTitle: string,
  cards: CardData[],
  userId?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return generateFallbackSummary(boardTitle, cards);
  }

  if (userId) {
    const limit = rateLimit(`ai:${userId}`, AI_RATE_LIMIT, AI_RATE_WINDOW_MS);
    if (!limit.success) {
      return generateFallbackSummary(boardTitle, cards);
    }
  }

  const cardList = cards
    .map(
      (c) =>
        `- "${c.title}" [${c.status}] [Priority: ${c.priority}]${c.assignedTo ? ` (Assigned: ${c.assignedTo})` : ""}${c.dueDate ? ` (Due: ${c.dueDate})` : ""}`
    )
    .join("\n");

  const prompt = `You are a project management assistant. Analyze this Kanban board and provide a concise project summary.

Board: "${boardTitle}"

Cards:
${cardList}

Provide a brief summary covering:
1. Completed work
2. In progress items
3. Blockers or items in review
4. High priority / urgent items
5. Suggested next steps

Keep it concise and actionable. Use bullet points.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      logger.warn("AI API request failed", { status: response.status });
      return generateFallbackSummary(boardTitle, cards);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    logger.warn("AI summary generation failed", { error: String(error) });
    return generateFallbackSummary(boardTitle, cards);
  } finally {
    clearTimeout(timeout);
  }
}

function generateFallbackSummary(boardTitle: string, cards: CardData[]): string {
  const byStatus = {
    TODO: cards.filter((c) => c.status === "TODO"),
    IN_PROGRESS: cards.filter((c) => c.status === "IN_PROGRESS"),
    REVIEW: cards.filter((c) => c.status === "REVIEW"),
    DONE: cards.filter((c) => c.status === "DONE"),
  };

  const urgent = cards.filter((c) => c.priority === "URGENT" || c.priority === "HIGH");

  let summary = `## Board Summary: ${boardTitle}\n\n`;

  if (byStatus.DONE.length > 0) {
    summary += `**Completed (${byStatus.DONE.length}):**\n`;
    byStatus.DONE.forEach((c) => (summary += `- ${c.title}\n`));
    summary += "\n";
  }

  if (byStatus.IN_PROGRESS.length > 0) {
    summary += `**In Progress (${byStatus.IN_PROGRESS.length}):**\n`;
    byStatus.IN_PROGRESS.forEach((c) => (summary += `- ${c.title}\n`));
    summary += "\n";
  }

  if (byStatus.REVIEW.length > 0) {
    summary += `**In Review (${byStatus.REVIEW.length}):**\n`;
    byStatus.REVIEW.forEach((c) => (summary += `- ${c.title}\n`));
    summary += "\n";
  }

  if (byStatus.TODO.length > 0) {
    summary += `**Todo (${byStatus.TODO.length}):**\n`;
    byStatus.TODO.forEach((c) => (summary += `- ${c.title}\n`));
    summary += "\n";
  }

  if (urgent.length > 0) {
    summary += `**High Priority Items (${urgent.length}):**\n`;
    urgent.forEach((c) => (summary += `- ⚠ ${c.title} [${c.priority}]\n`));
    summary += "\n";
  }

  const total = cards.length;
  const donePercent = total > 0 ? Math.round((byStatus.DONE.length / total) * 100) : 0;
  summary += `**Progress:** ${donePercent}% complete (${byStatus.DONE.length}/${total} tasks done)\n`;

  return summary;
}
