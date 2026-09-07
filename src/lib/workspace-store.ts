import { useCallback, useEffect, useState } from "react";
import {
  emptyProfile,
  type BusinessProfile,
  type MarketAnalysis,
  type OpportunityReport,
} from "./marketing-types";

const KEYS = {
  profile: "mb.profile",
  analysis: "mb.marketAnalysis",
  opportunities: "mb.opportunities",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const save = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.error("Could not save to local storage", e);
      }
    },
    [key],
  );

  return { value, save, ready };
}

export function useBusinessProfile() {
  const { value, save, ready } = useStored<BusinessProfile>(KEYS.profile, emptyProfile);
  return {
    profile: value,
    saveProfile: save,
    ready,
    isComplete: Boolean(value.businessName && value.industry && value.description),
  };
}

export function useMarketAnalysis() {
  const { value, save, ready } = useStored<MarketAnalysis | null>(KEYS.analysis, null);
  return { analysis: value, saveAnalysis: save, ready };
}

export function useOpportunities() {
  const { value, save, ready } = useStored<OpportunityReport | null>(
    KEYS.opportunities,
    null,
  );
  return { report: value, saveReport: save, ready };
}
