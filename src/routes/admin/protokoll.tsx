import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getAuditLog } from "@/lib/gate.functions";
import type { AuditEintrag } from "@/lib/audit.server";

const TITEL = "Admin – Zugriffsprotokoll | Gutachten-Cockpit";
const BESCHREIBUNG =
  "Interner Admin-Bereich: serverseitiges Protokoll der Freischaltungen, Sperrungen und fehlgeschlagenen Passwortversuche.";

export const Route = createFileRoute("/admin/protokoll")({
  loader: () => getAuditLog(),
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
  component: AdminProtokoll,
  errorComponent: () => (
    <div className="min-h-screen bg-background px-6 py-10">
      <p className="mx-auto max-w-lg text-sm text-destructive">
        Protokoll konnte nicht geladen werden.
      </p>
    </div>
  ),
  notFoundComponent: () => <p className="p-10 text-sm">Nicht gefunden.</p>,
});

const LABEL: Record<string, string> = {
  freischaltung: "Freischaltung",
  freischaltung_fehlgeschlagen: "Fehlgeschlagener Passwortversuch",
  sperrung: "Sperrung",
  passwort_geaendert: "Team-Passwort geändert",
  passwort_aenderung_fehlgeschlagen: "Passwortänderung abgelehnt",
};

function istFehler(e: AuditEintrag) {
  return e.ereignis.includes("fehlgeschlagen");
}

function AdminProtokoll() {
  const { eintraege } = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <main className="panel mx-auto w-full max-w-4xl p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Administration
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold">Zugriffsprotokoll</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Serverseitig erfasste Sicherheitsereignisse (letzte 100). Erfasst werden Zeitpunkt,
          Ereignis, Rolle, IP-Adresse und Browserkennung – keine Passwörter und keine
          personenbezogenen Falldaten.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Zeitpunkt</th>
                <th className="py-2 pr-4">Ereignis</th>
                <th className="py-2 pr-4">Rolle</th>
                <th className="py-2 pr-4">IP</th>
                <th className="py-2">Browser</th>
              </tr>
            </thead>
            <tbody>
              {eintraege.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-muted-foreground">
                    Noch keine Einträge.
                  </td>
                </tr>
              )}
              {eintraege.map((e) => (
                <tr key={e.id} className="border-t border-border/60">
                  <td className="py-2 pr-4 whitespace-nowrap tabular-nums">
                    {new Date(e.created_at).toLocaleString("de-DE")}
                  </td>
                  <td className={`py-2 pr-4 ${istFehler(e) ? "text-destructive" : ""}`}>
                    {LABEL[e.ereignis] ?? e.ereignis}
                  </td>
                  <td className="py-2 pr-4">{e.rolle ?? "–"}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{e.ip ?? "–"}</td>
                  <td className="max-w-[18rem] truncate py-2 text-xs text-muted-foreground">
                    {e.user_agent ?? "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => void router.invalidate()}>
            Aktualisieren
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Zurück zum Cockpit</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
