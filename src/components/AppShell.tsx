import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Lightbulb, LineChart, LogOut, Sparkles, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV: { to: string; label: string; icon: LucideIcon; step: string }[] = [
  { to: "/", label: "פרופיל העסק", icon: Building2, step: "1" },
  { to: "/market-analysis", label: "ניתוח שוק", icon: LineChart, step: "2" },
  { to: "/opportunities", label: "הזדמנויות", icon: Sparkles, step: "3" },
  { to: "/marketing-ideas", label: "רעיונות שיווק", icon: Lightbulb, step: "4" },
];


function AccountArea() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      const meta = data.user?.user_metadata as { full_name?: string } | undefined;
      setName(meta?.full_name ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  const signOut = async () => {
    // Navigate away first: protected pages must unmount before the session is
    // cleared, otherwise their queries refetch without a token and 401.
    await queryClient.cancelQueries();
    await navigate({ to: "/auth", replace: true });
    queryClient.clear();
    await supabase.auth.signOut();
  };

  if (!email) return null;

  return (
    <div className="border-sidebar-border/70 mt-6 hidden rounded-2xl border p-3 md:mt-10 md:block">
      <p className="truncate text-sm font-semibold">{name || "החשבון שלי"}</p>
      <p className="text-sidebar-foreground/55 truncate text-[11px]" dir="ltr">
        {email}
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 h-8 w-full justify-start rounded-lg px-2 text-xs"
        onClick={signOut}
      >
        <LogOut className="size-3.5" /> יציאה מהחשבון
      </Button>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-background text-foreground min-h-screen md:flex">
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border border-b px-5 py-5 md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:border-e md:border-b-0 md:px-6 md:py-8">
        <Link to="/" className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-2xl text-lg font-bold"
            style={{
              backgroundImage: "var(--gradient-primary)",
              color: "var(--primary-foreground)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            M
          </span>
          <span className="leading-tight">
            <span className="font-display block text-lg font-bold tracking-tight">
              Market Boost
            </span>
            <span className="text-sidebar-foreground/60 block text-[11px]">
              מנהל השיווק החכם שלך
            </span>
          </span>
        </Link>

        <nav className="mt-6 flex gap-1 overflow-x-auto md:mt-10 md:flex-col md:overflow-visible">
          {NAV.map(({ to, label, icon: Icon, step }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition-all hover:-translate-y-0.5"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-soft",
              }}
            >
              <Icon className="size-4" />
              {label}
              <span className="border-sidebar-border/80 text-sidebar-foreground/50 ms-auto hidden size-5 place-items-center rounded-full border text-[10px] md:grid">
                {step}
              </span>
            </Link>
          ))}
        </nav>


        <AccountArea />

        <p className="text-sidebar-foreground/45 mt-8 hidden text-[11px] leading-relaxed md:block">
          כל ניתוח נבנה מהפרופיל שלך יחד עם מחקר אינטרנט עדכני, עם קישור למקורות.
        </p>
      </aside>

      <main className="surface-mesh flex-1 px-5 py-8 md:px-12 md:py-14">
        <div className="mx-auto max-w-5xl">
          <header className="rise mb-8 md:mb-10">
            {eyebrow ? (
              <span className="border-border/70 bg-card/70 text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                />
                {eyebrow}
              </span>
            ) : null}
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-[2.6rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed md:text-base">
                {subtitle}
              </p>
            ) : null}
          </header>
          <div className="rise" style={{ animationDelay: "90ms" }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

