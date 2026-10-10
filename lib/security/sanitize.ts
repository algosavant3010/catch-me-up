/**
 * Caps and lightly sanitizes free-text user input before it is ever placed
 * into a prompt. This does not try to be a full HTML sanitizer — the text
 * only ever flows into a Gemini prompt (as clearly delimited, untrusted
 * data — see lib/ai/prompts.ts) and back out as plain text, never into
 * `dangerouslySetInnerHTML` or similar. We still strip control characters
 * and collapse excess whitespace to keep prompts small and predictable.
 */
export function sanitizeUserText(input: string, maxLength = 300): string {
  const stripped = input
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.slice(0, maxLength);
}
