import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { KpiPanel } from "@/components/gutachten/KpiPanel";
import { AuftragListe } from "@/components/gutachten/AuftragListe";
import { GutachterPanel } from "@/components/gutachten/GutachterPanel";
import { NeuerAuftragDialog } from "@/components/gutachten/NeuerAuftragDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAuftraege, addAuftrag, patchAuftrag, removeAuftrag } from "@/lib/auftraege.functions";
import { lockSite, getGateStatus } from "@/lib/gate.functions";
import { ampel, berechneKpi, type Auftrag, type Phase } from "@/lib/gutachten";

const TITEL = "Gutachten-Cockpit – Fristen & Auftragssteuerung";
const BESCHREIBUNG =
  "Interner Arbeitsbereich zur Nachverfolgung medizinischer Gutachtenaufträge: Fristen-Ampel, Terminstatus, Zusatzgutachten und Kennzahlen – ohne personenbezogene Daten.";

export const Route = createFileRoute("/")({
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
  loader: async () => ({ auftraege: await getAuftraege(), gate: await getGateStatus() }),
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">
        Die Aufträge konnten nicht geladen werden. Bitte Seite neu laden.
      </p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">Nicht gefunden.</p>
    </div>
  ),
  component: Dashboard,
});

function Dashboard() {
  const router = useRouter();
  const { auftraege: geladene, gate } = Route.useLoaderData();
  const [auftraege, setAuftraege] = useState<Auftrag[]>(geladene);
  const [suche, setSuche] = useState("");

  const create = useServerFn(addAuftrag);
  const patch = useServerFn(patchAuftrag);
  const remove = useServerFn(removeAuftrag);
  const abmelden = useServerFn(lockSite);

  useEffect(() => {
    setAuftraege(geladene);
  }, [geladene]);

  const update = (id: string, patchData: Partial<Auftrag>) => {
    setAuftraege((prev) => prev.map((a) => (a.id === id ? { ...a, ...patchData } : a)));
    void patch({ data: { id, patch: patchData } });
  };

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    const liste = q
      ? auftraege.filter(
          (a) =>
            a.aktenzeichen.toLowerCase().includes(q) ||
            a.gutachterKuerzel.toLowerCase().includes(q) ||
            a.fach.toLowerCase().includes(q) ||
            a.auftraggeber.toLowerCase().includes(q),
        )
      : auftraege;
    return [...liste].sort((a, b) => a.fristAm.localeCompare(b.fristAm));
  }, [auftraege, suche]);

  const kpi = useMemo(() => berechneKpi(auftraege), [auftraege]);

  const gruppen = {
    alle: gefiltert,
    rot: gefiltert.filter((a) => ampel(a) === "rot"),
    gelb: gefiltert.filter((a) => ampel(a) === "gelb"),
    gruen: gefiltert.filter((a) => ampel(a) === "gruen"),
    fertig: gefiltert.filter((a) => ampel(a) === "fertig"),
  };

  const handlers = {
    onPhase: (id: string, phase: Phase) => update(id, { phase }),
    onVerlaengerung: (id: string) => {
      const a = auftraege.find((x) => x.id === id);
      if (!a) return;
      const neu = new Date(new Date(a.fristAm + "T00:00:00").getTime() + 28 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      update(id, { fristAm: neu, fristverlaengerungen: a.fristverlaengerungen + 1 });
    },
    onZusatzEingang: (id: string, fach: string) => {
      const a = auftraege.find((x) => x.id === id);
      if (!a) return;
      update(id, {
        zusatz: a.zusatz.map((z) => (z.fach === fach ? { ...z, eingegangen: true } : z)),
      });
    },
    onAbrechnung: (id: string) => update(id, { abrechnungsdatenKomplett: true }),
    onDelete: (id: string) => {
      setAuftraege((prev) => prev.filter((a) => a.id !== id));
      void remove({ data: { id } });
    },
  };

  const anlegen = async (a: Auftrag) => {
    const { id: _ignoriert, ...rest } = a;
    const gespeichert = await create({ data: rest });
    setAuftraege((prev) => [gespeichert, ...prev]);
  };

  const sperren = async () => {
    await abmelden({});
    await router.navigate({ to: "/unlock", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Gutachtenwesen
            </p>
            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Gutachten-Cockpit</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Fristenüberwachung, Terminstatus und Abrechnungsreife auf einen Blick – geführt
              ausschließlich über Aktenzeichen und pseudonyme Gutachterkürzel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Input
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Aktenzeichen, Fach, Kürzel …"
              aria-label="Aufträge durchsuchen"
              className="w-full bg-background sm:w-56"
            />
            <NeuerAuftragDialog onCreate={(a) => void anlegen(a)} />
            {gate.admin && (
              <>
                <Button variant="outline" asChild>
                  <Link to="/admin/passwort">Passwort ändern</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin/protokoll">Protokoll</Link>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => void sperren()}
              aria-label="Sitzung sperren und abmelden"
            >
              Sperren
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section aria-label="Kennzahlen">
          <KpiPanel kpi={kpi} />
        </section>

        <section className="panel p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Fristenübersicht</h2>
            <p className="text-xs text-muted-foreground">
              Standardfrist 8 Wochen · Erinnerung nach 6 · persönliche Erinnerung nach 8 ·
              Eskalation nach 10 Wochen
            </p>
          </div>

          <Tabs defaultValue="alle" className="mt-4">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <TabsList className="w-max">
                <TabsTrigger value="alle">Alle ({gruppen.alle.length})</TabsTrigger>
                <TabsTrigger value="rot">Überfällig ({gruppen.rot.length})</TabsTrigger>
                <TabsTrigger value="gelb">Frist naht ({gruppen.gelb.length})</TabsTrigger>
                <TabsTrigger value="gruen">Im Plan ({gruppen.gruen.length})</TabsTrigger>
                <TabsTrigger value="fertig">Abgeschlossen ({gruppen.fertig.length})</TabsTrigger>
              </TabsList>
            </div>
            {(["alle", "rot", "gelb", "gruen", "fertig"] as const).map((key) => (
              <TabsContent key={key} value={key} className="mt-4">
                <AuftragListe auftraege={gruppen[key]} {...handlers} />
              </TabsContent>
            ))}
          </Tabs>
        </section>


        <GutachterPanel auftraege={auftraege} />

        <section className="panel p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold">Datenschutz & Zugriff</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>Zugang nur mit dem gemeinsamen Bearbeitungspasswort – nicht öffentlich sichtbar.</li>
            <li>Keine Namen, Geburtsdaten, Adressen oder Diagnosen – nur Aktenzeichen.</li>
            <li>Gutachter erscheinen ausschließlich als pseudonymes Kürzel (z. B. GA-04).</li>
            <li>Daten liegen zentral in der Cloud, erreichbar nur über geschützte Serverfunktionen.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
