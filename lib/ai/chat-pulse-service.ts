import { ChatPulse, chatPulseGeminiSchema } from "./schemas";
import { chatPulsePrompt } from "./prompts";
import { generateStructured } from "./gemini";
import { getFastModel, TIMEOUTS } from "./config";
import type { LocaleCode } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/chat/generator";

export interface ChatPulseResult extends ChatPulse {
  source: "ai" | "fallback";
}

const HYPE_WORDS = ["fire", "huge", "what a", "crazy", "six", "boundary", "🔥"];
const TENSE_WORDS = ["pressure", "nervous", "tight", "edge"];

export async function getChatPulse(args: {
  messages: ChatMessage[];
  locale: LocaleCode;
}): Promise<ChatPulseResult> {
  const safeMessages = args.messages.filter((m) => !m.toxic);
  const model = getFastModel();
  const { systemInstruction } = chatPulsePrompt({ locale: args.locale });

  const windowText = safeMessages.map((m) => `${m.username}: ${m.text}`).join("\n");

  const result = await generateStructured({
    task: "chat-pulse",
    model,
    systemInstruction,
    userContent: `UNTRUSTED USER TEXT (recent chat window):\n${windowText}`,
    schema: ChatPulse,
    geminiSchema: chatPulseGeminiSchema,
    timeoutMs: TIMEOUTS.quickMs,
    maxOutputTokens: 300,
  });

  if (result.ok) return { ...result.data, source: "ai" };

  return keywordFallback(safeMessages);
}

function keywordFallback(messages: ChatMessage[]): ChatPulseResult {
  const text = messages.map((m) => m.text.toLowerCase()).join(" ");
  const hypeHits = HYPE_WORDS.filter((w) => text.includes(w)).length;
  const tenseHits = TENSE_WORDS.filter((w) => text.includes(w)).length;
  const mood: ChatPulse["mood"] = hypeHits > tenseHits ? "hype" : tenseHits > 0 ? "tense" : "mixed";
  const hypeScore = Math.min(100, hypeHits * 20);
  const standout = messages[messages.length - 1]?.text ?? "Chat is quiet right now.";

  const recentTexts = messages.slice(-3).map((m) => m.text);
  const genericFillers = [
    "Fans are watching closely.",
    "The chat is following every ball.",
    "Quiet in the stands for now.",
  ];
  while (recentTexts.length < 3) recentTexts.push(genericFillers[recentTexts.length]);

  return {
    source: "fallback",
    mood,
    hypeScore,
    standoutMessage: standout,
    topTakes: recentTexts as [string, string, string],
  };
}
