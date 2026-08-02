import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeSitePassword, getPasswordChangeHistory } from "@/lib/gate.functions";

const TITEL = "Admin – Passwort ändern | Gutachten-Cockpit";
const BESCHREIBUNG =
  "Interner Admin-Bereich zur Änderung des gemeinsamen Bearbeitungspassworts im Gutachten-Cockpit.";

export const Route = createFileRoute("/admin/passwort")({
  loader: () => getPasswordChangeHistory(),
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
  component: AdminPasswort,
  errorComponent: () => (
    <div className="min-h-screen bg-background px-6 py-10">
      <p role="alert" className="mx-auto max-w-lg text-sm text-destructive">
        Kein Zugriff – bitte als Admin anmelden.
      </p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background px-6 py-10">
      <p className="mx-auto max-w-lg text-sm text-muted-foreground">Seite nicht gefunden.</p>
    </div>
  ),
});

type Zustand =
  | { art: "leer" }
  | { art: "erfolg" }
  | { art: "fehler"; text: string };

type ProtokollEintrag = {
  id: string;
  ereignis: string;
  rolle: string | null;
  ip: string | null;
  created_at: string;
};

const ZEIT = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

function AdminPasswort() {
  const router = useRouter();
  const { eintraege } = Route.useLoaderData();
  const aendern = useServerFn(changeSitePassword);
  const [adminPasswort, setAdminPasswort] = useState("");
  const [neu, setNeu] = useState("");
  const [wiederholung, setWiederholung] = useState("");
  const [zustand, setZustand] = useState<Zustand>({ art: "leer" });
  const [laeuft, setLaeuft] = useState(false);

  const regelnErfuellt =
    neu.length >= 12 && /[A-Za-z]/.test(neu) && /[0-9]/.test(neu) && /[^A-Za-z0-9]/.test(neu);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (neu !== wiederholung) {
      setZustand({ art: "fehler", text: "Die beiden neuen Passwörter stimmen nicht überein." });
      return;
    }
    if (!regelnErfuellt) {
      setZustand({
        art: "fehler",
        text: "Mindestens 12 Zeichen mit Buchstaben, Ziffern und einem Sonderzeichen.",
      });
      return;
    }
    setLaeuft(true);
    try {
      const res = await aendern({ data: { adminPasswort, neuesPasswort: neu } });
      await router.invalidate();
      if (res.ok) {
        setZustand({ art: "erfolg" });
        setAdminPasswort("");
        setNeu("");
        setWiederholung("");
      } else if (res.grund === "admin") {
        setZustand({ art: "fehler", text: "Admin-Passwort ist nicht korrekt." });
      } else {
        setZustand({
          art: "fehler",
          text: "Neues Passwort erfüllt die Anforderungen nicht oder ist unzulässig.",
        });
      }
    } catch {
      setZustand({ art: "fehler", text: "Änderung fehlgeschlagen. Bitte erneut versuchen." });
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <main className="panel mx-auto w-full max-w-lg p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Administration
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold">Bearbeitungspasswort ändern</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Das neue Passwort gilt ab sofort für alle Bearbeitenden. Bereits geöffnete Sitzungen
          bleiben bis zum Ablauf gültig. Das Admin-Passwort selbst bleibt unverändert und ist hier
          nicht änderbar.
        </p>

        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="admin">Admin-Passwort (Bestätigung)</Label>
            <Input
              id="admin"
              type="password"
              autoComplete="current-password"
              value={adminPasswort}
              onChange={(e) => setAdminPasswort(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="neu">Neues Bearbeitungspasswort</Label>
            <Input
              id="neu"
              type="password"
              autoComplete="new-password"
              value={neu}
              onChange={(e) => setNeu(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mindestens 12 Zeichen, mit Buchstaben, Ziffer und Sonderzeichen.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wdh">Neues Passwort wiederholen</Label>
            <Input
              id="wdh"
              type="password"
              autoComplete="new-password"
              value={wiederholung}
              onChange={(e) => setWiederholung(e.target.value)}
            />
          </div>

          {zustand.art === "fehler" && <p className="text-sm text-destructive">{zustand.text}</p>}
          {zustand.art === "erfolg" && (
            <p className="text-sm text-primary">
              Passwort wurde geändert. Bitte den Bearbeitenden das neue Passwort auf sicherem Weg
              mitteilen.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={laeuft || adminPasswort.length === 0 || neu.length === 0}
            >
              {laeuft ? "Speichere …" : "Passwort ändern"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void router.navigate({ to: "/" })}
            >
              Zurück zum Cockpit
            </Button>
          </div>
        </form>

        <section className="mt-8 border-t border-border pt-6">
          <h2 className="font-display text-base font-semibold">Änderungsprotokoll</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Letzte Passwortänderungen mit Zeitpunkt, Rolle, Ergebnis und IP-Adresse.
          </p>
          {eintraege.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Bisher keine Passwortänderung protokolliert.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {(eintraege as ProtokollEintrag[]).map((e) => {
                const erfolg = e.ereignis === "passwort_geaendert";
                return (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium tabular-nums">
                      {ZEIT.format(new Date(e.created_at))}
                    </span>
                    <span className={erfolg ? "text-primary" : "text-destructive"}>
                      {erfolg ? "erfolgreich geändert" : "fehlgeschlagen"}
                    </span>
                    <span className="text-muted-foreground">
                      Rolle: {e.rolle ?? "unbekannt"} · IP: {e.ip ?? "unbekannt"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
