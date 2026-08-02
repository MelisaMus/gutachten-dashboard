CREATE TABLE public.zugriff_protokoll (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ereignis text NOT NULL,
  rolle text,
  ip text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.zugriff_protokoll TO service_role;
ALTER TABLE public.zugriff_protokoll ENABLE ROW LEVEL SECURITY;
CREATE INDEX zugriff_protokoll_created_at_idx ON public.zugriff_protokoll (created_at DESC);