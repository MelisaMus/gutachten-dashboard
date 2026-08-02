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

export type GateSession = { unlocked?: boolean; admin?: boolean };

const ITERATIONS = 210_000;

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET ist nicht konfiguriert");
  return {
    password,
    name: "gutachten-gate",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
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
  if (!istAdmin && !(await teamPasswordMatches(eingabe))) return false;
  const session = await useSession<GateSession>(sessionConfig());
  await session.update({ unlocked: true, admin: istAdmin });
  return true;
}

export async function lock(): Promise<void> {
  const session = await useSession<GateSession>(sessionConfig());
  await session.clear();
}

export async function isUnlocked(): Promise<boolean> {
  const session = await useSession<GateSession>(sessionConfig());
  return session.data.unlocked === true;
}

export async function isAdmin(): Promise<boolean> {
  const session = await useSession<GateSession>(sessionConfig());
  return session.data.unlocked === true && session.data.admin === true;
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
    return { ok: false, grund: "admin" };
  }
  const neu = neuesPasswort.trim();
  const stark =
    neu.length >= 12 && /[A-Za-z]/.test(neu) && /[0-9]/.test(neu) && /[^A-Za-z0-9]/.test(neu);
  if (!stark || constantTimeEquals(neu, adminPassword())) return { ok: false, grund: "policy" };
  await storeCredential(neu);
  return { ok: true };
}
