/**
 * Datenschutz: Es werden bewusst KEINE personenbezogenen Daten gespeichert.
 * Ein Auftrag wird ausschliesslich über Aktenzeichen / internes Kürzel geführt.
 */

export type Fachgebiet =
  | "Neurologie"
  | "Neuropsychologie"
  | "Neurophysiologie"
  | "EEG"
  | "Orthopädie"
  | "Psychiatrie"
  | "Sonstiges";

export type Auftraggeber = "Gericht" | "Versicherung" | "Berufsgenossenschaft" | "Sonstige";

export type Phase =
  | "Auftragseingang"
  | "Terminiert"
  | "Untersuchung erfolgt"
  | "In Bearbeitung"
  | "Versandt"
  | "Abgerechnet";

export type Zusatzgutachten = {
  fach: Fachgebiet;
  beauftragtAm: string | null;
  eingegangen: boolean;
};

export type Auftrag = {
  id: string;
  aktenzeichen: string;
  auftraggeber: Auftraggeber;
  fach: Fachgebiet;
  /** Pseudonymes Kürzel des Gutachters, z. B. "GA-04" – kein Klarname */
  gutachterKuerzel: string;
  auftragEingangAm: string;
  terminAm: string | null;
  fristAm: string;
  phase: Phase;
  zusatz: Zusatzgutachten[];
  abrechnungsdatenKomplett: boolean;
  fristverlaengerungen: number;
  notiz: string;
};

export const PHASEN: Phase[] = [
  "Auftragseingang",
  "Terminiert",
  "Untersuchung erfolgt",
  "In Bearbeitung",
  "Versandt",
  "Abgerechnet",
];

export const FACHGEBIETE: Fachgebiet[] = [
  "Neurologie",
  "Neuropsychologie",
  "Neurophysiologie",
  "EEG",
  "Orthopädie",
  "Psychiatrie",
  "Sonstiges",
];

export const AUFTRAGGEBER: Auftraggeber[] = [
  "Gericht",
  "Versicherung",
  "Berufsgenossenschaft",
  "Sonstige",
];

export type Ampel = "gruen" | "gelb" | "rot" | "fertig";

const MS_TAG = 86_400_000;

export function tageBis(iso: string): number {
  const ziel = new Date(iso + "T00:00:00").getTime();
  const heute = new Date(new Date().toDateString()).getTime();
  return Math.round((ziel - heute) / MS_TAG);
}

export function wochenSeit(iso: string): number {
  return Math.max(0, Math.floor(-tageBis(iso) / 7));
}

/** Ampel nach Standardfrist 8 Wochen: grün <6 Wochen, gelb 6–8, rot >8 */
export function ampel(a: Auftrag): Ampel {
  if (a.phase === "Versandt" || a.phase === "Abgerechnet") return "fertig";
  const laufzeit = wochenSeit(a.auftragEingangAm);
  const restTage = tageBis(a.fristAm);
  if (restTage < 0 || laufzeit > 8) return "rot";
  if (laufzeit >= 6 || restTage <= 14) return "gelb";
  return "gruen";
}

export const AMPEL_LABEL: Record<Ampel, string> = {
  gruen: "Im Plan",
  gelb: "Frist naht",
  rot: "Überfällig",
  fertig: "Abgeschlossen",
};

export function eskalation(a: Auftrag): string | null {
  if (a.phase === "Versandt" || a.phase === "Abgerechnet") return null;
  const w = wochenSeit(a.auftragEingangAm);
  if (w >= 10) return "Eskalation – Standardschreiben an Auftraggeber";
  if (w >= 8) return "Persönliche Erinnerung an Gutachter";
  if (w >= 6) return "Automatische Erinnerung fällig";
  return null;
}

export function formatDatum(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function plusTage(tage: number): string {
  const d = new Date(Date.now() + tage * MS_TAG);
  return d.toISOString().slice(0, 10);
}

export function neueId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function standardfrist(eingang: string): string {
  const d = new Date(eingang + "T00:00:00").getTime() + 56 * MS_TAG;
  return new Date(d).toISOString().slice(0, 10);
}

const STORAGE_KEY = "gutachten-dashboard-v1";

export function seedAuftraege(): Auftrag[] {
  return [
    {
      id: neueId(),
      aktenzeichen: "S 12 U 431/25",
      auftraggeber: "Gericht",
      fach: "Neurologie",
      gutachterKuerzel: "GA-04",
      auftragEingangAm: plusTage(-18),
      terminAm: plusTage(6),
      fristAm: plusTage(38),
      phase: "Terminiert",
      zusatz: [{ fach: "Neuropsychologie", beauftragtAm: plusTage(-17), eingegangen: false }],
      abrechnungsdatenKomplett: true,
      fristverlaengerungen: 0,
      notiz: "Zusatzgutachten parallel beauftragt.",
    },
    {
      id: neueId(),
      aktenzeichen: "BG-2025-0771",
      auftraggeber: "Berufsgenossenschaft",
      fach: "Neurologie",
      gutachterKuerzel: "GA-01",
      auftragEingangAm: plusTage(-47),
      terminAm: plusTage(-19),
      fristAm: plusTage(9),
      phase: "In Bearbeitung",
      zusatz: [{ fach: "Orthopädie", beauftragtAm: plusTage(-46), eingegangen: true }],
      abrechnungsdatenKomplett: true,
      fristverlaengerungen: 0,
      notiz: "Rohfassung aus Vorlage erstellt.",
    },
    {
      id: neueId(),
      aktenzeichen: "VS-8842/24",
      auftraggeber: "Versicherung",
      fach: "Psychiatrie",
      gutachterKuerzel: "GA-07",
      auftragEingangAm: plusTage(-79),
      terminAm: plusTage(-52),
      fristAm: plusTage(-23),
      phase: "In Bearbeitung",
      zusatz: [],
      abrechnungsdatenKomplett: false,
      fristverlaengerungen: 1,
      notiz: "Bankverbindung fehlt – Abrechnung blockiert.",
    },
    {
      id: neueId(),
      aktenzeichen: "S 4 SB 90/25",
      auftraggeber: "Gericht",
      fach: "Neurologie",
      gutachterKuerzel: "GA-02",
      auftragEingangAm: plusTage(-8),
      terminAm: null,
      fristAm: plusTage(48),
      phase: "Auftragseingang",
      zusatz: [],
      abrechnungsdatenKomplett: false,
      fristverlaengerungen: 0,
      notiz: "Vollständigkeitsprüfung offen.",
    },
    {
      id: neueId(),
      aktenzeichen: "VS-9013/25",
      auftraggeber: "Versicherung",
      fach: "Neuropsychologie",
      gutachterKuerzel: "GA-04",
      auftragEingangAm: plusTage(-61),
      terminAm: plusTage(-40),
      fristAm: plusTage(-5),
      phase: "Versandt",
      zusatz: [],
      abrechnungsdatenKomplett: true,
      fristverlaengerungen: 1,
      notiz: "Rechnungsstellung vorbereitet.",
    },
    {
      id: neueId(),
      aktenzeichen: "BG-2025-0644",
      auftraggeber: "Berufsgenossenschaft",
      fach: "Orthopädie",
      gutachterKuerzel: "GA-05",
      auftragEingangAm: plusTage(-95),
      terminAm: plusTage(-70),
      fristAm: plusTage(-39),
      phase: "Abgerechnet",
      zusatz: [],
      abrechnungsdatenKomplett: true,
      fristverlaengerungen: 0,
      notiz: "",
    },
  ];
}

export function ladeAuftraege(): Auftrag[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedAuftraege();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Auftrag[];
  } catch {
    return seedAuftraege();
  }
}

export function speichereAuftraege(liste: Auftrag[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(liste));
}

export type Kpi = {
  offen: number;
  ueberfaellig: number;
  fristNaht: number;
  ohneTermin: number;
  wartetAufZusatz: number;
  abrechnungBlockiert: number;
  quoteFristtreue: number;
  mittlereLaufzeitWochen: number;
};

export function berechneKpi(liste: Auftrag[]): Kpi {
  const offeneListe = liste.filter((a) => a.phase !== "Versandt" && a.phase !== "Abgerechnet");
  const abgeschlossen = liste.filter((a) => a.phase === "Versandt" || a.phase === "Abgerechnet");
  const fristtreu = abgeschlossen.filter((a) => a.fristverlaengerungen === 0).length;
  const laufzeiten = offeneListe.map((a) => wochenSeit(a.auftragEingangAm));
  return {
    offen: offeneListe.length,
    ueberfaellig: liste.filter((a) => ampel(a) === "rot").length,
    fristNaht: liste.filter((a) => ampel(a) === "gelb").length,
    ohneTermin: offeneListe.filter((a) => !a.terminAm).length,
    wartetAufZusatz: offeneListe.filter((a) => a.zusatz.some((z) => !z.eingegangen)).length,
    abrechnungBlockiert: liste.filter(
      (a) => !a.abrechnungsdatenKomplett && a.phase !== "Abgerechnet",
    ).length,
    quoteFristtreue: abgeschlossen.length
      ? Math.round((fristtreu / abgeschlossen.length) * 100)
      : 100,
    mittlereLaufzeitWochen: laufzeiten.length
      ? Math.round((laufzeiten.reduce((s, w) => s + w, 0) / laufzeiten.length) * 10) / 10
      : 0,
  };
}

export type GutachterStat = {
  kuerzel: string;
  offen: number;
  mittlereLaufzeit: number;
  verlaengerungen: number;
  ueberfaellig: number;
};

export function gutachterStatistik(liste: Auftrag[]): GutachterStat[] {
  const map = new Map<string, Auftrag[]>();
  for (const a of liste) {
    map.set(a.gutachterKuerzel, [...(map.get(a.gutachterKuerzel) ?? []), a]);
  }
  return [...map.entries()]
    .map(([kuerzel, items]) => {
      const offen = items.filter((a) => a.phase !== "Versandt" && a.phase !== "Abgerechnet");
      const laufzeiten = items.map((a) => wochenSeit(a.auftragEingangAm));
      return {
        kuerzel,
        offen: offen.length,
        mittlereLaufzeit:
          Math.round((laufzeiten.reduce((s, w) => s + w, 0) / laufzeiten.length) * 10) / 10,
        verlaengerungen: items.reduce((s, a) => s + a.fristverlaengerungen, 0),
        ueberfaellig: items.filter((a) => ampel(a) === "rot").length,
      };
    })
    .sort((a, b) => b.ueberfaellig - a.ueberfaellig || a.mittlereLaufzeit - b.mittlereLaufzeit);
}
