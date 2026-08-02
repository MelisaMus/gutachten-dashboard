/**
 * Datenzugriff auf die zentrale Auftragstabelle – ausschließlich serverseitig
 * und nur nach erfolgreichem Passwort-Gate.
 */
import { requireUnlocked, sessionRolle } from "./gate.server";
import {
  protokolliereAenderung,
  protokolliereAnlage,
  protokolliereLoeschung,
} from "./historie.server";
import type { Auftrag, Fachgebiet, Auftraggeber, Phase, Zusatzgutachten } from "./gutachten";


type Row = {
  id: string;
  aktenzeichen: string;
  auftraggeber: string;
  fach: string;
  gutachter_kuerzel: string;
  auftrag_eingang_am: string;
  termin_am: string | null;
  frist_am: string;
  phase: string;
  zusatz: unknown;
  abrechnungsdaten_komplett: boolean;
  fristverlaengerungen: number;
  notiz: string | null;
};

function toAuftrag(row: Row): Auftrag {
  return {
    id: row.id,
    aktenzeichen: row.aktenzeichen,
    auftraggeber: row.auftraggeber as Auftraggeber,
    fach: row.fach as Fachgebiet,
    gutachterKuerzel: row.gutachter_kuerzel,
    auftragEingangAm: row.auftrag_eingang_am,
    terminAm: row.termin_am,
    fristAm: row.frist_am,
    phase: row.phase as Phase,
    zusatz: (Array.isArray(row.zusatz) ? row.zusatz : []) as Zusatzgutachten[],
    abrechnungsdatenKomplett: row.abrechnungsdaten_komplett,
    fristverlaengerungen: row.fristverlaengerungen,
    notiz: row.notiz ?? "",
  };
}

const SPALTEN =
  "id, aktenzeichen, auftraggeber, fach, gutachter_kuerzel, auftrag_eingang_am, termin_am, frist_am, phase, zusatz, abrechnungsdaten_komplett, fristverlaengerungen, notiz";

async function db() {
  await requireUnlocked();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function listAuftraege(): Promise<Auftrag[]> {
  const client = await db();
  const { data, error } = await client
    .from("auftraege")
    .select(SPALTEN)
    .order("frist_am", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(toAuftrag);
}

export type NeuerAuftrag = Omit<Auftrag, "id">;

export async function createAuftrag(input: NeuerAuftrag): Promise<Auftrag> {
  const client = await db();
  const { data, error } = await client
    .from("auftraege")
    .insert({
      aktenzeichen: input.aktenzeichen,
      auftraggeber: input.auftraggeber,
      fach: input.fach,
      gutachter_kuerzel: input.gutachterKuerzel,
      auftrag_eingang_am: input.auftragEingangAm,
      termin_am: input.terminAm,
      frist_am: input.fristAm,
      phase: input.phase,
      zusatz: input.zusatz,
      abrechnungsdaten_komplett: input.abrechnungsdatenKomplett,
      fristverlaengerungen: input.fristverlaengerungen,
      notiz: input.notiz,
    })
    .select(SPALTEN)
    .single();
  if (error) throw new Error(error.message);
  const auftrag = toAuftrag(data as unknown as Row);
  await protokolliereAnlage(auftrag, await sessionRolle());
  return auftrag;
}

export type AuftragPatch = { [K in keyof NeuerAuftrag]?: NeuerAuftrag[K] | undefined };

export async function updateAuftrag(id: string, patch: AuftragPatch): Promise<Auftrag> {
  const client = await db();
  const row: {
    phase?: string;
    frist_am?: string;
    termin_am?: string | null;
    zusatz?: Zusatzgutachten[];
    fristverlaengerungen?: number;
    abrechnungsdaten_komplett?: boolean;
    notiz?: string;
  } = {};
  if (patch.phase !== undefined) row.phase = patch.phase;
  if (patch.fristAm !== undefined) row.frist_am = patch.fristAm;
  if (patch.terminAm !== undefined) row.termin_am = patch.terminAm;
  if (patch.zusatz !== undefined) row.zusatz = patch.zusatz;
  if (patch.fristverlaengerungen !== undefined)
    row.fristverlaengerungen = patch.fristverlaengerungen;
  if (patch.abrechnungsdatenKomplett !== undefined)
    row.abrechnungsdaten_komplett = patch.abrechnungsdatenKomplett;
  if (patch.notiz !== undefined) row.notiz = patch.notiz;

  const { data: vorherRow, error: leseFehler } = await client
    .from("auftraege")
    .select(SPALTEN)
    .eq("id", id)
    .single();
  if (leseFehler) throw new Error(leseFehler.message);
  const vorher = toAuftrag(vorherRow as unknown as Row);

  const { data, error } = await client
    .from("auftraege")
    .update(row)
    .eq("id", id)
    .select(SPALTEN)
    .single();
  if (error) throw new Error(error.message);
  await protokolliereAenderung(vorher, patch, await sessionRolle());
  return toAuftrag(data as unknown as Row);
}

export async function deleteAuftrag(id: string): Promise<void> {
  const client = await db();
  const { data: vorherRow } = await client.from("auftraege").select(SPALTEN).eq("id", id).single();
  const { error } = await client.from("auftraege").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (vorherRow) {
    await protokolliereLoeschung(toAuftrag(vorherRow as unknown as Row), await sessionRolle());
  }
}

/** Historie eines Auftrags – nur nach Freischaltung. */
export async function historieFuerAuftrag(id: string) {
  await requireUnlocked();
  const { leseHistorie } = await import("./historie.server");
  return leseHistorie(id);
}

/** Gesamte Änderungshistorie – nur nach Freischaltung. */
export async function gesamteHistorie(limit = 150) {
  await requireUnlocked();
  const { leseGesamtHistorie } = await import("./historie.server");
  return leseGesamtHistorie(limit);
}

