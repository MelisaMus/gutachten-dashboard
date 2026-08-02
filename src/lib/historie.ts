/** Browsersichere Typen und Beschriftungen der Änderungshistorie. */
export type HistorieAktion = "angelegt" | "geaendert" | "geloescht";

export type HistorieEintrag = {
  id: string;
  auftrag_id: string | null;
  aktenzeichen: string;
  aktion: HistorieAktion;
  feld: string | null;
  wert_alt: string | null;
  wert_neu: string | null;
  rolle: string | null;
  ip: string | null;
  created_at: string;
};

export const FELD_LABEL: Record<string, string> = {
  aktenzeichen: "Aktenzeichen",
  auftraggeber: "Auftraggeber",
  fach: "Fachgebiet",
  gutachterKuerzel: "Gutachterkürzel",
  auftragEingangAm: "Auftragseingang",
  terminAm: "Termin",
  fristAm: "Frist",
  phase: "Phase",
  zusatz: "Zusatzgutachten",
  abrechnungsdatenKomplett: "Abrechnungsdaten",
  fristverlaengerungen: "Fristverlängerungen",
  notiz: "Notiz",
};

export const AKTION_LABEL: Record<HistorieAktion, string> = {
  angelegt: "Angelegt",
  geaendert: "Geändert",
  geloescht: "Gelöscht",
};

export function formatZeitpunkt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
