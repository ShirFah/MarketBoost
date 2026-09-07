import { z } from "zod";

export const businessProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  website: z.string().optional().default(""),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().min(1, "A short description is required"),
  productsServices: z.string().min(1, "Products or services are required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  location: z.string().min(1, "Location or target market is required"),
  marketingGoals: z.string().min(1, "Marketing goals are required"),
  currentChannels: z.string().optional().default(""),
  competitors: z.string().optional().default(""),
});

export type BusinessProfile = z.infer<typeof businessProfileSchema>;

export const emptyProfile: BusinessProfile = {
  businessName: "",
  website: "",
  industry: "",
  description: "",
  productsServices: "",
  targetAudience: "",
  location: "",
  marketingGoals: "",
  currentChannels: "",
  competitors: "",
};

export type Source = {
  name: string;
  title: string;
  url: string;
  date?: string;
};

export type MarketAnalysis = {
  marketOverview: string;
  competitors: { name: string; positioning: string; notes?: string }[];
  trends: string[];
  customerInsights: string[];
  marketDevelopments: string[];
  risks: string[];
  strategicTakeaways: string[];
  webFindings: string[];
  aiInterpretation: string[];
  sources: Source[];
  liveDataUsed: boolean;
  generatedAt: string;
};

export type Opportunity = {
  title: string;
  category: string;
  whyItMatters: string;
  evidence: string;
  recommendedAction: string;
  expectedImpact: string;
  priority: "High" | "Medium" | "Low";
  sources: Source[];
};

export type OpportunityReport = {
  opportunities: Opportunity[];
  webFindings: string[];
  aiInterpretation: string[];
  liveDataUsed: boolean;
  generatedAt: string;
};

export type MarketingIdea = {
  title: string;
  channel: string;
  format: string;
  content: string;
  hashtags?: string[];
  callToAction: string;
  whyNow: string;
  priority: "High" | "Medium" | "Low";
  sources: Source[];
};

export type IdeasReport = {
  ideas: MarketingIdea[];
  trendingNow: { trend: string; howToUse: string }[];
  promotions: { title: string; details: string; whyItWorks: string }[];
  webFindings: string[];
  aiInterpretation: string[];
  liveDataUsed: boolean;
  generatedAt: string;
};
