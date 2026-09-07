import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  emptyProfile,
  type BusinessProfile,
  type MarketAnalysis,
  type IdeasReport,
  type OpportunityReport,
} from "./marketing-types";
import { getLatestReports, getMyBusiness, saveMyBusiness } from "./workspace.functions";

/**
 * The database is the source of truth. These legacy localStorage keys are only
 * read once, to pre-fill the form for people who used the app before accounts
 * existed; nothing is written back to them.
 */
const LEGACY_PROFILE_KEY = "mb.profile";

function readLegacyProfile(): BusinessProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BusinessProfile>;
    return { ...emptyProfile, ...parsed };
  } catch {
    return null;
  }
}

const businessKey = ["business"] as const;
const reportsKey = (businessId: string | null) => ["reports", businessId] as const;

export function useBusinessQuery() {
  const fetchBusiness = useServerFn(getMyBusiness);
  return useQuery({
    queryKey: businessKey,
    queryFn: () => fetchBusiness(),
    staleTime: 30_000,
  });
}

export function useBusinessProfile() {
  const queryClient = useQueryClient();
  const { data, isPending } = useBusinessQuery();
  const persist = useServerFn(saveMyBusiness);

  const stored = data?.profile ?? null;
  const profile = stored ?? readLegacyProfile() ?? emptyProfile;

  const saveProfile = useCallback(
    async (next: BusinessProfile) => {
      const record = await persist({ data: { profile: next } });
      queryClient.setQueryData(businessKey, record);
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      return record;
    },
    [persist, queryClient],
  );

  return {
    businessId: data?.id ?? null,
    profile,
    saveProfile,
    ready: !isPending,
    isComplete: Boolean(stored?.businessName && stored.industry && stored.description),
  };
}

function useReports() {
  const { data: business } = useBusinessQuery();
  const businessId = business?.id ?? null;
  const fetchReports = useServerFn(getLatestReports);

  const query = useQuery({
    queryKey: reportsKey(businessId),
    enabled: Boolean(businessId),
    queryFn: () => fetchReports({ data: { businessId: businessId as string } }),
    staleTime: 30_000,
  });

  return { businessId, ...query };
}

export function useMarketAnalysis() {
  const queryClient = useQueryClient();
  const { businessId, data, isPending } = useReports();

  const saveAnalysis = useCallback(
    (next: MarketAnalysis) => {
      queryClient.setQueryData(reportsKey(businessId), (prev: unknown) => ({
        ...(prev as object),
        analysis: next,
      }));
    },
    [queryClient, businessId],
  );

  return { businessId, analysis: data?.analysis ?? null, saveAnalysis, ready: !isPending };
}

export function useOpportunities() {
  const queryClient = useQueryClient();
  const { businessId, data, isPending } = useReports();

  const saveReport = useCallback(
    (next: OpportunityReport) => {
      queryClient.setQueryData(reportsKey(businessId), (prev: unknown) => ({
        ...(prev as object),
        opportunities: next,
      }));
    },
    [queryClient, businessId],
  );

  return { businessId, report: data?.opportunities ?? null, saveReport, ready: !isPending };
}

export function useMarketingIdeas() {
  const queryClient = useQueryClient();
  const { businessId, data, isPending } = useReports();

  const saveIdeas = useCallback(
    (next: IdeasReport) => {
      queryClient.setQueryData(reportsKey(businessId), (prev: unknown) => ({
        ...(prev as object),
        ideas: next,
      }));
    },
    [queryClient, businessId],
  );

  return { businessId, ideas: data?.ideas ?? null, saveIdeas, ready: !isPending };
}
