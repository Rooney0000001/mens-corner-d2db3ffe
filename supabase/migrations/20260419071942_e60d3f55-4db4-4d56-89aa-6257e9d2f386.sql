CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views (path);
CREATE INDEX idx_page_views_post_id ON public.page_views (post_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a view"
  ON public.page_views
  FOR INSERT
  TO public
  WITH CHECK (
    char_length(path) >= 1 AND char_length(path) <= 500
  );

CREATE POLICY "Admins read analytics"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
