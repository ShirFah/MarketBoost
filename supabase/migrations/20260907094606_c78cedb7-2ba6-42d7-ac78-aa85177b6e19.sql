CREATE TABLE public.ai_usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID,
  feature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  model TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ai_usage_events_user_created_idx ON public.ai_usage_events (user_id, created_at DESC);

GRANT SELECT ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_usage_events_select_own
  ON public.ai_usage_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.claim_ai_generation(_feature TEXT, _business_id UUID DEFAULT NULL)
RETURNS TABLE (allowed BOOLEAN, reason TEXT, event_id UUID, hourly_used INT, daily_used INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _hourly INT;
  _daily INT;
  _hour_limit CONSTANT INT := 5;
  _day_limit CONSTANT INT := 20;
  _new_id UUID;
BEGIN
  IF _uid IS NULL THEN
    RETURN QUERY SELECT false, 'unauthenticated', NULL::uuid, 0, 0;
    RETURN;
  END IF;

  -- Serialise concurrent claims for the same user so parallel requests
  -- cannot both pass the check.
  PERFORM pg_advisory_xact_lock(hashtext('ai_usage:' || _uid::text));

  SELECT
    count(*) FILTER (WHERE created_at > now() - interval '1 hour'),
    count(*) FILTER (WHERE created_at > now() - interval '1 day')
  INTO _hourly, _daily
  FROM public.ai_usage_events
  WHERE user_id = _uid;

  IF _daily >= _day_limit THEN
    RETURN QUERY SELECT false, 'daily', NULL::uuid, _hourly, _daily;
    RETURN;
  END IF;

  IF _hourly >= _hour_limit THEN
    RETURN QUERY SELECT false, 'hourly', NULL::uuid, _hourly, _daily;
    RETURN;
  END IF;

  INSERT INTO public.ai_usage_events (user_id, business_id, feature)
  VALUES (_uid, _business_id, _feature)
  RETURNING id INTO _new_id;

  RETURN QUERY SELECT true, 'ok', _new_id, _hourly + 1, _daily + 1;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ai_generation(TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_ai_generation(TEXT, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.finish_ai_generation(_event_id UUID, _success BOOLEAN, _meta JSONB DEFAULT '{}'::jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL OR _event_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.ai_usage_events
  SET status = CASE WHEN _success THEN 'success' ELSE 'failed' END,
      meta = COALESCE(_meta, '{}'::jsonb),
      completed_at = now()
  WHERE id = _event_id AND user_id = _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.finish_ai_generation(UUID, BOOLEAN, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_ai_generation(UUID, BOOLEAN, JSONB) TO authenticated;