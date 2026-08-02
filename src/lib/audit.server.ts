/**
 * Serverseitiges Sicherheitsprotokoll (Audit-Log).
 *
 * Protokolliert Freischaltungen, Sperrungen, fehlgeschlagene Passwortversuche
 * und Passwortänderungen mit Zeitstempel, IP-Adresse und User-Agent.
 * Es werden keine Passwörter und keine personenbezogenen Falldaten gespeichert.
 * Die Tabelle ist nur über den Server erreichbar (RLS ohne Policies).
 */
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

export type AuditEreignis =
  | "freischaltung"
  | "freischaltung_fehlgeschlagen"
  | "sperrung"
  | "passwort_geaendert"
  | "passwort_aenderung_fehlgeschlagen"
  | "reset_freigabe_erstellt"
  | "reset_freigabe_eingeloest"
  | "reset_freigabe_fehlgeschlagen";

export type AuditRolle = "admin" | "team" | null;

export type AuditEintrag = {
  id: string;
  ereignis: AuditEreignis;
  rolle: AuditRolle;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

function requestKontext(): { ip: string | null; userAgent: string | null } {
  try {
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;
    return { ip, userAgent: userAgent ? userAgent.slice(0, 300) : null };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/** Schreibt einen Protokolleintrag; Fehler dürfen den Ablauf nie blockieren. */
export async function protokolliere(ereignis: AuditEreignis, rolle: AuditRolle = null): Promise<void> {
  try {
    const { ip, userAgent } = requestKontext();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("zugriff_protokoll")
      .insert({ ereignis, rolle, ip, user_agent: userAgent });
  } catch (fehler) {
    console.error("Audit-Log konnte nicht geschrieben werden", fehler);
  }
}

/** Liest die letzten Protokolleinträge (nur für Admins aufrufen). */
export async function leseProtokoll(limit = 100): Promise<AuditEintrag[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("zugriff_protokoll")
    .select("id, ereignis, rolle, ip, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditEintrag[];
}

/** Liest nur die Passwortänderungs-Ereignisse (Erfolg und Misserfolg). */
export async function lesePasswortHistorie(limit = 20): Promise<AuditEintrag[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("zugriff_protokoll")
    .select("id, ereignis, rolle, ip, user_agent, created_at")
    .in("ereignis", ["passwort_geaendert", "passwort_aenderung_fehlgeschlagen"])
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditEintrag[];
}
