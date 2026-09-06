import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SourceList } from "@/components/SourceList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateOpportunities } from "@/lib/ai.functions";
import { useBusinessProfile, useMarketAnalysis, useOpportunities } from "@/lib/workspace-store";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Marketing Opportunities — Market Boost" },
      {
        name: "description",
        content:
          "Spot timely marketing opportunities for your business: competitor gaps, underserved needs and new channels, with evidence and sources.",
      },
      { property: "og:title", content: "Marketing Opportunities — Market Boost" },
      {
        property: "og:description",
        content:
          "Prioritised marketing opportunities based on your profile, your market analysis and current web research.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

const PRIORITY_VARIANT = {
  High: "default",
  Medium: "secondary",
  Low: "outline",
} as const;

function OpportunitiesPage() {
  const { profile, isComplete } = useBusinessProfile();
  const { analysis } = useMarketAnalysis();
  const { report, saveReport } = useOpportunities();
  const run = useServerFn(generateOpportunities);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await run({
        data: {
          profile,
          marketAnalysis: analysis
            ? JSON.stringify({
                marketOverview: analysis.marketOverview,
                competitors: analysis.competitors,
                trends: analysis.trends,
                customerInsights: analysis.customerInsights,
                risks: analysis.risks,
              })
            : "",
        },
      });
      saveReport(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong while finding opportunities.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isComplete) {
    return (
      <AppShell title="Opportunities" subtitle="First, tell us about your business.">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Complete your business profile and we can look for openings in your market.
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Go to Business Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Opportunities"
      subtitle={`Timely, specific moves for ${profile.businessName}, each with the market signal behind it.`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Looking for openings…
            </>
          ) : report ? (
            <>
              <RefreshCw className="size-4" /> Find new opportunities
            </>
          ) : (
            <>
              <Target className="size-4" /> Find opportunities
            </>
          )}
        </Button>
        {report ? (
          <span className="text-xs text-muted-foreground">
            Last generated {new Date(report.generatedAt).toLocaleString()}
          </span>
        ) : null}
      </div>

      {!analysis ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Tip: generate your{" "}
          <Link to="/market-analysis" className="text-primary underline underline-offset-4">
            market analysis
          </Link>{" "}
          first — we will build on it.
        </p>
      ) : null}

      {loading ? (
        <p className="mb-6 text-sm text-muted-foreground">
          This usually takes up to a minute while we read current sources.
        </p>
      ) : null}

      {error ? (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="flex gap-3 py-5 text-sm">
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </CardContent>
        </Card>
      ) : null}

      {report ? (
        <div className="space-y-4">
          {!report.liveDataUsed ? (
            <Card className="border-destructive/40 bg-accent">
              <CardContent className="flex gap-3 py-5 text-sm">
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <span>
                  Live market data was unavailable for this run. These opportunities come
                  from your business profile only.
                </span>
              </CardContent>
            </Card>
          ) : null}

          {report.opportunities.map((o, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={PRIORITY_VARIANT[o.priority]}>{o.priority} priority</Badge>
                  {o.category ? <Badge variant="outline">{o.category}</Badge> : null}
                </div>
                <CardTitle className="font-display text-lg">{o.title}</CardTitle>
                <CardDescription>{o.whyItMatters}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Market signal
                  </p>
                  <p className="mt-1">{o.evidence}</p>
                </div>
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Recommended action
                  </p>
                  <p className="mt-1">{o.recommendedAction}</p>
                </div>
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Expected impact
                  </p>
                  <p className="mt-1">{o.expectedImpact}</p>
                </div>
                {o.sources.length ? (
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Sources
                    </p>
                    <div className="mt-2">
                      <SourceList sources={o.sources} compact />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}

          {report.webFindings.length ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">From web research</Badge>
                </div>
                <CardTitle className="font-display text-lg">What we found online</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {report.webFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {report.aiInterpretation.length ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge>
                    <Sparkles className="size-3" /> AI interpretation
                  </Badge>
                </div>
                <CardTitle className="font-display text-lg">Our reasoning</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {report.aiInterpretation.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : !loading ? (
        <p className="text-sm text-muted-foreground">
          No opportunities yet. Run a search to see where you can win.
        </p>
      ) : null}
    </AppShell>
  );
}
