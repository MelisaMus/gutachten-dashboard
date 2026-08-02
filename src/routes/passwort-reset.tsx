import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkPasswordResetGrant, redeemPasswordResetGrant } from "@/lib/gate.functions";

const TITEL = "Bearbeitungspasswort neu setzen | Gutachten-Cockpit";
const BESCHREIBUNG =
  "Zeitlich begrenzte Freigabe zum Setzen eines neuen gemeinsamen Bearbeitungspassworts im Gutachten-Cockpit.";

export const Route = createFileRoute("/passwort-reset")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  loaderDeps: ({ search: { token } }) => ({ token }),
  loader: ({ deps }) =>
    deps.token
      ? checkPasswordResetGrant({ data: { token: deps.token } })
      : Promise.resolve({ gueltig: false as const }),
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
  component: PasswortReset,
  errorComponent: () => (
    <div className="min-h-screen bg-background px-6 py-10">
      <p role="alert" className="mx-auto max-w-md text-sm text-destructive">
        Die Freigabe konnte nicht geprüft werden.
      </p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background px-6 py-10">
      <p className="mx-auto max-w-md text-sm text-muted-foreground">Seite nicht gefunden.</p>
    </div>
  ),
});

const ZEIT = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

function PasswortReset() {
  const router = useRouter();
  const { token } = Route.useSearch();
  const status = Route.useLoaderData() as { gueltig: boolean; gueltigBis?: string };
  const einloesen = useServerFn(redeemPasswordResetGrant);
  const [neu, setNeu] = useState("");
  const [wiederholung, setWiederholung] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState(false);
  const [laeuft, setLaeuft] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFehler(null);
    if (neu !== wiederholung) {
      setFehler("Die beiden Passwörter stimmen nicht überein.");
      return;
    }
    setLaeuft(true);
    try {
      const res = await einloesen({ data: { token, neuesPasswort: neu } });
      if (res.ok) {
        setErfolg(true);
        setNeu("");
        setWiederholung("");
      } else if (res.grund === "token") {
        setFehler("Die Freigabe ist abgelaufen, bereits verwendet oder ungültig.");
      } else {
        setFehler("Mindestens 12 Zeichen mit Buchstaben, Ziffern und einem Sonderzeichen.");
      }
    } catch {
      setFehler("Setzen des Passworts fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <main className="panel w-full max-w-md p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Freigabe
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold">
          Bearbeitungspasswort neu setzen
        </h1>

        {!status.gueltig && !erfolg && (
          <p className="mt-3 text-sm text-destructive">
            Diese Freigabe ist ungültig, abgelaufen oder bereits verwendet. Bitte eine neue
            Freigabe bei einer administrierenden Person anfordern.
          </p>
        )}

        {status.gueltig && !erfolg && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Freigabe gültig bis {ZEIT.format(new Date(status.gueltigBis!))}. Sie kann nur einmal
              verwendet werden und ändert ausschließlich das gemeinsame Bearbeitungspasswort.
            </p>
            <form onSubmit={submit} className="mt-5 grid gap-4">
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
                <Label htmlFor="wdh">Passwort wiederholen</Label>
                <Input
                  id="wdh"
                  type="password"
                  autoComplete="new-password"
                  value={wiederholung}
                  onChange={(e) => setWiederholung(e.target.value)}
                />
              </div>
              {fehler && <p className="text-sm text-destructive">{fehler}</p>}
              <Button type="submit" disabled={laeuft || neu.length === 0}>
                {laeuft ? "Speichere …" : "Passwort setzen"}
              </Button>
            </form>
          </>
        )}

        {erfolg && (
          <p className="mt-3 text-sm text-primary">
            Das neue Bearbeitungspasswort ist gesetzt. Die Freigabe ist damit verbraucht.
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => void router.navigate({ to: "/unlock" })}
        >
          Zur Anmeldung
        </Button>
      </main>
    </div>
  );
}
