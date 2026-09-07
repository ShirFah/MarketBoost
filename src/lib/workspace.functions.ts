import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  businessProfileSchema,
  type BusinessProfile,
  type IdeasReport,
  type MarketAnalysis,
  type OpportunityReport,
} from "./marketing-types";

export type BusinessRecord = { id: string; profile: BusinessProfile };

type BusinessRow = {
  id: string;
  name: string;
  website: string;
  industry: string;
  description: string;
  products_services: string;
  target_audience: string;
  location: string;
  marketing_goals: string;
  current_channels: string;
  known_competitors: string;
};

const COLUMNS =
  "id, name, website, industry, description, products_services, target_audience, location, marketing_goals, current_channels, known_competitors";

export function rowToProfile(row: BusinessRow): BusinessProfile {
  return {
    businessName: row.name ?? "",
    website: row.website ?? "",
    industry: row.industry ?? "",
    description: row.description ?? "",
    productsServices: row.products_services ?? "",
    targetAudience: row.target_audience ?? "",
    location: row.location ?? "",
    marketingGoals: row.marketing_goals ?? "",
    currentChannels: row.current_channels ?? "",
    competitors: row.known_competitors ?? "",
  };
}

function profileToRow(profile: BusinessProfile) {
  return {
    name: profile.businessName,
    website: profile.website ?? "",
    industry: profile.industry,
    description: profile.description,
    products_services: profile.productsServices,
    target_audience: profile.targetAudience,
    location: profile.location,
    marketing_goals: profile.marketingGoals,
    current_channels: profile.currentChannels ?? "",
    known_competitors: profile.competitors ?? "",
  };
}

/** The signed-in user's active (most recently created) business, if any. */
export const getMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BusinessRecord | null> => {
    const { data, error } = await context.supabase
      .from("businesses")
      .select(COLUMNS)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { id: data.id, profile: rowToProfile(data as BusinessRow) };
  });

export const saveMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    businessProfileSchema.parse((input as { profile: unknown }).profile),
  )
  .handler(async ({ data, context }): Promise<BusinessRecord> => {
    const existing = await context.supabase
      .from("businesses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);

    if (existing.data?.id) {
      const { error } = await context.supabase
        .from("businesses")
        .update(profileToRow(data))
        .eq("id", existing.data.id);
      if (error) throw new Error(error.message);
      return { id: existing.data.id, profile: data };
    }

    const { data: inserted, error } = await context.supabase
      .from("businesses")
      .insert({ ...profileToRow(data), user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id, profile: data };
  });

type ReportTable = "market_analyses" | "opportunities_reports" | "marketing_ideas_reports";

async function latest(
  supabase: { from: (t: string) => any },
  table: ReportTable,
  businessId: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("id, content, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

/** Most recent report of each kind for one of the user's own businesses. */
export const getLatestReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const id = (input as { businessId?: unknown }).businessId;
    if (typeof id !== "string" || !id) throw new Error("A business is required.");
    return { businessId: id };
  })
  .handler(async ({ data, context }) => {
    // RLS scopes every table below to businesses owned by this user.
    const owned = await context.supabase
      .from("businesses")
      .select("id")
      .eq("id", data.businessId)
      .maybeSingle();
    if (owned.error) throw new Error(owned.error.message);
    if (!owned.data) throw new Error("Business not found.");

    const [analysis, opportunities, ideas] = await Promise.all([
      latest(context.supabase, "market_analyses", data.businessId),
      latest(context.supabase, "opportunities_reports", data.businessId),
      latest(context.supabase, "marketing_ideas_reports", data.businessId),
    ]);

    return {
      analysis: (analysis?.content ?? null) as MarketAnalysis | null,
      analysisId: (analysis?.id ?? null) as string | null,
      opportunities: (opportunities?.content ?? null) as OpportunityReport | null,
      ideas: (ideas?.content ?? null) as IdeasReport | null,
    };
  });
