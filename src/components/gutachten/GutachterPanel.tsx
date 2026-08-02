import { gutachterStatistik, type Auftrag } from "@/lib/gutachten";
import { cn } from "@/lib/utils";

export function GutachterPanel({ auftraege }: { auftraege: Auftrag[] }) {
  const stats = gutachterStatistik(auftraege);

  return (
    <section className="panel p-5">
      <h2 className="font-display text-lg font-semibold">Gutachter-Kennzahlen</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Grundlage für priorisierte Auftragsvergabe und jährliches Feedback – rein pseudonym.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="pb-2 font-medium">Kürzel</th>
              <th className="pb-2 font-medium">Offen</th>
              <th className="pb-2 font-medium">Ø Laufzeit</th>
              <th className="pb-2 font-medium">Verläng.</th>
              <th className="pb-2 font-medium">Überfällig</th>
              <th className="pb-2 font-medium">Vergabe-Empfehlung</th>
            </tr>
          </thead>
          <tbody className="num">
            {stats.map((s) => {
              const empfehlung =
                s.ueberfaellig > 0 || s.mittlereLaufzeit > 10
                  ? { label: "Weniger Aufträge", tone: "text-status-late" }
                  : s.mittlereLaufzeit > 6
                    ? { label: "Normal", tone: "text-status-warn" }
                    : { label: "Priorisieren", tone: "text-status-ok" };
              return (
                <tr key={s.kuerzel} className="border-t border-border">
                  <td className="py-2.5 font-semibold">{s.kuerzel}</td>
                  <td className="py-2.5">{s.offen}</td>
                  <td className="py-2.5">{s.mittlereLaufzeit} Wo.</td>
                  <td className="py-2.5">{s.verlaengerungen}</td>
                  <td className="py-2.5">{s.ueberfaellig}</td>
                  <td className={cn("py-2.5 font-medium", empfehlung.tone)}>{empfehlung.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
