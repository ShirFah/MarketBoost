const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export type ResearchOutcome = {
  /** Raw model text (expected to contain a JSON object). */
  text: string;
  /** True when the model ran with live web research enabled. */
  liveDataUsed: boolean;
};

type GatewayMessage = { role: "system" | "user"; content: string };

async function callGateway(
  apiKey: string,
  messages: GatewayMessage[],
  withWebSearch: boolean,
): Promise<string> {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(withWebSearch ? { tools: [{ type: "google_search" }] } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI request failed [${response.status}]: ${body.slice(0, 500)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("The AI returned an empty response.");
  return text;
}

/**
 * Runs a research prompt with live web search, falling back to a
 * profile-only generation when web research is unavailable.
 */
export async function runResearch(
  system: string,
  prompt: string,
): Promise<ResearchOutcome> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const messages: GatewayMessage[] = [
    { role: "system", content: system },
    { role: "user", content: prompt },
  ];

  try {
    return { text: await callGateway(apiKey, messages, true), liveDataUsed: true };
  } catch (searchError) {
    console.error("Live web research failed, falling back:", searchError);
    const fallbackMessages: GatewayMessage[] = [
      {
        role: "system",
        content: `${system}\n\nLive web research is UNAVAILABLE for this run. Base everything on the business profile and general knowledge, return an empty "sources" array, and keep claims clearly marked as interpretation.`,
      },
      { role: "user", content: prompt },
    ];
    return {
      text: await callGateway(apiKey, fallbackMessages, false),
      liveDataUsed: false,
    };
  }
}

/** Extracts the first JSON object from a model response. */
export function parseJsonObject<T>(text: string): T {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The AI response could not be read. Please try again.");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
