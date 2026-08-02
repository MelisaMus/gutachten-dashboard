import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAuftragHistorie } from "@/lib/auftraege.functions";
import {
  AKTION_LABEL,
  FELD_LABEL,
  formatZeitpunkt,
  type HistorieEintrag,
} from "@/lib/historie";

export function HistorieDialog({ id, aktenzeichen }: { id: string; aktenzeichen: string }) {
  const laden = useServerFn(getAuftragHistorie);
  const [offen, setOffen] = useState(false);
  const [eintraege, setEintraege] = useState<HistorieEintrag[] | null>(null);
  const [fehler, setFehler] = useState(false);

  const oeffnen = async (zustand: boolean) => {
    setOffen(zustand);
    if (!zustand) return;
    setFehler(false);
    setEintraege(null);
    try {
      const daten = (await laden({ data: { id } })) as HistorieEintrag[];
      setEintraege(daten);
    } catch {
      setFehler(true);
    }
  };

  return (
    <Dialog open={offen} onOpenChange={oeffnen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          aria-label={`Änderungshistorie für ${aktenzeichen} anzeigen`}
        >
          Historie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="num">Historie {aktenzeichen}</DialogTitle>
          <DialogDescription>
            Alle Änderungen an diesem Auftrag mit Zeitpunkt, Rolle und IP – ohne personenbezogene
            Daten.
          </DialogDescription>
        </DialogHeader>

        {fehler && <p className="text-sm text-destructive">Historie konnte nicht geladen werden.</p>}
        {!fehler && eintraege === null && (
          <p className="text-sm text-muted-foreground">Lade Historie …</p>
        )}
        {eintraege !== null && eintraege.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Für diesen Auftrag sind noch keine Änderungen protokolliert.
          </p>
        )}

        {eintraege !== null && eintraege.length > 0 && (
          <ol className="space-y-3">
            {eintraege.map((e) => (
              <li key={e.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="num text-xs text-muted-foreground">
                    {formatZeitpunkt(e.created_at)}
                  </span>
                  <span className="font-semibold">{AKTION_LABEL[e.aktion] ?? e.aktion}</span>
                  {e.feld && (
                    <span className="text-muted-foreground">{FELD_LABEL[e.feld] ?? e.feld}</span>
                  )}
                </div>
                {(e.wert_alt || e.wert_neu) && (
                  <p className="mt-1 break-words">
                    {e.wert_alt && <span className="text-muted-foreground">{e.wert_alt}</span>}
                    {e.wert_alt && e.wert_neu && <span aria-hidden="true"> → </span>}
                    {e.wert_neu && <span className="font-medium">{e.wert_neu}</span>}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Rolle {e.rolle ?? "unbekannt"}
                  {e.ip ? ` · IP ${e.ip}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
