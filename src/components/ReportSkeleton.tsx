import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = [
  "קוראים את פרופיל העסק שלכם…",
  "מחפשים מקורות עדכניים ברשת…",
  "בודקים מה עושים המתחרים…",
  "מזהים מגמות ואותות מהשוק…",
  "מנסחים את התובנות בשבילכם…",
];

export function ReportSkeleton({ cards = 3 }: { cards?: number }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="text-muted-foreground flex items-center gap-2.5 text-sm">
        <span className="relative flex size-2.5">
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-60"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          />
          <span
            className="relative size-2.5 rounded-full"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          />
        </span>
        <span key={step} className="rise">
          {STEPS[step]}
        </span>
      </div>
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i} className="glass-card rise border-none" style={{ animationDelay: `${i * 90}ms` }}>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-8/12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
