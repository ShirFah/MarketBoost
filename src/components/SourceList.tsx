import { ExternalLink } from "lucide-react";
import type { Source } from "@/lib/marketing-types";

export function SourceList({ sources, compact }: { sources: Source[]; compact?: boolean }) {
  if (!sources.length) return null;

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-3"}>
      {sources.map((source, i) => (
        <li key={`${source.url}-${i}`} className="text-sm">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="text-primary inline-flex items-start gap-1.5 text-start font-medium underline-offset-4 hover:underline"
          >
            {source.title || source.url}
            <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
          </a>
          <p className="text-muted-foreground text-xs" dir="ltr">
            {[source.name, source.date].filter(Boolean).join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
