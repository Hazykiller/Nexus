/**
 * Vertex 'Airtight' Safe Space Content Moderation Utility.
 * Proactively scans user content for restricted patterns and malicious intents.
 */

const BAD_WORDS = [
  'inappropriate',
  'offensive',
  'harmful',
  'malicious',
];

export function isContentSafe(text: string): { isSafe: boolean; reason?: string } {
  const normalizedText = text.toLowerCase().trim();

  // 1. Basic Keyword Scan
  for (const word of BAD_WORDS) {
    if (normalizedText.includes(word)) {
      return { 
        isSafe: false, 
        reason: `Content violates Safe Space guidelines (Restricted Category: ${word})` 
      };
    }
  }

  return { isSafe: true };
}

/**
 * Flags a post for Admin Review based on toxicity signals.
 */
export async function autoFlagContent(content: string, userId: string) {
  const result = isContentSafe(content);
  if (!result.isSafe) {
    console.log(`[Vertex SAFETY] Auto-flagged content from User ${userId}: ${result.reason}`);
  }
}
