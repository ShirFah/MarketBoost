import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "כניסה לחשבון — Market Boost" },
      {
        name: "description",
        content:
          "התחברו או פתחו חשבון ב-Market Boost, וקבלו ניתוח שוק, הזדמנויות ורעיונות שיווק לעסק שלכם.",
      },
      { property: "og:title", content: "כניסה לחשבון — Market Boost" },
      {
        property: "og:description",
        content: "חשבון אישי שבו פרופיל העסק והדוחות שלכם נשמרים בענן.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) navigate({ to: "/", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("שלחנו לכם מייל לאישור החשבון. אשרו אותו ואז התחברו.");
          setMode("login");
          return;
        }
        toast.success("החשבון נוצר. ברוכים הבאים!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("התחברתם בהצלחה.");
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "משהו השתבש. נסו שוב.";
      toast.error(
        message.includes("Invalid login credentials")
          ? "האימייל או הסיסמה לא נכונים."
          : message.includes("already registered")
            ? "כבר קיים חשבון עם האימייל הזה. נסו להתחבר."
            : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface-mesh flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span
            className="grid size-11 place-items-center rounded-2xl text-lg font-bold"
            style={{
              backgroundImage: "var(--gradient-primary)",
              color: "var(--primary-foreground)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            M
          </span>
          <span className="leading-tight">
            <span className="font-display block text-xl font-bold tracking-tight">
              Market Boost
            </span>
            <span className="text-muted-foreground block text-[11px]">
              מנהל השיווק החכם שלך
            </span>
          </span>
        </div>

        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="font-display text-xl font-bold">
              {mode === "login" ? "כניסה לחשבון" : "פתיחת חשבון חדש"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "התחברו כדי לראות את פרופיל העסק והדוחות שלכם."
                : "כמה פרטים קצרים, וכבר אפשר להתחיל."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" ? (
                <div>
                  <Label htmlFor="fullName">שם מלא</Label>
                  <Input
                    id="fullName"
                    className="mt-2"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              ) : null}
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  className="mt-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  className="mt-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-xl" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === "login" ? "כניסה" : "יצירת חשבון"}
              </Button>
            </form>

            <p className="text-muted-foreground mt-5 text-center text-sm">
              {mode === "login" ? "אין לכם חשבון עדיין?" : "יש לכם כבר חשבון?"}{" "}
              <button
                type="button"
                className="text-primary font-semibold"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "פתחו חשבון" : "התחברו"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
