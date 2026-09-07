import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Globe, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ReportSkeleton } from "@/components/ReportSkeleton";
import { SourceList } from "@/components/SourceList";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMarketAnalysis } from "@/lib/ai.functions";
import { useBusinessProfile, useMarketAnalysis } from "@/lib/workspace-store";

export const Route = createFileRoute("/_authenticated/market-analysis")({
  head: () => ({
    meta: [
      { title: "ניתוח שוק — Market Boost" },
      {
        name: "description",
        content:
          "הפיקו ניתוח שוק עדכני לעסק שלכם: מתחרים, מגמות, תובנות על הלקוחות וסיכונים — עם מקורות מצוטטים.",
      },
      { property: "og:title", content: "ניתוח שוק — Market Boost" },
      {
        property: "og:description",
        content: "מחקר אינטרנט עדכני יחד עם פרשנות AI, שהופכים לניתוח שוק לעסק הקטן שלכם.",
      },
    ],
  }),
  component: MarketAnalysisPage,
});

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5 text-sm leading-relaxed">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              />
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
  const { analysis, saveAnalysis, businessId } = useMarketAnalysis();
  const run = useServerFn(generateMarketAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await run({ data: { businessId: businessId as string } });
      saveAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "משהו השתבש בהפקת הניתוח. נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  if (!isComplete) {
    return (
      <AppShell title="ניתוח שוק" subtitle="קודם כל, ספרו לנו על העסק שלכם.">
        <Card className="glass-card border-none">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              השלימו את פרופיל העסק ונוכל לחקור עבורכם את השוק.
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
      eyebrow="שלב 2 · תמונת מצב מהשוק"
      title="ניתוח שוק"
      subtitle={`תמונה עדכנית של השוק סביב ${profile.businessName}, שנחקרה ברשת ופורשה עבורכם.`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={loading} size="lg" className="rounded-xl">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> חוקרים את השוק שלכם…
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="size-4" /> הפקת ניתוח מחדש
            </>
          ) : (
            <>
              <Search className="size-4" /> הפקת ניתוח שוק
            </>
          )}
        </Button>
        {analysis ? (
          <span className="text-muted-foreground text-xs">
            הופק לאחרונה: {new Date(analysis.generatedAt).toLocaleString("he-IL")}
          </span>
        ) : null}
      </div>

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

      {analysis ? (
        <div className="space-y-4">
          {!analysis.liveDataUsed ? (
            <Card className="border-destructive/40 bg-accent">
              <CardContent className="flex gap-3 py-5 text-sm">
                <AlertTriangle className="text-destructive size-4 shrink-0" />
                <span>
                  מידע חי מהשוק לא היה זמין בהפקה הזו. הניתוח שלמטה מבוסס על פרופיל העסק בלבד.
                </span>
              </CardContent>
            </Card>
          ) : null}

          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-display text-lg font-bold">סקירת שוק</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed whitespace-pre-line">
              {analysis.marketOverview}
            </CardContent>
          </Card>

          {analysis.competitors.length ? (
            <Card className="glass-card border-none">
              <CardHeader>
                <CardTitle className="font-display text-lg font-bold">
                  מתחרים ומיצוב
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {analysis.competitors.map((c, i) => (
                  <div key={i} className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-primary mt-1 text-sm">{c.positioning}</p>
                    {c.notes ? <p className="mt-2 text-sm leading-relaxed">{c.notes}</p> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Section title="מגמות עדכניות" items={analysis.trends} />
          <Section title="תובנות על קהל היעד" items={analysis.customerInsights} />
          <Section title="התפתחויות חשובות בשוק" items={analysis.marketDevelopments} />
          <Section title="סיכונים ואתגרים" items={analysis.risks} />
          <Section title="מסקנות אסטרטגיות מרכזיות" items={analysis.strategicTakeaways} />

          {analysis.webFindings.length ? (
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
                <CardDescription>עובדות שנאספו מהמקורות שמופיעים למטה.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {analysis.webFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {analysis.aiInterpretation.length ? (
            <Card className="glass-card border-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge>
                    <Sparkles className="size-3" /> פרשנות AI
                  </Badge>
                </div>
                <CardTitle className="font-display text-lg font-bold">
                  מה זה אומר עבורכם
                </CardTitle>
                <CardDescription>
                  המלצות, לא עובדות — בחנו אותן מול מה שאתם מכירים בעסק.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {analysis.aiInterpretation.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {analysis.sources.length ? (
            <Card className="glass-card border-none">
              <CardHeader>
                <CardTitle className="font-display text-lg font-bold">מקורות</CardTitle>
              </CardHeader>
              <CardContent>
                <SourceList sources={analysis.sources} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : !loading ? (
        <p className="text-muted-foreground text-sm">
          עדיין אין ניתוח. הפיקו אחד כדי לראות את השוק שלכם.
        </p>
      ) : null}
    </AppShell>
  );
}
