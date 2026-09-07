import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
  errorComponent: () => (
    <div className="surface-mesh flex min-h-screen items-center justify-center px-5">
      <div className="glass-card max-w-sm rounded-2xl p-6 text-center">
        <h1 className="font-display mb-2 text-lg font-bold">צריך להתחבר מחדש</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          החיבור לחשבון הסתיים. התחברו שוב והנתונים שלכם יחזרו כמו שהיו.
        </p>
        <Link
          to="/auth"
          className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold"
        >
          מסך הכניסה
        </Link>
      </div>
    </div>
  ),
});
