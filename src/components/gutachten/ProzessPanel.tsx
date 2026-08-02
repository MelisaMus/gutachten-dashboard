import { ENGPASS_LABEL, prozessKpi, type Auftrag, type EngpassStatus } from "@/lib/gutachten";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<EngpassStatus, { klasse: string; glyph: string }> = {
  ok: { klasse: "bg-[var(--ok-soft,theme(colors.muted))] text-foreground", glyph: "✓" },
  beobachten: { klasse: "bg-amber-500/15 text-amber-700 dark:text-amber-300", glyph: "▲" },
  engpass: { klasse: "bg-destructive/15 text-destructive", glyph: "■" },
};

function StatusBadge({ status }: { status: EngpassStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.klasse,
      )}
      aria-label={`Engpass-Status: ${ENGPASS_LABEL[status]}`}
    >
      <span aria-hidden="true">{s.glyph}</span>
      {ENGPASS_LABEL[status]}
    </span>
  );
}

export function ProzessPanel({ auftraege }: { auftraege: Auftrag[] }) {
  const kpi = prozessKpi(auftraege);

  return (
    <section className="panel p-4 sm:p-5" aria-label="Prozess-Kennzahlen">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Durchlaufzeiten & Engpässe</h2>
        <p className="text-xs text-muted-foreground">
          Laufzeit = Wochen seit Auftragseingang · Standardfrist 8 Wochen
        </p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Median-Laufzeit offen",
            value: `${kpi.medianLaufzeitWochen} Wo.`,
            hint: "Hälfte der offenen Aufträge darunter",
          },
          {
            label: "90 % erreicht in",
            value: `${kpi.p90LaufzeitWochen} Wo.`,
            hint: "Langläufer-Indikator",
          },
          {
            label: "Über Standardfrist",
            value: `${kpi.quoteUeberStandardfrist} %`,
            hint: "offene Aufträge älter als 8 Wochen",
          },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-card/60 p-3">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{k.label}</dt>
            <dd className="num mt-1 text-2xl font-semibold">{k.value}</dd>
            <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
          </div>
        ))}
      </dl>

      {kpi.engpassSchritte.length > 0 && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Engpass in: {kpi.engpassSchritte.join(", ")} – Kapazität oder Erinnerungen prüfen.
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">
            Kennzahlen je Prozessschritt: Anzahl, Anteil, Überfälligkeiten, Laufzeiten und
            Engpass-Status
          </caption>
          <thead className="text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="py-2 pr-4">
                Prozessschritt
              </th>
              <th scope="col" className="py-2 pr-4">
                Aufträge
              </th>
              <th scope="col" className="py-2 pr-4">
                Anteil offen
              </th>
              <th scope="col" className="py-2 pr-4">
                Überfällig
              </th>
              <th scope="col" className="py-2 pr-4">
                Frist naht
              </th>
              <th scope="col" className="py-2 pr-4">
                Laufzeit ø / max
              </th>
              <th scope="col" className="py-2">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {kpi.schritte.map((s) => (
              <tr key={s.phase} className="border-t border-border">
                <th scope="row" className="py-2.5 pr-4 text-left font-semibold">
                  {s.phase}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {s.hinweis}
                  </span>
                </th>
                <td className="num py-2.5 pr-4">{s.anzahl}</td>
                <td className="num py-2.5 pr-4">{s.anteilOffen ? `${s.anteilOffen} %` : "–"}</td>
                <td
                  className={cn(
                    "num py-2.5 pr-4",
                    s.ueberfaellig > 0 && "font-semibold text-destructive",
                  )}
                >
                  {s.ueberfaellig}
                </td>
                <td className="num py-2.5 pr-4">{s.fristNaht}</td>
                <td className="num py-2.5 pr-4 whitespace-nowrap">
                  {s.mittlereLaufzeitWochen} / {s.maxLaufzeitWochen} Wo.
                </td>
                <td className="py-2.5">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
