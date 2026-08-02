CREATE TABLE public.auftraege (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aktenzeichen text NOT NULL,
  auftraggeber text NOT NULL,
  fach text NOT NULL,
  gutachter_kuerzel text NOT NULL,
  auftrag_eingang_am date NOT NULL,
  termin_am date,
  frist_am date NOT NULL,
  phase text NOT NULL DEFAULT 'Auftragseingang',
  zusatz jsonb NOT NULL DEFAULT '[]'::jsonb,
  abrechnungsdaten_komplett boolean NOT NULL DEFAULT false,
  fristverlaengerungen integer NOT NULL DEFAULT 0,
  notiz text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.auftraege TO service_role;

ALTER TABLE public.auftraege ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_auftraege_updated_at
BEFORE UPDATE ON public.auftraege
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.auftraege (aktenzeichen, auftraggeber, fach, gutachter_kuerzel, auftrag_eingang_am, termin_am, frist_am, phase, zusatz, abrechnungsdaten_komplett, fristverlaengerungen, notiz) VALUES
('S 12 U 431/25', 'Gericht', 'Neurologie', 'GA-04', current_date - 18, current_date + 6, current_date + 38, 'Terminiert', '[{"fach":"Neuropsychologie","beauftragtAm":null,"eingegangen":false}]'::jsonb, true, 0, 'Zusatzgutachten parallel beauftragt.'),
('BG-2025-0771', 'Berufsgenossenschaft', 'Neurologie', 'GA-01', current_date - 47, current_date - 19, current_date + 9, 'In Bearbeitung', '[{"fach":"Orthopädie","beauftragtAm":null,"eingegangen":true}]'::jsonb, true, 0, 'Rohfassung aus Vorlage erstellt.'),
('VS-8842/24', 'Versicherung', 'Psychiatrie', 'GA-07', current_date - 79, current_date - 52, current_date - 23, 'In Bearbeitung', '[]'::jsonb, false, 1, 'Bankverbindung fehlt – Abrechnung blockiert.'),
('S 4 SB 90/25', 'Gericht', 'Neurologie', 'GA-02', current_date - 8, NULL, current_date + 48, 'Auftragseingang', '[]'::jsonb, false, 0, 'Vollständigkeitsprüfung offen.'),
('VS-9013/25', 'Versicherung', 'Neuropsychologie', 'GA-04', current_date - 61, current_date - 40, current_date - 5, 'Versandt', '[]'::jsonb, true, 1, 'Rechnungsstellung vorbereitet.'),
('BG-2025-0644', 'Berufsgenossenschaft', 'Orthopädie', 'GA-05', current_date - 95, current_date - 70, current_date - 39, 'Abgerechnet', '[]'::jsonb, true, 0, '');