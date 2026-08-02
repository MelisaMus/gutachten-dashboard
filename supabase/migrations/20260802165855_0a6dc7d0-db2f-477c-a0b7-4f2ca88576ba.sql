CREATE TABLE public.gate_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  salt text NOT NULL,
  iterations integer NOT NULL DEFAULT 210000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.gate_credentials TO service_role;

ALTER TABLE public.gate_credentials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_gate_credentials_updated_at
BEFORE UPDATE ON public.gate_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();