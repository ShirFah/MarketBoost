import type {
  BusinessProfile,
  IdeasReport,
  MarketAnalysis,
  OpportunityReport,
  Source,
} from "./marketing-types";

export type Priority = "High" | "Medium" | "Low";

export type NextAction = {
  id: string;
  title: string;
  explanation: string;
  whyNow: string;
  priority: Priority;
  source?: Source | undefined;
  /** "content" actions can be executed inside the Marketing Ideas experience. */
  kind: "content" | "info";
  /** Short context handed to the ideas page when the user acts on it. */
  context: string;
  suggestedNextStep: string;
};

const PRIORITY_WEIGHT: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

export const PRIORITY_LABEL: Record<Priority, string> = {
  High: "עדיפות גבוהה",
  Medium: "עדיפות בינונית",
  Low: "עדיפות נמוכה",
};

export const PRIORITY_VARIANT = {
  High: "default",
  Medium: "secondary",
  Low: "outline",
} as const;

const CONTENT_HINTS = ["תוכן", "ערוץ", "מגמה", "טרנד", "רשת", "סושיאל"];

function firstSource(sources: Source[] | undefined): Source | undefined {
  return sources?.find((s) => s.url);
}

/**
 * Recommended actions are derived from reports the user already generated —
 * nothing here calls the AI, and nothing is invented.
 */
export function buildNextActions(
  opportunities: OpportunityReport | null,
  ideas: IdeasReport | null,
): NextAction[] {
  const fromOpportunities: NextAction[] = (opportunities?.opportunities ?? []).map((o, i) => ({
    id: `opp-${i}`,
    title: o.title,
    explanation: o.whyItMatters,
    whyNow: o.evidence,
    priority: o.priority,
    source: firstSource(o.sources),
    kind: CONTENT_HINTS.some((h) => (o.category ?? "").includes(h)) ? "content" : "info",
    context: `${o.title} — ${o.recommendedAction}`,
    suggestedNextStep: o.recommendedAction,
  }));

  const fromIdeas: NextAction[] = (ideas?.ideas ?? []).slice(0, 2).map((idea, i) => ({
    id: `idea-${i}`,
    title: idea.title,
    explanation: idea.callToAction,
    whyNow: idea.whyNow,
    priority: idea.priority,
    source: firstSource(idea.sources),
    kind: "content",
    context: `${idea.title} — ${idea.channel} ${idea.format}`.trim(),
    suggestedNextStep: `פרסמו ב${idea.channel || "ערוץ המרכזי שלכם"}: ${idea.callToAction}`,
  }));

  const merged = [...fromOpportunities, ...fromIdeas];
  return merged
    .map((action, index) => ({ action, index }))
    .sort(
      (a, b) =>
        PRIORITY_WEIGHT[a.action.priority] - PRIORITY_WEIGHT[b.action.priority] ||
        a.index - b.index,
    )
    .slice(0, 3)
    .map(({ action }) => action);
}

export type StatusSummary = {
  sentences: string[];
  /** True when there is at least one report to summarise. */
  hasData: boolean;
  missing: { label: string; to: string }[];
};

export function buildStatusSummary(
  profile: BusinessProfile,
  analysis: MarketAnalysis | null,
  opportunities: OpportunityReport | null,
  ideas: IdeasReport | null,
): StatusSummary {
  const sentences: string[] = [];
  const missing: { label: string; to: string }[] = [];

  if (analysis) {
    const trend = analysis.trends?.[0];
    sentences.push(
      trend
        ? `מניתוח השוק האחרון: ${trend}`
        : `ניתוח השוק של ${profile.businessName} מעודכן ומחכה לכם.`,
    );
  } else {
    missing.push({ label: "הפקת מחקר שוק", to: "/market-analysis" });
  }

  if (opportunities?.opportunities?.length) {
    const high = opportunities.opportunities.filter((o) => o.priority === "High").length;
    sentences.push(
      high
        ? `זיהינו ${opportunities.opportunities.length} הזדמנויות פתוחות, ${high} מהן בעדיפות גבוהה.`
        : `זיהינו ${opportunities.opportunities.length} הזדמנויות פתוחות שכדאי לבחון.`,
    );
  } else {
    missing.push({ label: "חיפוש הזדמנויות", to: "/opportunities" });
  }

  if (ideas?.ideas?.length) {
    sentences.push(`מחכים לכם ${ideas.ideas.length} רעיונות תוכן מוכנים לפרסום.`);
  } else {
    missing.push({ label: "יצירת רעיונות תוכן", to: "/marketing-ideas" });
  }

  return { sentences: sentences.slice(0, 3), hasData: sentences.length > 0, missing };
}

export type WeekItem = { title: string; detail: string; priority: Priority };

/** Only real, already-derived actions — no invented schedule. */
export function buildWeek(actions: NextAction[], ideas: IdeasReport | null): WeekItem[] {
  const items: WeekItem[] = actions.slice(0, 2).map((a) => ({
    title: a.title,
    detail: a.suggestedNextStep,
    priority: a.priority,
  }));

  const trend = ideas?.trendingNow?.[0];
  if (trend) {
    items.push({ title: trend.trend, detail: trend.howToUse, priority: "Medium" });
  }
  return items.slice(0, 3);
}
