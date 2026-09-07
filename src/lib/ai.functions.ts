import { createServerFn } from "@tanstack/react-start";
import {
  businessProfileSchema,
  type MarketAnalysis,
  type OpportunityReport,
} from "./marketing-types";
import { z } from "zod";

const marketInput = z.object({ profile: businessProfileSchema });
const opportunityInput = z.object({
  profile: businessProfileSchema,
  marketAnalysis: z.string().optional().default(""),
});

function profileBlock(p: z.infer<typeof businessProfileSchema>) {
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
  .inputValidator((input: unknown) => marketInput.parse(input))
  .handler(async ({ data }): Promise<MarketAnalysis> => {
    const { runResearch, parseJsonObject } = await import("./ai-gateway.server");

    const prompt = `Research the current market for this business and produce a market analysis.

BUSINESS PROFILE
${profileBlock(data.profile)}

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

    const { text, liveDataUsed } = await runResearch(SHARED_RULES, prompt);
    const parsed = parseJsonObject<Omit<MarketAnalysis, "liveDataUsed" | "generatedAt">>(text);

    return {
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
  });

export const generateOpportunities = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => opportunityInput.parse(input))
  .handler(async ({ data }): Promise<OpportunityReport> => {
    const { runResearch, parseJsonObject } = await import("./ai-gateway.server");

    const prompt = `Find current, concrete marketing opportunities for this business.

BUSINESS PROFILE
${profileBlock(data.profile)}

${data.marketAnalysis ? `EXISTING MARKET ANALYSIS (from this app)\n${data.marketAnalysis.slice(0, 6000)}` : "No market analysis has been generated yet."}

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

    const { text, liveDataUsed } = await runResearch(SHARED_RULES, prompt);
    const parsed = parseJsonObject<Omit<OpportunityReport, "liveDataUsed" | "generatedAt">>(text);

    return {
      opportunities: (parsed.opportunities ?? []).map((o) => ({
        ...o,
        priority: (["High", "Medium", "Low"] as const).includes(o.priority)
          ? o.priority
          : "Medium",
        sources: (o.sources ?? []).filter((s) => s?.url),
      })),
      webFindings: parsed.webFindings ?? [],
      aiInterpretation: parsed.aiInterpretation ?? [],
      liveDataUsed,
      generatedAt: new Date().toISOString(),
    };
  });

const ideasInput = z.object({
  profile: businessProfileSchema,
  marketAnalysis: z.string().optional().default(""),
});

export const generateMarketingIdeas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ideasInput.parse(input))
  .handler(async ({ data }): Promise<IdeasReport> => {
    const { runResearch, parseJsonObject } = await import("./ai-gateway.server");

    const prompt = `Create ready-to-use marketing ideas for this business: social content, promotions and trends that are running online RIGHT NOW.

BUSINESS PROFILE
${profileBlock(data.profile)}

${data.marketAnalysis ? `EXISTING MARKET ANALYSIS (from this app)\n${data.marketAnalysis.slice(0, 5000)}` : "No market analysis has been generated yet."}

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

    const { text, liveDataUsed } = await runResearch(SHARED_RULES, prompt);
    const parsed = parseJsonObject<Omit<IdeasReport, "liveDataUsed" | "generatedAt">>(text);

    return {
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
  });
