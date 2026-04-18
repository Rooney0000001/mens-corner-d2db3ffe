-- Add video_url to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url text;

-- Videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT true,
  position int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos public read"
ON public.videos FOR SELECT
USING (published = true);

CREATE POLICY "Admins/editors manage videos"
ON public.videos FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invite tokens for admin/editor signups
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'editor',
  email text,
  note text,
  created_by uuid,
  used_by uuid,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites"
ON public.invite_tokens FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow anonymous lookup of a token by exact value (needed for signup validation)
CREATE POLICY "Public can read by token value"
ON public.invite_tokens FOR SELECT
USING (used_at IS NULL AND expires_at > now());

-- Function to redeem an invite atomically (creates role, marks used)
CREATE OR REPLACE FUNCTION public.redeem_invite(_token text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inv public.invite_tokens%ROWTYPE;
BEGIN
  SELECT * INTO inv FROM public.invite_tokens
  WHERE token = _token AND used_at IS NULL AND expires_at > now()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, inv.role)
  ON CONFLICT DO NOTHING;

  -- Remove default 'user' role if a higher role was granted
  IF inv.role IN ('admin','editor') THEN
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'user';
  END IF;

  UPDATE public.invite_tokens SET used_by = _user_id, used_at = now() WHERE id = inv.id;
  RETURN true;
END;
$$;