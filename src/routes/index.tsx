import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { KpiPanel } from "@/components/gutachten/KpiPanel";
import { AuftragListe } from "@/components/gutachten/AuftragListe";
import { GutachterPanel } from "@/components/gutachten/GutachterPanel";
import { NeuerAuftragDialog } from "@/components/gutachten/NeuerAuftragDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ampel,
  berechneKpi,
  ladeAuftraege,
  speichereAuftraege,
  type Auftrag,
  type Phase,
} from "@/lib/gutachten";

const TITEL = "Gutachten-Cockpit – Fristen & Auftragssteuerung";
const BESCHREIBUNG =
  "Dashboard zur Nachverfolgung medizinischer Gutachtenaufträge: Fristen-Ampel, Terminstatus, Zusatzgutachten und Kennzahlen – ohne personenbezogene Daten.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITEL },
      { name: "description", content: BESCHREIBUNG },
      { property: "og:title", content: TITEL },
      { property: "og:description", content: BESCHREIBUNG },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [auftraege, setAuftraege] = useState<Auftrag[]>([]);
  const [suche, setSuche] = useState("");
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setAuftraege(ladeAuftraege());
    setGeladen(true);
  }, []);

  useEffect(() => {
    if (geladen) speichereAuftraege(auftraege);
  }, [auftraege, geladen]);

  const update = (id: string, patch: Partial<Auftrag>) =>
    setAuftraege((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

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
    onDelete: (id: string) => setAuftraege((prev) => prev.filter((a) => a.id !== id)),
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Gutachtenwesen
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Gutachten-Cockpit</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Fristenüberwachung, Terminstatus und Abrechnungsreife auf einen Blick – geführt
              ausschließlich über Aktenzeichen und pseudonyme Gutachterkürzel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Aktenzeichen, Fach, Kürzel …"
              className="w-56 bg-background"
            />
            <NeuerAuftragDialog onCreate={(a) => setAuftraege((prev) => [a, ...prev])} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <section aria-label="Kennzahlen">
          <KpiPanel kpi={kpi} />
        </section>

        <section className="panel p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Fristenübersicht</h2>
            <p className="text-xs text-muted-foreground">
              Standardfrist 8 Wochen · Erinnerung nach 6 · persönliche Erinnerung nach 8 ·
              Eskalation nach 10 Wochen
            </p>
          </div>

          <Tabs defaultValue="alle" className="mt-4">
            <TabsList>
              <TabsTrigger value="alle">Alle ({gruppen.alle.length})</TabsTrigger>
              <TabsTrigger value="rot">Überfällig ({gruppen.rot.length})</TabsTrigger>
              <TabsTrigger value="gelb">Frist naht ({gruppen.gelb.length})</TabsTrigger>
              <TabsTrigger value="gruen">Im Plan ({gruppen.gruen.length})</TabsTrigger>
              <TabsTrigger value="fertig">Abgeschlossen ({gruppen.fertig.length})</TabsTrigger>
            </TabsList>
            {(["alle", "rot", "gelb", "gruen", "fertig"] as const).map((key) => (
              <TabsContent key={key} value={key} className="mt-4">
                <AuftragListe auftraege={gruppen[key]} {...handlers} />
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <GutachterPanel auftraege={auftraege} />

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Datenschutz-Prinzip</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>Keine Namen, Geburtsdaten, Adressen oder Diagnosen – nur Aktenzeichen.</li>
            <li>Gutachter erscheinen ausschließlich als pseudonymes Kürzel (z. B. GA-04).</li>
            <li>Gespeichert werden nur Termine, Fristen, Phase und Prozessmerkmale.</li>
            <li>Daten liegen lokal im Browser dieses Arbeitsplatzes.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
