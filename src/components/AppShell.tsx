import { Link } from "@tanstack/react-router";
import { Building2, LineChart, Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Business Profile", icon: Building2 },
  { to: "/market-analysis", label: "Market Analysis", icon: LineChart },
  { to: "/opportunities", label: "Opportunities", icon: Sparkles },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="border-b border-border bg-sidebar px-5 py-5 md:min-h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-semibold text-primary-foreground">
            M
          </span>
          <span className="font-display text-lg tracking-tight">Market Boost</span>
        </Link>
        <p className="mt-1 hidden text-xs text-muted-foreground md:block">
          AI marketing manager
        </p>

        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{
                className: "bg-accent text-accent-foreground font-medium",
              }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">{title}</h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
