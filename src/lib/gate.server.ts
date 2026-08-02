/**
 * Serverseitiges Zugangs-Gate: gemeinsames Passwort für Bearbeitende.
 *
 * Zwei Ebenen:
 *  - Admin-Passwort: liegt ausschließlich als Server-Secret (SITE_PASSWORD) vor,
 *    ist nicht über die Oberfläche änderbar und schaltet den Admin-Bereich frei.
 *  - Team-Passwort: liegt als PBKDF2-Hash in der Datenbank (Tabelle
 *    gate_credentials) und kann von Admins in der Oberfläche geändert werden.
 *    Solange noch kein Hash gesetzt ist, gilt das Admin-Passwort auch als
 *    Team-Passwort.
 *
 * Passwörter verlassen nie den Server; im Browser liegt nur ein verschlüsseltes
 * httpOnly-Session-Cookie.
 */
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";
import { protokolliere } from "./audit.server";

export type GateSession = {
  unlocked?: boolean;
  admin?: boolean;
  /** Zeitpunkt der Freischaltung (ms) – begrenzt die absolute Sitzungsdauer. */
  begonnen?: number;
  /** Letzte Aktivität (ms) – Basis für die gleitende Verlängerung. */
  gesehen?: number;
};

/** Sitzungsgrenzen in Sekunden: Inaktivität (gleitend) und absolutes Maximum. */
const LIMITS = {
  admin: { idle: 15 * 60, absolut: 2 * 60 * 60 },
  team: { idle: 60 * 60, absolut: 8 * 60 * 60 },
} as const;

const ITERATIONS = 210_000;

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET ist nicht konfiguriert");
  return {
    password,
    name: "gutachten-gate",
    // Harte Obergrenze des Cookies; die feinere Steuerung erfolgt unten über
    // Inaktivitäts- und Absolutgrenzen je Rolle.
    maxAge: LIMITS.team.absolut,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "strict" as const,
      path: "/",
    },
  };
}

/**
 * Liest die Sitzung, prüft Inaktivitäts- und Absolutgrenze und verlängert bei
 * gültiger Sitzung den Inaktivitätszeitraum (Sliding Expiration).
 */
async function activeSession(): Promise<GateSession> {
  const session = await useSession<GateSession>(sessionConfig());
  const daten = session.data;
  if (daten.unlocked !== true) return {};

  const rolle = daten.admin === true ? "admin" : "team";
  const grenzen = LIMITS[rolle];
  const jetzt = Date.now();
  const begonnen = daten.begonnen ?? jetzt;
  const gesehen = daten.gesehen ?? jetzt;

  const abgelaufen =
    jetzt - gesehen > grenzen.idle * 1000 || jetzt - begonnen > grenzen.absolut * 1000;

  if (abgelaufen) {
    await session.clear();
    await protokolliere("sperrung", rolle);
    return {};
  }

  // Gleitende Verlängerung: nur schreiben, wenn sich der Wert merklich ändert.
  if (jetzt - gesehen > 60_000) {
    await session.update({ ...daten, begonnen, gesehen: jetzt });
  }
  return { ...daten, begonnen, gesehen: jetzt };
}

/** Längenunabhängiger, zeitkonstanter Vergleich über SHA-256-Digests. */
function constantTimeEquals(a: string, b: string): boolean {
  const x = createHash("sha256").update(a, "utf8").digest();
  const y = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(x, y);
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2Hex(password: string, saltHex: string, iterations: number): Promise<string> {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g) ?? [], (h) => parseInt(h, 16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

function adminPassword(): string {
  const expected = process.env["SITE_PASSWORD"];
  if (!expected) throw new Error("SITE_PASSWORD ist nicht konfiguriert");
  return expected.trim();
}

type CredentialRow = { id: string; password_hash: string; salt: string; iterations: number };

async function loadCredential(): Promise<CredentialRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("gate_credentials")
    .select("id, password_hash, salt, iterations")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CredentialRow | null) ?? null;
}

async function storeCredential(password: string): Promise<void> {
  const saltHex = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = await pbkdf2Hex(password, saltHex, ITERATIONS);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const existing = await loadCredential();
  if (existing) {
    const { error } = await supabaseAdmin
      .from("gate_credentials")
      .update({ password_hash: hash, salt: saltHex, iterations: ITERATIONS })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabaseAdmin
    .from("gate_credentials")
    .insert({ password_hash: hash, salt: saltHex, iterations: ITERATIONS });
  if (error) throw new Error(error.message);
}

async function teamPasswordMatches(password: string): Promise<boolean> {
  const credential = await loadCredential();
  if (!credential) return constantTimeEquals(password, adminPassword());
  const hash = await pbkdf2Hex(password, credential.salt, credential.iterations);
  return constantTimeEquals(hash, credential.password_hash);
}

export async function unlock(password: string): Promise<boolean> {
  const eingabe = password.trim();
  const istAdmin = constantTimeEquals(eingabe, adminPassword());
  if (!istAdmin && !(await teamPasswordMatches(eingabe))) {
    await protokolliere("freischaltung_fehlgeschlagen");
    return false;
  }
  const session = await useSession<GateSession>(sessionConfig());
  const jetzt = Date.now();
  await session.clear();
  await session.update({ unlocked: true, admin: istAdmin, begonnen: jetzt, gesehen: jetzt });
  await protokolliere("freischaltung", istAdmin ? "admin" : "team");
  return true;
}

export async function lock(): Promise<void> {
  const session = await useSession<GateSession>(sessionConfig());
  const rolle = session.data.admin === true ? "admin" : "team";
  await session.clear();
  await protokolliere("sperrung", rolle);
}

export async function isUnlocked(): Promise<boolean> {
  return (await activeSession()).unlocked === true;
}

export async function isAdmin(): Promise<boolean> {
  const daten = await activeSession();
  return daten.unlocked === true && daten.admin === true;
}

/** Wirft eine Weiterleitung auf /unlock, bevor geschützte Daten gelesen werden. */
export async function requireUnlocked(): Promise<void> {
  if (!(await isUnlocked())) throw redirect({ to: "/unlock" });
}

/** Nur Admins (Anmeldung mit Admin-Passwort) dürfen weiter. */
export async function requireAdmin(): Promise<void> {
  await requireUnlocked();
  if (!(await isAdmin())) throw redirect({ to: "/" });
}

/**
 * Ändert das Team-Passwort. Erfordert eine aktive Admin-Session und zusätzlich
 * die erneute Eingabe des Admin-Passworts.
 */
export async function changeTeamPassword(
  adminEingabe: string,
  neuesPasswort: string,
): Promise<{ ok: true } | { ok: false; grund: "admin" | "policy" }> {
  await requireAdmin();
  if (!constantTimeEquals(adminEingabe.trim(), adminPassword())) {
    await protokolliere("passwort_aenderung_fehlgeschlagen", "admin");
    return { ok: false, grund: "admin" };
  }
  const neu = neuesPasswort.trim();
  const stark =
    neu.length >= 12 && /[A-Za-z]/.test(neu) && /[0-9]/.test(neu) && /[^A-Za-z0-9]/.test(neu);
  if (!stark || constantTimeEquals(neu, adminPassword())) {
    await protokolliere("passwort_aenderung_fehlgeschlagen", "admin");
    return { ok: false, grund: "policy" };
  }
  await storeCredential(neu);
  await protokolliere("passwort_geaendert", "admin");
  return { ok: true };
}
