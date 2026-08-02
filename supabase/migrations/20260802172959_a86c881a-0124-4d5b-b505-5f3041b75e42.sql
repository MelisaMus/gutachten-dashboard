CREATE TABLE public.auftrag_historie (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auftrag_id uuid,
  aktenzeichen text NOT NULL,
  aktion text NOT NULL,
  feld text,
  wert_alt text,
  wert_neu text,
  rolle text,
  ip text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX auftrag_historie_auftrag_idx ON public.auftrag_historie (auftrag_id, created_at DESC);
CREATE INDEX auftrag_historie_zeit_idx ON public.auftrag_historie (created_at DESC);

GRANT ALL ON public.auftrag_historie TO service_role;

ALTER TABLE public.auftrag_historie ENABLE ROW LEVEL SECURITY;