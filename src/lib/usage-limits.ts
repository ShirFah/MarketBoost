/**
 * Server-side usage quota for the AI generators.
 *
 * The counting and the limit decision both live in the database
 * (`claim_ai_generation`), so two simultaneous requests cannot both pass the
 * check: the function takes a per-user advisory lock inside its transaction.
 *
 * Limits are shared across every AI tool: 5 generations per hour and 20 per
 * day per authenticated user. The quota is always counted against the
 * identity from the verified bearer token — never a user id from the browser.
 */

export const HOURLY_LIMIT = 5;
export const DAILY_LIMIT = 20;

export type AiFeature = "market_analysis" | "opportunities" | "marketing_ideas";

/** Hebrew, user-facing, no technical detail. */
const LIMIT_MESSAGE = {
  hourly:
    "הגעת למגבלת השימוש הזמנית. אפשר להפיק עד 5 ניתוחים בשעה — נסו שוב מאוחר יותר.",
  daily:
    "המכסה היומית שלך נוצלה במלואה (20 הפקות ביום). אפשר להמשיך מחר, והדוחות שכבר הופקו נשמרים.",
  unauthenticated: "צריך להתחבר מחדש כדי להפיק דוח.",
} as const;

export class UsageLimitError extends Error {
  constructor(public reason: keyof typeof LIMIT_MESSAGE) {
    super(LIMIT_MESSAGE[reason]);
    this.name = "UsageLimitError";
  }
}

// Structurally loose on purpose: the generated Supabase client types the rpc
// name as a literal union, and this helper is shared by every generator.
type Rpc = { rpc: any };

type Claim = {
  allowed: boolean;
  reason: keyof typeof LIMIT_MESSAGE | "ok";
  event_id: string | null;
  hourly_used: number;
  daily_used: number;
};

/**
 * Reserves one generation for the signed-in user. Throws before the AI
 * provider is ever contacted when the quota is exhausted.
 */
export async function claimGeneration(
  supabase: Rpc,
  feature: AiFeature,
  businessId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("claim_ai_generation", {
    _feature: feature,
    _business_id: businessId,
  });
  if (error) throw new Error(error.message);

  const claim = (Array.isArray(data) ? data[0] : data) as Claim | undefined;
  if (!claim) throw new Error("Usage check failed.");
  if (!claim.allowed) {
    throw new UsageLimitError(claim.reason === "ok" ? "hourly" : claim.reason);
  }
  return claim.event_id as string;
}

/** Records the outcome of a generation that actually reached the provider. */
export async function finishGeneration(
  supabase: Rpc,
  eventId: string,
  success: boolean,
  meta: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.rpc("finish_ai_generation", {
    _event_id: eventId,
    _success: success,
    _meta: meta,
  });
  if (error) console.error("Failed to record AI usage outcome:", error.message);
}
