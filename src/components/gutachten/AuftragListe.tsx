import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "./StatusPill";
import {
  PHASEN,
  eskalation,
  formatDatum,
  tageBis,
  wochenSeit,
  type Auftrag,
  type Phase,
} from "@/lib/gutachten";
import { cn } from "@/lib/utils";

type Props = {
  auftraege: Auftrag[];
  onPhase: (id: string, phase: Phase) => void;
  onVerlaengerung: (id: string) => void;
  onZusatzEingang: (id: string, fach: string) => void;
  onAbrechnung: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AuftragListe({
  auftraege,
  onPhase,
  onVerlaengerung,
  onZusatzEingang,
  onAbrechnung,
  onDelete,
}: Props) {
  if (auftraege.length === 0) {
    return (
      <div className="panel p-10 text-center text-sm text-muted-foreground">
        Keine Aufträge in dieser Ansicht.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {auftraege.map((a) => {
        const rest = tageBis(a.fristAm);
        const hinweis = eskalation(a);
        return (
          <article key={a.id} className="panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="num font-display text-lg font-semibold">{a.aktenzeichen}</h3>
                  <StatusPill auftrag={a} />
                  <Badge variant="secondary">{a.auftraggeber}</Badge>
                  <Badge variant="outline">{a.fach}</Badge>
                  <Badge variant="outline">Gutachter {a.gutachterKuerzel}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Eingang {formatDatum(a.auftragEingangAm)} · Laufzeit{" "}
                  {wochenSeit(a.auftragEingangAm)} Wochen · Termin {formatDatum(a.terminAm)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Fällig am</p>
                <p className="num font-display text-lg font-semibold">{formatDatum(a.fristAm)}</p>
                {a.phase === "Versandt" || a.phase === "Abgerechnet" ? (
                  <p className="text-xs font-medium text-muted-foreground">Frist erledigt</p>
                ) : (
                  <p
                    className={cn(
                      "num text-xs font-medium",
                      rest < 0
                        ? "text-status-late"
                        : rest <= 14
                          ? "text-status-warn"
                          : "text-muted-foreground",
                    )}
                  >
                    {rest < 0 ? `${Math.abs(rest)} Tage überfällig` : `in ${rest} Tagen`}
                  </p>
                )}
              </div>
            </div>



            {(hinweis || !a.abrechnungsdatenKomplett || a.zusatz.some((z) => !z.eingegangen)) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {hinweis && (
                  <span className="rounded-md bg-status-warn-soft px-2 py-1 font-medium text-status-warn">
                    {hinweis}
                  </span>
                )}
                {!a.abrechnungsdatenKomplett && (
                  <span className="rounded-md bg-status-late-soft px-2 py-1 font-medium text-status-late">
                    Abrechnungsdaten unvollständig
                  </span>
                )}
                {a.zusatz
                  .filter((z) => !z.eingegangen)
                  .map((z) => (
                    <span
                      key={z.fach}
                      className="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground"
                    >
                      Zusatzgutachten offen: {z.fach}
                    </span>
                  ))}
                {a.fristverlaengerungen > 0 && (
                  <span className="rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground">
                    {a.fristverlaengerungen}× Fristverlängerung
                  </span>
                )}
              </div>
            )}

            {a.notiz && <p className="mt-3 text-sm text-muted-foreground">{a.notiz}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Select value={a.phase} onValueChange={(v) => onPhase(a.id, v as Phase)}>
                <SelectTrigger className="h-9 w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASEN.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => onVerlaengerung(a.id)}>
                Fristverlängerung +4 Wochen
              </Button>
              {!a.abrechnungsdatenKomplett && (
                <Button size="sm" variant="outline" onClick={() => onAbrechnung(a.id)}>
                  Abrechnungsdaten vollständig
                </Button>
              )}
              {a.zusatz
                .filter((z) => !z.eingegangen)
                .map((z) => (
                  <Button
                    key={z.fach}
                    size="sm"
                    variant="outline"
                    onClick={() => onZusatzEingang(a.id, z.fach)}
                  >
                    {z.fach} eingegangen
                  </Button>
                ))}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-muted-foreground"
                onClick={() => onDelete(a.id)}
              >
                Entfernen
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
