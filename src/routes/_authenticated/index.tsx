import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, LineChart, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


import { Textarea } from "@/components/ui/textarea";
import { businessProfileSchema, type BusinessProfile } from "@/lib/marketing-types";
import { useBusinessProfile } from "@/lib/workspace-store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "פרופיל העסק — Market Boost" },
      {
        name: "description",
        content:
          "מלאו את פרופיל העסק שלכם, וקבלו ניתוח שוק והזדמנויות שיווק שמבוססים על מחקר אינטרנט עדכני.",
      },
      { property: "og:title", content: "פרופיל העסק — Market Boost" },
      {
        property: "og:description",
        content:
          "שמרו את פרופיל העסק ואז הפיקו ניתוח שוק והזדמנויות שיווק מבוססי מידע עדכני מהרשת.",
      },
    ],
  }),
  component: ProfilePage,
});

const FIELDS: {
  key: keyof BusinessProfile;
  label: string;
  hint?: string;
  long?: boolean;
  optional?: boolean;
}[] = [
  { key: "businessName", label: "שם העסק" },
  { key: "website", label: "אתר אינטרנט", optional: true, hint: "לדוגמה: myshop.co.il" },
  { key: "industry", label: "תחום העסק", hint: "לדוגמה: בית קפה, טיפוח כלבים" },
  { key: "description", label: "מה העסק שלכם עושה", long: true },
  { key: "productsServices", label: "מוצרים או שירותים", long: true },
  { key: "targetAudience", label: "מי הלקוחות שלכם", long: true },
  { key: "location", label: "מיקום או שוק היעד", hint: "לדוגמה: תל אביב" },
  { key: "marketingGoals", label: "מטרות השיווק המרכזיות", long: true },
  {
    key: "currentChannels",
    label: "השיווק שאתם עושים היום",
    optional: true,
    hint: "לדוגמה: אינסטגרם, מפה לאוזן",
  },
  { key: "competitors", label: "מתחרים שאתם מכירים", optional: true },
];

function ProfilePage() {
  const { profile, saveProfile, ready, isComplete } = useBusinessProfile();
  const [draft, setDraft] = useState<BusinessProfile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const value = draft ?? profile;
  const required = FIELDS.filter((f) => !f.optional);
  const filled = required.filter((f) => (value[f.key] ?? "").trim().length > 0).length;
  const percent = Math.round((filled / required.length) * 100);

  const update = (key: keyof BusinessProfile, next: string) => {
    setDraft({ ...value, [key]: next });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onSave = () => {
    const result = businessProfileSchema.safeParse(value);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      toast.error("נא למלא את השדות המסומנים.");
      document.getElementById(Object.keys(next)[0] ?? "")?.focus();
      return;
    }
    setErrors({});
    saveProfile(result.data);
    setDraft(null);
    toast.success("פרופיל העסק נשמר. אפשר להמשיך לניתוח השוק.");
  };

  return (
    <AppShell
      eyebrow="שלב 1 · הבסיס לכל ניתוח"
      title="פרופיל העסק"
      subtitle="כמה שיותר פרטים כאן, כך ניתוח השוק וההזדמנויות שתקבלו יהיו מדויקים יותר לעסק שלכם."
    >
      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle className="font-display text-xl font-bold">על העסק שלכם</CardTitle>
          <CardDescription>כל השדות חובה, חוץ מאלה שמסומנים כרשות.</CardDescription>
          <div className="mt-4">
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
              <span>
                מולאו {filled} מתוך {required.length}
              </span>
              <span>{percent}%</span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, backgroundImage: "var(--gradient-primary)" }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className={field.long ? "md:col-span-2" : ""}>
              <Label htmlFor={field.key}>
                {field.label}
                {field.optional ? (
                  <span className="text-muted-foreground ms-1 text-xs font-normal">(רשות)</span>
                ) : null}
              </Label>
              <div className="mt-2">
                {field.long ? (
                  <Textarea
                    id={field.key}
                    rows={3}
                    value={value[field.key] ?? ""}
                    placeholder={field.hint}
                    onChange={(e) => update(field.key, e.target.value)}
                    disabled={!ready}
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={value[field.key] ?? ""}
                    placeholder={field.hint}
                    onChange={(e) => update(field.key, e.target.value)}
                    disabled={!ready}
                  />
                )}
              </div>
              {errors[field.key] ? (
                <p className="text-destructive mt-1 text-xs">{errors[field.key]}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="glass-card sticky bottom-4 z-10 mt-6 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
        <Button onClick={onSave} disabled={!ready} size="lg" className="rounded-xl">
          שמירת הפרופיל
        </Button>
        <span className="text-muted-foreground text-xs">
          {draft ? "יש לכם שינויים שלא נשמרו." : isComplete ? "הפרופיל שמור ומוכן." : "אפשר להשלים בהדרגה — נשמור לכם את מה שכבר מולא."}
        </span>
      </div>


      {isComplete ? (
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <ToolCard
            to="/market-analysis"
            icon={<LineChart className="size-5" />}
            title="ניתוח שוק"
            description="מתחרים, מגמות ותובנות על הלקוחות שלכם — מתוך מקורות עדכניים ברשת."
            cta="פתיחת ניתוח השוק"
          />
          <ToolCard
            to="/opportunities"
            icon={<Sparkles className="size-5" />}
            title="הזדמנויות"
            description="מהלכים ממוקדים לפי סדר עדיפויות, עם האות מהשוק שמאחורי כל אחד."
            cta="פתיחת ההזדמנויות"
          />
        </div>
      ) : null}
    </AppShell>
  );
}

function ToolCard({
  to,
  icon,
  title,
  description,
  cta,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link to={to} className="group block">
      <Card className="glass-card hover:shadow-lift h-full border-none transition-all group-hover:-translate-y-1">
        <CardHeader>
          <span
            className="mb-2 grid size-11 place-items-center rounded-2xl"
            style={{
              backgroundImage: "var(--gradient-primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {icon}
          </span>
          <CardTitle className="font-display text-lg font-bold">{title}</CardTitle>
          <CardDescription className="leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold">
            {cta}
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
