CREATE TABLE public.gate_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  erstellt_von text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.gate_reset_tokens TO service_role;

ALTER TABLE public.gate_reset_tokens ENABLE ROW LEVEL SECURITY;