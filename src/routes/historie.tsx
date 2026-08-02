import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getGesamteHistorie } from "@/lib/auftraege.functions";
import {
  AKTION_LABEL,
  FELD_LABEL,
  formatZeitpunkt,
  type HistorieEintrag,
} from "@/lib/historie";

const TITEL = "Änderungshistorie der Aufträge | Gutachten-Cockpit";
const BESCHREIBUNG =
  "Interne Übersicht aller Änderungen an Gutachtenaufträgen mit Zeitpunkt, Feld, altem und neuem Wert – ohne personenbezogene Daten.";

export const Route = createFileRoute("/historie")({
  loader: () => getGesamteHistorie(),
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
  component: HistorieSeite,
  errorComponent: () => (
    <div className="min-h-screen bg-background px-6 py-10">
      <p className="mx-auto max-w-lg text-sm text-destructive">
        Änderungshistorie konnte nicht geladen werden.
      </p>
    </div>
  ),
  notFoundComponent: () => <p className="p-10 text-sm">Nicht gefunden.</p>,
});

function HistorieSeite() {
  const eintraege = Route.useLoaderData() as HistorieEintrag[];

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <main className="panel mx-auto w-full max-w-4xl p-4 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Nachvollziehbarkeit
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold">Änderungshistorie</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Alle Anlagen, Änderungen und Löschungen von Aufträgen (neueste zuerst). Erfasst werden
          Aktenzeichen, Feld, alter und neuer Wert, Rolle und IP – keine personenbezogenen Daten.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">
              Änderungen an Gutachtenaufträgen mit Zeitpunkt, Aktenzeichen, Aktion, Feld, Werten und
              Rolle
            </caption>
            <thead className="text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="py-2 pr-4">
                  Zeitpunkt
                </th>
                <th scope="col" className="py-2 pr-4">
                  Aktenzeichen
                </th>
                <th scope="col" className="py-2 pr-4">
                  Aktion
                </th>
                <th scope="col" className="py-2 pr-4">
                  Feld
                </th>
                <th scope="col" className="py-2 pr-4">
                  Vorher → Nachher
                </th>
                <th scope="col" className="py-2">
                  Rolle / IP
                </th>
              </tr>
            </thead>
            <tbody>
              {eintraege.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-sm text-muted-foreground">
                    Noch keine Änderungen protokolliert.
                  </td>
                </tr>
              )}
              {eintraege.map((e) => (
                <tr key={e.id} className="border-t border-border align-top">
                  <td className="num py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                    {formatZeitpunkt(e.created_at)}
                  </td>
                  <th scope="row" className="num py-2.5 pr-4 text-left font-semibold">
                    {e.aktenzeichen}
                  </th>
                  <td className="py-2.5 pr-4">{AKTION_LABEL[e.aktion] ?? e.aktion}</td>
                  <td className="py-2.5 pr-4">{e.feld ? (FELD_LABEL[e.feld] ?? e.feld) : "–"}</td>
                  <td className="py-2.5 pr-4">
                    {e.wert_alt && <span className="text-muted-foreground">{e.wert_alt}</span>}
                    {e.wert_alt && e.wert_neu && <span aria-hidden="true"> → </span>}
                    {e.wert_neu && <span className="font-medium">{e.wert_neu}</span>}
                    {!e.wert_alt && !e.wert_neu && "–"}
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {e.rolle ?? "unbekannt"}
                    {e.ip ? ` · ${e.ip}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/">Zurück zum Cockpit</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
