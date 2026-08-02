/**
 * Änderungshistorie der Gutachtenaufträge – ausschließlich serverseitig.
 *
 * Protokolliert Anlage, Änderung und Löschung eines Auftrags mit Zeitstempel,
 * Rolle (admin/team) und IP. Gespeichert werden nur Aktenzeichen, Feldnamen und
 * Feldwerte des Auftrags – keine personenbezogenen Daten.
 */
import { getRequestIP } from "@tanstack/react-start/server";
import type { Auftrag } from "./gutachten";
import type { AuftragPatch, NeuerAuftrag } from "./auftraege.server";

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

function ip(): string | null {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? null;
  } catch {
    return null;
  }
}

function alsText(wert: unknown): string | null {
  if (wert === null || wert === undefined) return null;
  if (typeof wert === "boolean") return wert ? "ja" : "nein";
  if (typeof wert === "number") return String(wert);
  if (typeof wert === "string") return wert.slice(0, 500);
  if (Array.isArray(wert)) {
    const teile = wert.map((z) => {
      const eintrag = z as { fach?: string; eingegangen?: boolean };
      return `${eintrag.fach ?? "?"}${eintrag.eingegangen ? " (eingegangen)" : ""}`;
    });
    return teile.length ? teile.join(", ").slice(0, 500) : "keine";
  }
  return JSON.stringify(wert).slice(0, 500);
}

type Zeile = {
  auftrag_id: string | null;
  aktenzeichen: string;
  aktion: HistorieAktion;
  feld: string | null;
  wert_alt: string | null;
  wert_neu: string | null;
  rolle: string | null;
  ip: string | null;
};

async function schreibe(zeilen: Zeile[]): Promise<void> {
  if (zeilen.length === 0) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("auftrag_historie").insert(zeilen);
  } catch (fehler) {
    console.error("Änderungshistorie konnte nicht geschrieben werden", fehler);
  }
}

export async function protokolliereAnlage(auftrag: Auftrag, rolle: string | null): Promise<void> {
  await schreibe([
    {
      auftrag_id: auftrag.id,
      aktenzeichen: auftrag.aktenzeichen,
      aktion: "angelegt",
      feld: null,
      wert_alt: null,
      wert_neu: `${auftrag.fach} · ${auftrag.auftraggeber} · Gutachter ${auftrag.gutachterKuerzel} · Frist ${auftrag.fristAm}`,
      rolle,
      ip: ip(),
    },
  ]);
}

export async function protokolliereAenderung(
  vorher: Auftrag,
  patch: AuftragPatch,
  rolle: string | null,
): Promise<void> {
  const adresse = ip();
  const zeilen: Zeile[] = [];
  for (const schluessel of Object.keys(patch) as (keyof NeuerAuftrag)[]) {
    const neu = patch[schluessel];
    if (neu === undefined) continue;
    const alt = alsText(vorher[schluessel]);
    const neuText = alsText(neu);
    if (alt === neuText) continue;
    zeilen.push({
      auftrag_id: vorher.id,
      aktenzeichen: vorher.aktenzeichen,
      aktion: "geaendert",
      feld: schluessel,
      wert_alt: alt,
      wert_neu: neuText,
      rolle,
      ip: adresse,
    });
  }
  await schreibe(zeilen);
}

export async function protokolliereLoeschung(
  auftrag: Auftrag,
  rolle: string | null,
): Promise<void> {
  await schreibe([
    {
      auftrag_id: null,
      aktenzeichen: auftrag.aktenzeichen,
      aktion: "geloescht",
      feld: null,
      wert_alt: `Phase ${auftrag.phase} · Frist ${auftrag.fristAm}`,
      wert_neu: null,
      rolle,
      ip: ip(),
    },
  ]);
}


/** Historie eines einzelnen Auftrags (neueste zuerst). */
export async function leseHistorie(auftragId: string, limit = 50): Promise<HistorieEintrag[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("auftrag_historie")
    .select("id, auftrag_id, aktenzeichen, aktion, feld, wert_alt, wert_neu, rolle, ip, created_at")
    .eq("auftrag_id", auftragId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) throw new Error(error.message);
  return (data ?? []) as HistorieEintrag[];
}

/** Gesamte Historie über alle Aufträge (neueste zuerst). */
export async function leseGesamtHistorie(limit = 100): Promise<HistorieEintrag[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("auftrag_historie")
    .select("id, auftrag_id, aktenzeichen, aktion, feld, wert_alt, wert_neu, rolle, ip, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 300));
  if (error) throw new Error(error.message);
  return (data ?? []) as HistorieEintrag[];
}
