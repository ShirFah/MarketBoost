import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { businessProfileSchema, type BusinessProfile } from "@/lib/marketing-types";
import { useBusinessProfile } from "@/lib/workspace-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Market Boost — AI Marketing Manager for Small Businesses" },
      {
        name: "description",
        content:
          "Market Boost researches your market live and turns it into clear marketing analysis and opportunities for your small business.",
      },
      { property: "og:title", content: "Market Boost — AI Marketing Manager" },
      {
        property: "og:description",
        content:
          "Save your business profile, then generate market analysis and marketing opportunities backed by current web research.",
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
  { key: "businessName", label: "Business name" },
  { key: "website", label: "Website", optional: true, hint: "e.g. yourshop.com" },
  { key: "industry", label: "Industry", hint: "e.g. specialty coffee, dog grooming" },
  { key: "description", label: "What your business does", long: true },
  { key: "productsServices", label: "Products or services", long: true },
  { key: "targetAudience", label: "Who your customers are", long: true },
  { key: "location", label: "Location or target market" },
  { key: "marketingGoals", label: "Main marketing goals", long: true },
  {
    key: "currentChannels",
    label: "Marketing you do today",
    optional: true,
    hint: "e.g. Instagram, word of mouth",
  },
  { key: "competitors", label: "Competitors you know of", optional: true },
];

function ProfilePage() {
  const { profile, saveProfile, ready, isComplete } = useBusinessProfile();
  const [draft, setDraft] = useState<BusinessProfile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const value = draft ?? profile;

  const update = (key: keyof BusinessProfile, next: string) => {
    setDraft({ ...value, [key]: next });
  };

  const onSave = () => {
    const result = businessProfileSchema.safeParse(value);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      toast.error("Please fill in the highlighted fields.");
      return;
    }
    setErrors({});
    saveProfile(result.data);
    setDraft(null);
    toast.success("Business profile saved.");
  };

  return (
    <AppShell
      title="Business Profile"
      subtitle="The more detail you give here, the sharper your market analysis and opportunities will be."
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">About your business</CardTitle>
          <CardDescription>Everything except the marked fields is required.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className={field.long ? "md:col-span-2" : ""}>
              <Label htmlFor={field.key}>
                {field.label}
                {field.optional ? (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
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
                <p className="mt-1 text-xs text-destructive">{errors[field.key]}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={onSave} disabled={!ready}>
          Save profile
        </Button>
        {draft ? (
          <span className="text-xs text-muted-foreground">You have unsaved changes.</span>
        ) : null}
      </div>

      {isComplete ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Market Analysis</CardTitle>
              <CardDescription>
                Current competitors, trends and customer insights, researched on the web.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link to="/market-analysis">Open Market Analysis</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Opportunities</CardTitle>
              <CardDescription>
                Prioritised, timely moves for your business with the evidence behind them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link to="/opportunities">Open Opportunities</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
