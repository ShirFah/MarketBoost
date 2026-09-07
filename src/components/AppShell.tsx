import { Link } from "@tanstack/react-router";
import { Building2, LineChart, Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const NAV: { to: string; label: string; icon: LucideIcon; step: string }[] = [
  { to: "/", label: "פרופיל העסק", icon: Building2, step: "1" },
  { to: "/market-analysis", label: "ניתוח שוק", icon: LineChart, step: "2" },
  { to: "/opportunities", label: "הזדמנויות", icon: Sparkles, step: "3" },
];


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
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition-all"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-soft",
              }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <p className="text-sidebar-foreground/45 mt-8 hidden text-[11px] leading-relaxed md:block">
          כל ניתוח נבנה מהפרופיל שלך יחד עם מחקר אינטרנט עדכני, עם קישור למקורות.
        </p>
      </aside>

      <main className="surface-mesh flex-1 px-5 py-8 md:px-12 md:py-14">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 md:mb-10">
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
          {children}
        </div>
      </main>
    </div>
  );
}
