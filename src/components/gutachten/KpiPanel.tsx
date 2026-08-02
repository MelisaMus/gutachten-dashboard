import { Card } from "@/components/ui/card";
import type { Kpi } from "@/lib/gutachten";
import { cn } from "@/lib/utils";

type Tile = { label: string; value: string; hint: string; tone?: "warn" | "late" | "ok" };

export function KpiPanel({ kpi }: { kpi: Kpi }) {
  const tiles: Tile[] = [
    { label: "Offene Gutachten", value: String(kpi.offen), hint: "aktive Aufträge" },
    {
      label: "Überfällig (>8 Wochen)",
      value: String(kpi.ueberfaellig),
      hint: "Eskalation prüfen",
      tone: "late",
    },
    {
      label: "Frist naht (6–8 Wochen)",
      value: String(kpi.fristNaht),
      hint: "Erinnerung fällig",
      tone: "warn",
    },
    { label: "Ohne Termin", value: String(kpi.ohneTermin), hint: "Slot-Buchung offen" },
    {
      label: "Warten auf Zusatzgutachten",
      value: String(kpi.wartetAufZusatz),
      hint: "parallel beauftragen",
    },
    {
      label: "Abrechnung blockiert",
      value: String(kpi.abrechnungBlockiert),
      hint: "Rechnungsdaten unvollständig",
      tone: "warn",
    },
    {
      label: "Fristtreue",
      value: `${kpi.quoteFristtreue} %`,
      hint: "abgeschlossene Aufträge",
      tone: "ok",
    },
    {
      label: "Ø Laufzeit offen",
      value: `${kpi.mittlereLaufzeitWochen} Wo.`,
      hint: "seit Auftragseingang",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} className="panel gap-0 border-0 p-4 shadow-none">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t.label}
          </p>
          <p
            className={cn(
              "num mt-2 font-display text-3xl font-semibold",
              t.tone === "late" && "text-status-late",
              t.tone === "warn" && "text-status-warn",
              t.tone === "ok" && "text-status-ok",
            )}
          >
            {t.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
        </Card>
      ))}
    </div>
  );
}
