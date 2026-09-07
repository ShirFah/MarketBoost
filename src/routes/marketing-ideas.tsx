import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  AlertTriangle,
  Copy,
  Globe,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ReportSkeleton } from "@/components/ReportSkeleton";
import { SourceList } from "@/components/SourceList";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMarketingIdeas } from "@/lib/ai.functions";
import { useBusinessProfile, useMarketAnalysis, useMarketingIdeas } from "@/lib/workspace-store";

export const Route = createFileRoute("/marketing-ideas")({
  head: () => ({
    meta: [
      { title: "רעיונות שיווק — Market Boost" },
      {
        name: "description",
        content:
          "רעיונות שיווק מוכנים לפרסום: תוכן לאינסטגרם ולפייסבוק, מבצעים אפשריים וטרנדים שרצים היום ברשת.",
      },
      { property: "og:title", content: "רעיונות שיווק — Market Boost" },
      {
        property: "og:description",
        content: "פוסטים מוכנים, מבצעים וטרנדים עדכניים לעסק שלכם, עם ראיות ומקורות.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketingIdeasPage,
});

const PRIORITY_VARIANT = { High: "default", Medium: "secondary", Low: "outline" } as const;
const PRIORITY_LABEL = {
  High: "עדיפות גבוהה",
  Medium: "עדיפות בינונית",
  Low: "עדיפות נמוכה",
} as const;

function MarketingIdeasPage() {
  const { profile, isComplete } = useBusinessProfile();
  const { analysis } = useMarketAnalysis();
  const { ideas: report, saveIdeas } = useMarketingIdeas();
  const run = useServerFn(generateMarketingIdeas);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

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
                trends: analysis.trends,
                customerInsights: analysis.customerInsights,
              })
            : "",
        },
      });
      saveIdeas(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "משהו השתבש ביצירת הרעיונות. נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!isComplete) {
    return (
      <AppShell title="רעיונות שיווק" subtitle="קודם כל, ספרו לנו על העסק שלכם.">
        <Card className="glass-card border-none">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              השלימו את פרופיל העסק ונכתוב עבורכם תוכן ומבצעים שמתאימים בדיוק לכם.
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
      eyebrow="שלב 4 · מה מפרסמים"
      title="רעיונות שיווק"
      subtitle={`תוכן מוכן לפרסום, מבצעים וטרנדים עדכניים עבור ${profile.businessName}.`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={loading} size="lg" className="rounded-xl">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> כותבים רעיונות…
            </>
          ) : report ? (
            <>
              <RefreshCw className="size-4" /> רעיונות חדשים
            </>
          ) : (
            <>
              <Lightbulb className="size-4" /> יצירת רעיונות שיווק
            </>
          )}
        </Button>
        {report ? (
          <span className="text-muted-foreground text-xs">
            הופק לאחרונה: {new Date(report.generatedAt).toLocaleString("he-IL")}
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

      {report ? (
        <div className="space-y-4">
          {!report.liveDataUsed ? (
            <Card className="border-destructive/40 bg-accent">
              <CardContent className="flex gap-3 py-5 text-sm">
                <AlertTriangle className="text-destructive size-4 shrink-0" />
                <span>
                  מידע חי מהרשת לא היה זמין בהפקה הזו. הרעיונות שלמטה מבוססים על פרופיל העסק בלבד.
                </span>
              </CardContent>
            </Card>
          ) : null}

          {report.trendingNow.length ? (
            <Card className="glass-card border-none">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  <TrendingUp className="size-3" /> רץ עכשיו ברשת
                </Badge>
                <CardTitle className="font-display text-lg font-bold">טרנדים להצטרף אליהם</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {report.trendingNow.map((t, i) => (
                  <div key={i} className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
                    <p className="text-sm font-semibold">{t.trend}</p>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {t.howToUse}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {report.ideas.map((idea, i) => (
            <Card key={i} className="glass-card hover:shadow-lift border-none transition-shadow">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={PRIORITY_VARIANT[idea.priority]}>
                    {PRIORITY_LABEL[idea.priority]}
                  </Badge>
                  {idea.channel ? <Badge variant="outline">{idea.channel}</Badge> : null}
                  {idea.format ? <Badge variant="outline">{idea.format}</Badge> : null}
                </div>
                <CardTitle className="font-display text-lg font-bold">{idea.title}</CardTitle>
                <CardDescription className="leading-relaxed">{idea.whyNow}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                      הטקסט לפרסום
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg text-xs"
                      onClick={() => copy(idea.content, i)}
                    >
                      <Copy className="size-3" /> {copied === i ? "הועתק" : "העתקה"}
                    </Button>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{idea.content}</p>
                  {idea.hashtags?.length ? (
                    <p className="text-primary mt-3 text-xs" dir="ltr">
                      {idea.hashtags.join(" ")}
                    </p>
                  ) : null}
                </div>
                <div className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                    קריאה לפעולה
                  </p>
                  <p className="mt-1.5 leading-relaxed">{idea.callToAction}</p>
                </div>
                {idea.sources.length ? (
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                      מקורות
                    </p>
                    <div className="mt-2">
                      <SourceList sources={idea.sources} compact />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}

          {report.promotions.length ? (
            <Card className="glass-card border-none">
              <CardHeader>
                <CardTitle className="font-display text-lg font-bold">מבצעים אפשריים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.promotions.map((p, i) => (
                  <div key={i} className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed">{p.details}</p>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {p.whyItWorks}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {report.webFindings.length ? (
            <Card className="glass-card border-none">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  <Globe className="size-3" /> ממחקר ברשת
                </Badge>
                <CardTitle className="font-display text-lg font-bold">מה מצאנו באינטרנט</CardTitle>
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
                <Badge className="w-fit">
                  <Sparkles className="size-3" /> פרשנות AI
                </Badge>
                <CardTitle className="font-display text-lg font-bold">
                  ההיגיון שמאחורי הרעיונות
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
          עדיין אין רעיונות. לחצו על הכפתור ונכתוב לכם תוכן, מבצעים וטרנדים עדכניים.
        </p>
      ) : null}
    </AppShell>
  );
}
