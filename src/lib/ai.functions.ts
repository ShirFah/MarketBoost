import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type BusinessProfile,
  type IdeasReport,
  type MarketAnalysis,
  type OpportunityReport,
} from "./marketing-types";
import type { Json } from "@/integrations/supabase/types";
import { rowToProfile } from "./workspace.functions";
import { claimGeneration, finishGeneration, type AiFeature } from "./usage-limits";

const businessInput = (input: unknown) => {
  const id = (input as { businessId?: unknown }).businessId;
  if (typeof id !== "string" || !id) throw new Error("A business is required.");
  return { businessId: id };
};

const BUSINESS_COLUMNS =
  "id, name, website, industry, description, products_services, target_audience, location, marketing_goals, current_channels, known_competitors";

/**
 * Loads a business the caller actually owns. RLS already scopes the query to
 * the signed-in user, so a business_id coming from the browser can never reach
 * another user's data.
 */
async function loadOwnedBusiness(
  supabase: { from: (t: string) => any },
  businessId: string,
): Promise<BusinessProfile> {
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .eq("id", businessId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Business not found.");
  return rowToProfile(data);
}

/** Latest stored market analysis for this business, used as extra prompt context. */
async function loadLatestAnalysis(
  supabase: { from: (t: string) => any },
  businessId: string,
): Promise<{ id: string; content: MarketAnalysis } | null> {
  const { data, error } = await supabase
    .from("market_analyses")
    .select("id, content")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { id: data.id, content: data.content as MarketAnalysis } : null;
}

function profileBlock(p: BusinessProfile) {
  return [
    `Business name: ${p.businessName}`,
    `Website: ${p.website || "not provided"}`,
    `Industry: ${p.industry}`,
    `Description: ${p.description}`,
    `Products / services: ${p.productsServices}`,
    `Target audience: ${p.targetAudience}`,
    `Location / target market: ${p.location}`,
    `Marketing goals: ${p.marketingGoals}`,
    `Current marketing channels: ${p.currentChannels || "not provided"}`,
    `Known competitors: ${p.competitors || "not provided"}`,
  ].join("\n");
}

const SHARED_RULES = `You are a senior marketing strategist for small businesses.
Use web research to gather CURRENT, credible information before answering. Prefer recent sources.
Rules:
- Write EVERY value of the JSON output in Hebrew (natural, fluent business Hebrew), except URLs, brand names that are normally written in Latin letters, and dates.
- The "priority" field must stay exactly one of: High, Medium, Low. The "category" field must be written in Hebrew.
- You may research in any language, and prefer Hebrew and Israeli sources when the business is Israeli.
- Be specific to this exact business, its location and its audience. No generic marketing advice.
- Separate facts found through web research from your own interpretation.
- Every source you list must be a real page you actually found, with its publisher name, page title, full URL and publication date when known. Source names and titles may stay in their original language.
- Reply with ONE valid JSON object only. No markdown fences, no commentary.`;

export const generateMarketAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(businessInput)
  .handler(async ({ data, context }): Promise<MarketAnalysis> => {
    const { runResearch, parseJsonObject } = await import("./ai-gateway.server");
    const profile = await loadOwnedBusiness(context.supabase, data.businessId);

    const prompt = `Research the current market for this business and produce a market analysis.

BUSINESS PROFILE
${profileBlock(profile)}

Research relevant competitors, current market trends, customer behaviour, industry developments, competitor positioning, publicly available pricing or offers, and important recent market changes.

Return JSON with exactly this shape:
{
  "marketOverview": "2-4 paragraph overview",
  "competitors": [{"name": "", "positioning": "", "notes": ""}],
  "trends": ["..."],
  "customerInsights": ["..."],
  "marketDevelopments": ["..."],
  "risks": ["..."],
  "strategicTakeaways": ["..."],
  "webFindings": ["factual statements found through web research, each ending with the source name"],
  "aiInterpretation": ["your own analysis and recommendations, clearly your interpretation"],
  "sources": [{"name": "", "title": "", "url": "", "date": ""}]
}`;

    // Quota is claimed only after the request proves valid and owned, and
    // before the provider is contacted.
    const usageId = await claimGeneration(context.supabase, "market_analysis", data.businessId);
    let text: string;
    let liveDataUsed: boolean;
    try {
      const outcome = await runResearch(SHARED_RULES, prompt);
      text = outcome.text;
      liveDataUsed = outcome.liveDataUsed;
    } catch (aiError) {
      await finishGeneration(context.supabase, usageId, false, { stage: "provider" });
      throw aiError;
    }
    const parsed = parseJsonObject<Omit<MarketAnalysis, "liveDataUsed" | "generatedAt">>(text);

    const report: MarketAnalysis = {
      marketOverview: parsed.marketOverview ?? "",
      competitors: parsed.competitors ?? [],
      trends: parsed.trends ?? [],
      customerInsights: parsed.customerInsights ?? [],
      marketDevelopments: parsed.marketDevelopments ?? [],
      risks: parsed.risks ?? [],
      strategicTakeaways: parsed.strategicTakeaways ?? [],
      webFindings: parsed.webFindings ?? [],
      aiInterpretation: parsed.aiInterpretation ?? [],
      sources: (parsed.sources ?? []).filter((s) => s?.url),
      liveDataUsed,
      generatedAt: new Date().toISOString(),
    };

    // Every generation is stored as a new row, so report history stays possible.
    const { error } = await context.supabase.from("market_analyses").insert({
      business_id: data.businessId,
      content: report as unknown as Json,
      sources: report.sources as unknown as Json,
      research_used: liveDataUsed,
    });
    if (error) throw new Error(error.message);

    await finishGeneration(context.supabase, usageId, true, { liveDataUsed });

    return report;
  });

export const generateOpportunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(businessInput)
  .handler(async ({ data, context }): Promise<OpportunityReport> => {
    const { runResearch, parseJsonObject } = await import("./ai-gateway.server");
    const profile = await loadOwnedBusiness(context.supabase, data.businessId);
    const analysis = await loadLatestAnalysis(context.supabase, data.businessId);
    const analysisContext = analysis
      ? JSON.stringify({
          marketOverview: analysis.content.marketOverview,
          competitors: analysis.content.competitors,
          trends: analysis.content.trends,
          customerInsights: analysis.content.customerInsights,
          risks: analysis.content.risks,
        }).slice(0, 6000)
      : "";

    const prompt = `Find current, concrete marketing opportunities for this business.

BUSINESS PROFILE
${profileBlock(profile)}

${analysisContext ? `EXISTING MARKET ANALYSIS (from this app)\n${analysisContext}` : "No market analysis has been generated yet."}

Research emerging trends, competitor weaknesses or gaps, underserved customer needs, content opportunities, new marketing channels or formats, market gaps, and timely or seasonal opportunities.

Return between 5 and 8 opportunities as JSON with exactly this shape:
{
  "opportunities": [{
    "title": "",
    "category": "one Hebrew label out of: מגמה מתפתחת | פער אצל המתחרים | צורך שלא נענה | תוכן | ערוץ חדש | עונתי | הצעה או מיצוב",
    "whyItMatters": "",
    "evidence": "the market signal found through research",
    "recommendedAction": "concrete next step this owner can take",
    "expectedImpact": "",
    "priority": "High | Medium | Low",
    "sources": [{"name": "", "title": "", "url": "", "date": ""}]
  }],
  "webFindings": ["factual statements found through web research"],
  "aiInterpretation": ["your own reasoning and recommendations"]
}`;

    const usageId = await claimGeneration(context.supabase, "opportunities", data.businessId);
    let text: string;
    let liveDataUsed: boolean;
    try {
      const outcome = await runResearch(SHARED_RULES, prompt);
      text = outcome.text;
      liveDataUsed = outcome.liveDataUsed;
    } catch (aiError) {
      await finishGeneration(context.supabase, usageId, false, { stage: "provider" });
      throw aiError;
    }
    const parsed = parseJsonObject<Omit<OpportunityReport, "liveDataUsed" | "generatedAt">>(text);

    const report: OpportunityReport = {
      opportunities: (parsed.opportunities ?? []).map((o) => ({
        ...o,
        priority: (["High", "Medium", "Low"] as const).includes(o.priority) ? o.priority : "Medium",
        sources: (o.sources ?? []).filter((s) => s?.url),
      })),
      webFindings: parsed.webFindings ?? [],
      aiInterpretation: parsed.aiInterpretation ?? [],
      liveDataUsed,
      generatedAt: new Date().toISOString(),
    };

    const { error } = await context.supabase.from("opportunities_reports").insert({
      business_id: data.businessId,
      market_analysis_id: analysis?.id ?? null,
      content: report as unknown as Json,
      sources: report.opportunities.flatMap((o) => o.sources) as unknown as Json,
      research_used: liveDataUsed,
    });
    if (error) throw new Error(error.message);

    await finishGeneration(context.supabase, usageId, true, { liveDataUsed });

    return report;
  });

export const generateMarketingIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(businessInput)
  .handler(async ({ data, context }): Promise<IdeasReport> => {
    const { runResearch, parseJsonObject } = await import("./ai-gateway.server");
    const profile = await loadOwnedBusiness(context.supabase, data.businessId);
    const analysis = await loadLatestAnalysis(context.supabase, data.businessId);
    const analysisContext = analysis
      ? JSON.stringify({
          marketOverview: analysis.content.marketOverview,
          trends: analysis.content.trends,
          customerInsights: analysis.content.customerInsights,
        }).slice(0, 5000)
      : "";

    const prompt = `Create ready-to-use marketing ideas for this business: social content, promotions and trends that are running online RIGHT NOW.

BUSINESS PROFILE
${profileBlock(profile)}

${analysisContext ? `EXISTING MARKET ANALYSIS (from this app)\n${analysisContext}` : "No market analysis has been generated yet."}

Research what is currently trending online (social platforms, viral formats, seasonal moments, local Israeli trends), and what similar businesses are posting and offering right now.

Return 6-9 ideas as JSON with exactly this shape:
{
  "ideas": [{
    "title": "",
    "channel": "one Hebrew label out of: אינסטגרם | פייסבוק | טיקטוק | וואטסאפ | ניוזלטר | גוגל",
    "format": "e.g. ריל, קרוסלה, סטורי, פוסט טקסט, מבצע",
    "content": "the actual ready-to-publish caption or post text in Hebrew, including line breaks and emojis where natural",
    "hashtags": ["#..."],
    "callToAction": "",
    "whyNow": "the current signal or trend that makes this timely",
    "priority": "High | Medium | Low",
    "sources": [{"name": "", "title": "", "url": "", "date": ""}]
  }],
  "trendingNow": [{"trend": "what is trending online now", "howToUse": "how this business can use it"}],
  "promotions": [{"title": "", "details": "concrete offer, wording and timing", "whyItWorks": ""}],
  "webFindings": ["factual statements found through web research"],
  "aiInterpretation": ["your own reasoning and recommendations"]
}`;

    const usageId = await claimGeneration(context.supabase, "marketing_ideas", data.businessId);
    let text: string;
    let liveDataUsed: boolean;
    try {
      const outcome = await runResearch(SHARED_RULES, prompt);
      text = outcome.text;
      liveDataUsed = outcome.liveDataUsed;
    } catch (aiError) {
      await finishGeneration(context.supabase, usageId, false, { stage: "provider" });
      throw aiError;
    }
    const parsed = parseJsonObject<Omit<IdeasReport, "liveDataUsed" | "generatedAt">>(text);

    const report: IdeasReport = {
      ideas: (parsed.ideas ?? []).map((idea) => ({
        ...idea,
        hashtags: idea.hashtags ?? [],
        priority: (["High", "Medium", "Low"] as const).includes(idea.priority)
          ? idea.priority
          : "Medium",
        sources: (idea.sources ?? []).filter((s) => s?.url),
      })),
      trendingNow: parsed.trendingNow ?? [],
      promotions: parsed.promotions ?? [],
      webFindings: parsed.webFindings ?? [],
      aiInterpretation: parsed.aiInterpretation ?? [],
      liveDataUsed,
      generatedAt: new Date().toISOString(),
    };

    const { error } = await context.supabase.from("marketing_ideas_reports").insert({
      business_id: data.businessId,
      market_analysis_id: analysis?.id ?? null,
      content: report as unknown as Json,
      sources: report.ideas.flatMap((i) => i.sources) as unknown as Json,
      research_used: liveDataUsed,
    });
    if (error) throw new Error(error.message);

    await finishGeneration(context.supabase, usageId, true, { liveDataUsed });

    return report;
  });
