import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "תוכנית שיווק — Market Boost" },
      {
        name: "description",
        content: "תוכנית השיווק השבועית של העסק שלכם — בפיתוח. בינתיים אפשר לעבוד מההמלצות בבית.",
      },
      { property: "og:title", content: "תוכנית שיווק — Market Boost" },
      {
        property: "og:description",
        content: "כאן תיבנה תוכנית השיווק השבועית שלכם, מבוססת על ההזדמנויות והתוכן שלכם.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  return (
    <AppShell
      eyebrow="בקרוב"
      title="תוכנית שיווק"
      subtitle="כאן תיבנה תוכנית השיווק השבועית שלכם — מה לפרסם, מתי, ובאיזה ערוץ."
    >
      <Card className="glass-card border-none">
        <CardContent className="py-12 text-center">
          <span
            className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl"
            style={{
              backgroundImage: "var(--gradient-primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <CalendarDays className="size-5" />
          </span>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            אנחנו עובדים על זה. בינתיים תמצאו בעמוד הבית את הפעולות שכדאי לקדם השבוע, לפי
            ההזדמנויות והתוכן שהופקו לעסק שלכם.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/">חזרה לבית</Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
