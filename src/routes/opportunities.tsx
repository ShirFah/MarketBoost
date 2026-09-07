import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Globe, Loader2, RefreshCw, Sparkles, Target } from "lucide-react";
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
      { title: "הזדמנויות שיווק — Market Boost" },
      {
        name: "description",
        content:
          "זהו הזדמנויות שיווק עדכניות לעסק שלכם: פערים אצל המתחרים, צרכים שלא נענים וערוצים חדשים — עם ראיות ומקורות.",
      },
      { property: "og:title", content: "הזדמנויות שיווק — Market Boost" },
      {
        property: "og:description",
        content: "הזדמנויות שיווק לפי סדר עדיפויות, על בסיס הפרופיל, ניתוח השוק ומחקר עדכני ברשת.",
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

const PRIORITY_LABEL = {
  High: "עדיפות גבוהה",
  Medium: "עדיפות בינונית",
  Low: "עדיפות נמוכה",
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
      setError(e instanceof Error ? e.message : "משהו השתבש בחיפוש ההזדמנויות. נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  if (!isComplete) {
    return (
      <AppShell title="הזדמנויות" subtitle="קודם כל, ספרו לנו על העסק שלכם.">
        <Card className="glass-card border-none">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              השלימו את פרופיל העסק ונחפש עבורכם פתחים בשוק.
            </p>
            <Button asChild className="mt-5 rounded-xl">
              <Link to="/">מעבר לפרופיל העסק</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="שלב 3 · מה עושים עכשיו"
      title="הזדמנויות"
      subtitle={`מהלכים ממוקדים ועדכניים עבור ${profile.businessName}, כל אחד עם האות מהשוק שמאחוריו.`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={loading} size="lg" className="rounded-xl">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> מחפשים פתחים בשוק…
            </>
          ) : report ? (
            <>
              <RefreshCw className="size-4" /> חיפוש הזדמנויות חדשות
            </>
          ) : (
            <>
              <Target className="size-4" /> חיפוש הזדמנויות
            </>
          )}
        </Button>
        {report ? (
          <span className="text-muted-foreground text-xs">
            הופק לאחרונה: {new Date(report.generatedAt).toLocaleString("he-IL")}
          </span>
        ) : null}
      </div>

      {!analysis ? (
        <p className="text-muted-foreground mb-6 text-sm">
          טיפ: הפיקו קודם את{" "}
          <Link to="/market-analysis" className="text-primary underline underline-offset-4">
            ניתוח השוק
          </Link>{" "}
          — נבנה עליו.
        </p>
      ) : null}

      {loading ? (
        <div className="mb-6">
          <ReportSkeleton cards={3} />
        </div>
      ) : null}


      {error ? (
        <Card className="border-destructive/40 glass-card mb-6">
          <CardContent className="flex gap-3 py-5 text-sm">
            <AlertTriangle className="text-destructive size-4 shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      ) : null}

      {report ? (
        <div className="space-y-4">
          {!report.liveDataUsed ? (
            <Card className="border-destructive/40 bg-accent">
              <CardContent className="flex gap-3 py-5 text-sm">
                <AlertTriangle className="text-destructive size-4 shrink-0" />
                <span>
                  מידע חי מהשוק לא היה זמין בהפקה הזו. ההזדמנויות שלמטה מבוססות על פרופיל העסק
                  בלבד.
                </span>
              </CardContent>
            </Card>
          ) : null}

          {report.opportunities.map((o, i) => (
            <Card key={i} className="glass-card hover:shadow-lift border-none transition-shadow">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground font-display text-2xl font-bold tabular-nums opacity-40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Badge variant={PRIORITY_VARIANT[o.priority]}>
                    {PRIORITY_LABEL[o.priority]}
                  </Badge>
                  {o.category ? <Badge variant="outline">{o.category}</Badge> : null}
                </div>
                <CardTitle className="font-display text-lg font-bold">{o.title}</CardTitle>
                <CardDescription className="leading-relaxed">{o.whyItMatters}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-3">
                <Field label="האות מהשוק" value={o.evidence} />
                <Field label="הפעולה המומלצת" value={o.recommendedAction} />
                <Field label="ההשפעה הצפויה" value={o.expectedImpact} />
                {o.sources.length ? (
                  <div className="md:col-span-3">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                      מקורות
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
            <Card className="glass-card border-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Globe className="size-3" /> ממחקר ברשת
                  </Badge>
                </div>
                <CardTitle className="font-display text-lg font-bold">
                  מה מצאנו באינטרנט
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {report.webFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {report.aiInterpretation.length ? (
            <Card className="glass-card border-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge>
                    <Sparkles className="size-3" /> פרשנות AI
                  </Badge>
                </div>
                <CardTitle className="font-display text-lg font-bold">
                  ההיגיון שמאחורי ההמלצות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {report.aiInterpretation.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : !loading ? (
        <p className="text-muted-foreground text-sm">
          עדיין אין הזדמנויות. הריצו חיפוש כדי לראות איפה אתם יכולים לנצח.
        </p>
      ) : null}
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide">{label}</p>
      <p className="mt-1.5 leading-relaxed">{value}</p>
    </div>
  );
}
