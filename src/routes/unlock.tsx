import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockSite } from "@/lib/gate.functions";

const TITEL = "Zugang – Gutachten-Cockpit";
const BESCHREIBUNG =
  "Geschützter Zugang zum Gutachten-Cockpit. Der Bereich ist ausschließlich für Bearbeitende freigegeben.";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: TITEL },
      { name: "description", content: BESCHREIBUNG },
      { property: "og:title", content: TITEL },
      { property: "og:description", content: BESCHREIBUNG },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Unlock,
});

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [meldung, setMeldung] = useState<string | null>(null);
  const [gesperrt, setGesperrt] = useState(false);
  const [laeuft, setLaeuft] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLaeuft(true);
    setMeldung(null);
    try {
      const ergebnis = await unlock({ data: { password } });
      if (ergebnis.ok) {
        await router.navigate({ to: "/", replace: true });
        router.invalidate();
        return;
      }
      if (ergebnis.grund === "gesperrt") {
        const minuten = Math.max(1, Math.ceil(ergebnis.sekunden / 60));
        setGesperrt(true);
        setMeldung(
          `Zu viele Fehlversuche. Die Anmeldung ist für ca. ${minuten} Minute(n) gesperrt. Der Vorgang wurde protokolliert.`,
        );
        return;
      }
      setGesperrt(false);
      setMeldung(
        `Passwort ist nicht korrekt. Noch ${ergebnis.verbleibendeVersuche} Versuch(e) vor einer befristeten Sperre.`,
      );
    } catch {
      setGesperrt(false);
      setMeldung("Passwort ist nicht korrekt.");
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <main className="panel w-full max-w-sm p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Gutachtenwesen
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold">Zugang für Bearbeitende</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dieser Arbeitsbereich ist nicht öffentlich. Bitte das gemeinsame Bearbeitungspasswort
          eingeben.
        </p>

        <form onSubmit={submit} className="mt-5 grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="pw">Passwort</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={gesperrt}
            />
          </div>
          {meldung && (
            <p className="text-sm text-destructive" role="alert">
              {meldung}
            </p>
          )}
          <Button type="submit" disabled={laeuft || gesperrt || password.length === 0}>
            {laeuft ? "Prüfe …" : "Cockpit öffnen"}
          </Button>
        </form>
      </main>
    </div>
  );
}
