/**
 * Serverseitiges Zugangs-Gate: gemeinsames Passwort für Bearbeitende.
 * Das Passwort verlässt nie den Server; im Browser liegt nur ein
 * verschlüsseltes Session-Cookie.
 */
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

export type GateSession = { unlocked?: boolean };

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
function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function unlock(password: string): Promise<boolean> {
  const expected = process.env["SITE_PASSWORD"];
  if (!expected) throw new Error("SITE_PASSWORD ist nicht konfiguriert");
  if (!passwordMatches(password.trim(), expected.trim())) return false;
  const session = await useSession<GateSession>(sessionConfig());
  await session.update({ unlocked: true });
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

/** Wirft eine Weiterleitung auf /unlock, bevor geschützte Daten gelesen werden. */
export async function requireUnlocked(): Promise<void> {
  if (!(await isUnlocked())) throw redirect({ to: "/unlock" });
}
