CREATE OR REPLACE FUNCTION public.owns_business(_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = _business_id AND b.user_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.owns_business(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_business(UUID) TO authenticated;