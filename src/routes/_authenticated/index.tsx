import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Lightbulb,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SourceList } from "@/components/SourceList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  buildNextActions,
  buildStatusSummary,
  buildWeek,
  PRIORITY_LABEL,
  PRIORITY_VARIANT,
  type NextAction,
} from "@/lib/dashboard-insights";
import {
  useBusinessProfile,
  useMarketAnalysis,
  useMarketingIdeas,
  useOpportunities,
} from "@/lib/workspace-store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "בית — Market Boost" },
      {
        name: "description",
        content:
          "מנהל השיווק החכם שלכם: סטטוס העסק, הפעולות המשתלמות עכשיו, הזדמנויות פתוחות ורעיונות תוכן.",
      },
      { property: "og:title", content: "בית — Market Boost" },
      {
        property: "og:description",
        content: "מה קורה בעסק שלכם ומה כדאי לעשות עכשיו — במקום אחד.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  if (h < 21) return "אחר צהריים טובים";
  return "ערב טוב";
}

function useFirstName() {
  const [name, setName] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const meta = data.user?.user_metadata as { full_name?: string } | undefined;
      setName((meta?.full_name ?? "").trim().split(" ")[0] ?? "");
    });
    return () => {
      active = false;
    };
  }, []);
  return name;
}

function DashboardPage() {
  const navigate = useNavigate();
  const { profile, isComplete, ready } = useBusinessProfile();
  const { analysis } = useMarketAnalysis();
  const { report: opportunities } = useOpportunities();
  const { ideas } = useMarketingIdeas();
  const firstName = useFirstName();
  const [openAction, setOpenAction] = useState<NextAction | null>(null);

  // Onboarding: a profile is the minimum the dashboard needs to say anything.
  useEffect(() => {
    if (ready && !isComplete) void navigate({ to: "/business", replace: true });
  }, [ready, isComplete, navigate]);

  if (!ready || !isComplete) {
    return (
      <AppShell title="בית" subtitle="טוענים את התמונה של העסק שלכם…">
        <div className="bg-muted/60 h-40 animate-pulse rounded-3xl" />
      </AppShell>
    );
  }

  const actions = buildNextActions(opportunities, ideas);
  const summary = buildStatusSummary(profile, analysis, opportunities, ideas);
  const week = buildWeek(actions, ideas);
  const topOpportunities = (opportunities?.opportunities ?? []).slice(0, 3);

  const act = (action: NextAction) => {
    if (action.kind === "content") {
      void navigate({ to: "/marketing-ideas", search: { focus: action.context } });
      return;
    }
    setOpenAction(action);
  };

  return (
    <AppShell
      eyebrow="מנהל השיווק שלכם עבר על העסק"
      title={`${greeting()}${firstName ? `, ${firstName}` : ""} 👋`}
      subtitle={`מה קורה ב${profile.businessName}`}
    >
      <Card className="glass-card border-none">
        <CardContent className="py-6">
          {summary.hasData ? (
            <div className="space-y-2 text-sm leading-relaxed md:text-base">
              {summary.sentences.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              עדיין אין לנו נתונים על העסק שלכם. נתחיל ממחקר שוק — ומשם נדע מה כדאי לעשות.
            </p>
          )}
          {summary.missing.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {summary.missing.map((m) => (
                <Button key={m.to} asChild variant="secondary" size="sm" className="rounded-xl">
                  <Link to={m.to}>{m.label}</Link>
                </Button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="mt-10">
        <SectionHead
          icon={<Wand2 className="size-4" />}
          title="מה כדאי לעשות עכשיו"
          hint="עד שלוש פעולות, לפי דחיפות והשפעה על העסק."
        />
        {actions.length ? (
          <div className="grid gap-4">
            {actions.map((action) => (
              <Card key={action.id} className="glass-card hover:shadow-lift border-none transition-all">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={PRIORITY_VARIANT[action.priority]}>
                      {PRIORITY_LABEL[action.priority]}
                    </Badge>
                    {action.kind === "content" ? (
                      <Badge variant="outline">אפשר להפוך לתוכן</Badge>
                    ) : null}
                  </div>
                  <CardTitle className="font-display text-lg font-bold">{action.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {action.explanation}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                      למה עכשיו
                    </p>
                    <p className="mt-1.5 leading-relaxed">{action.whyNow}</p>
                  </div>
                  {action.source ? <SourceList sources={[action.source]} compact /> : null}
                  <Button className="rounded-xl" onClick={() => act(action)}>
                    בואי נעשה את זה
                    <ArrowLeft className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyCard
            text="אחרי שנפיק הזדמנויות או רעיונות תוכן, נציג כאן את הפעולות המשתלמות ביותר לעסק שלכם."
            to="/opportunities"
            cta="חיפוש הזדמנויות"
          />
        )}
      </section>

      <section className="mt-10">
        <SectionHead
          icon={<Target className="size-4" />}
          title="הזדמנויות עכשיו"
          hint="מתוך דוח ההזדמנויות האחרון שלכם."
        />
        {topOpportunities.length ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {topOpportunities.map((o, i) => (
                <Card key={i} className="glass-card border-none">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={PRIORITY_VARIANT[o.priority]}>
                        {PRIORITY_LABEL[o.priority]}
                      </Badge>
                      {o.category ? <Badge variant="outline">{o.category}</Badge> : null}
                    </div>
                    <CardTitle className="font-display text-base font-bold">{o.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{o.whyItMatters}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                        האות מהשוק
                      </p>
                      <p className="mt-1.5 leading-relaxed">{o.evidence}</p>
                    </div>
                    {o.sources.length ? <SourceList sources={o.sources.slice(0, 1)} compact /> : null}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button asChild variant="ghost" className="mt-4 rounded-xl">
              <Link to="/opportunities">
                צפי בכל ההזדמנויות <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </>
        ) : (
          <EmptyCard
            text="עוד לא הפקתם דוח הזדמנויות. נחפש עבורכם פתחים בשוק לפי פרופיל העסק ומידע עדכני מהרשת."
            to="/opportunities"
            cta="חיפוש הזדמנויות"
          />
        )}
      </section>

      <section className="mt-10">
        <SectionHead
          icon={<Lightbulb className="size-4" />}
          title="רעיונות לתוכן"
          hint="הצצה לרעיונות האחרונים שנכתבו לכם."
        />
        {ideas ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {ideas.ideas[0] ? (
                <MiniCard
                  label="רעיון לפוסט"
                  title={ideas.ideas[0].title}
                  body={ideas.ideas[0].content}
                />
              ) : null}
              {ideas.promotions[0] ? (
                <MiniCard
                  label="רעיון למבצע"
                  title={ideas.promotions[0].title}
                  body={ideas.promotions[0].details}
                />
              ) : null}
              {ideas.trendingNow[0] ? (
                <MiniCard
                  label="טרנד עכשווי"
                  title={ideas.trendingNow[0].trend}
                  body={ideas.trendingNow[0].howToUse}
                />
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="ghost" className="rounded-xl">
                <Link to="/marketing-ideas">
                  צפי בכל הרעיונות <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button asChild className="rounded-xl">
                <Link to="/marketing-ideas">
                  <Sparkles className="size-4" /> צרי רעיון חדש
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <EmptyCard
            text="עוד אין רעיונות תוכן. נכתוב לכם פוסטים מוכנים לפרסום, מבצעים וטרנדים שרצים היום."
            to="/marketing-ideas"
            cta="צרי רעיון חדש"
          />
        )}
      </section>

      <section className="mt-10 mb-4">
        <SectionHead
          icon={<CalendarDays className="size-4" />}
          title="השבוע שלך"
          hint="המוקדים שכדאי לקדם בשבוע הקרוב."
        />
        <Card className="glass-card border-none">
          <CardContent className="py-6">
            {week.length ? (
              <ul className="space-y-3">
                {week.map((item, i) => (
                  <li
                    key={i}
                    className="bg-secondary/50 border-border/70 flex flex-wrap items-start gap-3 rounded-2xl border p-4"
                  >
                    <span className="font-display text-muted-foreground text-lg font-bold opacity-40 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                    <Badge variant={PRIORITY_VARIANT[item.priority]}>
                      {PRIORITY_LABEL[item.priority]}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">
                בקרוב נבנה כאן את תוכנית השיווק השבועית שלך.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={Boolean(openAction)} onOpenChange={(o) => !o && setOpenAction(null)}>
        <DialogContent className="max-w-lg text-start">
          <DialogHeader>
            <DialogTitle className="font-display text-start text-lg font-bold">
              {openAction?.title}
            </DialogTitle>
            <DialogDescription className="text-start leading-relaxed">
              {openAction?.explanation}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide">למה עכשיו</p>
              <p className="mt-1.5 leading-relaxed">{openAction?.whyNow}</p>
            </div>
            <div className="bg-secondary/50 border-border/70 rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                הצעד המומלץ הבא
              </p>
              <p className="mt-1.5 leading-relaxed">{openAction?.suggestedNextStep}</p>
            </div>
            {openAction?.source ? <SourceList sources={[openAction.source]} compact /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function SectionHead({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span
          className="grid size-8 place-items-center rounded-xl"
          style={{
            backgroundImage: "var(--gradient-primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {icon}
        </span>
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      </div>
      <p className="text-muted-foreground mt-1.5 text-sm">{hint}</p>
    </div>
  );
}

function MiniCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          {label}
        </Badge>
        <CardTitle className="font-display text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap">
          {body}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyCard({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <Card className="glass-card border-none">
      <CardContent className="py-8 text-center">
        <p className="text-muted-foreground mx-auto max-w-lg text-sm leading-relaxed">{text}</p>
        <Button asChild className="mt-5 rounded-xl">
          <Link to={to}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
