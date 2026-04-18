-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Public can read by token value" ON public.invite_tokens;

-- Create a SECURITY DEFINER function that returns only minimal info for a specific token
CREATE OR REPLACE FUNCTION public.validate_invite(_token text)
RETURNS TABLE(role public.app_role, valid boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    inv.role,
    (inv.used_at IS NULL AND inv.expires_at > now()) AS valid
  FROM public.invite_tokens inv
  WHERE inv.token = _token
  LIMIT 1;
$$;

-- Allow anonymous and authenticated users to call the validation function
GRANT EXECUTE ON FUNCTION public.validate_invite(text) TO anon, authenticated;