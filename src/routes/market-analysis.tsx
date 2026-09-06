import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SourceList } from "@/components/SourceList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMarketAnalysis } from "@/lib/ai.functions";
import { useBusinessProfile, useMarketAnalysis } from "@/lib/workspace-store";

export const Route = createFileRoute("/market-analysis")({
  head: () => ({
    meta: [
      { title: "Market Analysis — Market Boost" },
      {
        name: "description",
        content:
          "Generate a current market analysis for your business: competitors, trends, customer insights and risks, with cited sources.",
      },
      { property: "og:title", content: "Market Analysis — Market Boost" },
      {
        property: "og:description",
        content:
          "Live web research plus AI interpretation, turned into a market analysis for your small business.",
      },
    ],
  }),
  component: MarketAnalysisPage,
});

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm leading-relaxed">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function MarketAnalysisPage() {
  const { profile, isComplete } = useBusinessProfile();
  const { analysis, saveAnalysis } = useMarketAnalysis();
  const run = useServerFn(generateMarketAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await run({ data: { profile } });
      saveAnalysis(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong while generating your analysis.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isComplete) {
    return (
      <AppShell title="Market Analysis" subtitle="First, tell us about your business.">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Complete your business profile and we can research your market.
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
      title="Market Analysis"
      subtitle={`A current picture of the market around ${profile.businessName}, researched on the web and interpreted for you.`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Researching your market…
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="size-4" /> Regenerate analysis
            </>
          ) : (
            <>
              <Search className="size-4" /> Generate market analysis
            </>
          )}
        </Button>
        {analysis ? (
          <span className="text-xs text-muted-foreground">
            Last generated {new Date(analysis.generatedAt).toLocaleString()}
          </span>
        ) : null}
      </div>

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

      {analysis ? (
        <div className="space-y-4">
          {!analysis.liveDataUsed ? (
            <Card className="border-destructive/40 bg-accent">
              <CardContent className="flex gap-3 py-5 text-sm">
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <span>
                  Live market data was unavailable for this run. The analysis below is based
                  on your business profile only.
                </span>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Market overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed whitespace-pre-line">
              {analysis.marketOverview}
            </CardContent>
          </Card>

          {analysis.competitors.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">
                  Competitors and positioning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.competitors.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <p className="font-medium">{c.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.positioning}</p>
                    {c.notes ? <p className="mt-2 text-sm">{c.notes}</p> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Section title="Current trends" items={analysis.trends} />
          <Section title="Target customer insights" items={analysis.customerInsights} />
          <Section title="Important market developments" items={analysis.marketDevelopments} />
          <Section title="Risks and challenges" items={analysis.risks} />
          <Section title="Key strategic takeaways" items={analysis.strategicTakeaways} />

          {analysis.webFindings.length ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">From web research</Badge>
                </div>
                <CardTitle className="font-display text-lg">What we found online</CardTitle>
                <CardDescription>Facts gathered from the sources below.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {analysis.webFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {analysis.aiInterpretation.length ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge>
                    <Sparkles className="size-3" /> AI interpretation
                  </Badge>
                </div>
                <CardTitle className="font-display text-lg">
                  What this means for you
                </CardTitle>
                <CardDescription>
                  Recommendations, not facts — judge them against what you know.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {analysis.aiInterpretation.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {analysis.sources.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <SourceList sources={analysis.sources} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : !loading ? (
        <p className="text-sm text-muted-foreground">
          No analysis yet. Generate one to see your market.
        </p>
      ) : null}
    </AppShell>
  );
}
