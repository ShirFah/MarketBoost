-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- businesses
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  products_services TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  marketing_goals TEXT NOT NULL DEFAULT '',
  current_channels TEXT NOT NULL DEFAULT '',
  known_competitors TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX businesses_user_id_idx ON public.businesses (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "businesses_all_own" ON public.businesses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ownership helper
CREATE OR REPLACE FUNCTION public.owns_business(_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = _business_id AND b.user_id = auth.uid()
  )
$$;

-- market_analyses
CREATE TABLE public.market_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  research_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX market_analyses_business_idx ON public.market_analyses (business_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_analyses TO authenticated;
GRANT ALL ON public.market_analyses TO service_role;
ALTER TABLE public.market_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_analyses_all_own" ON public.market_analyses FOR ALL TO authenticated
  USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

-- opportunities_reports
CREATE TABLE public.opportunities_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  market_analysis_id UUID REFERENCES public.market_analyses(id) ON DELETE SET NULL,
  content JSONB NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  research_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX opportunities_reports_business_idx ON public.opportunities_reports (business_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities_reports TO authenticated;
GRANT ALL ON public.opportunities_reports TO service_role;
ALTER TABLE public.opportunities_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities_reports_all_own" ON public.opportunities_reports FOR ALL TO authenticated
  USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

-- marketing_ideas_reports
CREATE TABLE public.marketing_ideas_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  market_analysis_id UUID REFERENCES public.market_analyses(id) ON DELETE SET NULL,
  content JSONB NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  research_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX marketing_ideas_reports_business_idx ON public.marketing_ideas_reports (business_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_ideas_reports TO authenticated;
GRANT ALL ON public.marketing_ideas_reports TO service_role;
ALTER TABLE public.marketing_ideas_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_ideas_reports_all_own" ON public.marketing_ideas_reports FOR ALL TO authenticated
  USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();