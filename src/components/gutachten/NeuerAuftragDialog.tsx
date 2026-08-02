import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUFTRAGGEBER,
  FACHGEBIETE,
  ZUSATZ_FACHGEBIETE,
  neueId,
  standardfrist,
  type Auftrag,
  type Auftraggeber,
  type Fachgebiet,
} from "@/lib/gutachten";

const heute = () => new Date().toISOString().slice(0, 10);

export function NeuerAuftragDialog({ onCreate }: { onCreate: (a: Auftrag) => void }) {
  const [open, setOpen] = useState(false);
  const [aktenzeichen, setAktenzeichen] = useState("");
  const [auftraggeber, setAuftraggeber] = useState<Auftraggeber>("Gericht");
  const [fach, setFach] = useState<Fachgebiet>("Neurologie");
  const [kuerzel, setKuerzel] = useState("");
  const [eingang, setEingang] = useState(heute());
  const [termin, setTermin] = useState("");
  const [frist, setFrist] = useState("");
  const [abrechnung, setAbrechnung] = useState(false);
  const [zusatz, setZusatz] = useState<Fachgebiet[]>([]);

  const reset = () => {
    setAktenzeichen("");
    setKuerzel("");
    setEingang(heute());
    setTermin("");
    setFrist("");
    setAbrechnung(false);
    setZusatz([]);
  };

  const submit = () => {
    if (!aktenzeichen.trim() || !kuerzel.trim()) return;
    onCreate({
      id: neueId(),
      aktenzeichen: aktenzeichen.trim(),
      auftraggeber,
      fach,
      gutachterKuerzel: kuerzel.trim(),
      auftragEingangAm: eingang,
      terminAm: termin || null,
      fristAm: frist || standardfrist(eingang),
      phase: termin ? "Terminiert" : "Auftragseingang",
      zusatz: zusatz.map((f) => ({ fach: f, beauftragtAm: heute(), eingegangen: false })),
      abrechnungsdatenKomplett: abrechnung,
      fristverlaengerungen: 0,
      notiz: "",
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Auftrag anlegen</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neuer Gutachtenauftrag</DialogTitle>
          <DialogDescription>
            Nur Aktenzeichen und pseudonymes Gutachterkürzel – keine Namen, Adressen oder
            Diagnosedaten eingeben.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="az">Aktenzeichen / Vorgangsnummer</Label>
            <Input
              id="az"
              value={aktenzeichen}
              onChange={(e) => setAktenzeichen(e.target.value)}
              placeholder="z. B. S 12 U 431/25"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Auftraggeber</Label>
              <Select
                value={auftraggeber}
                onValueChange={(v) => setAuftraggeber(v as Auftraggeber)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUFTRAGGEBER.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Hauptfach</Label>
              <Select value={fach} onValueChange={(v) => setFach(v as Fachgebiet)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FACHGEBIETE.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ga">Gutachterkürzel (pseudonym)</Label>
            <Input
              id="ga"
              value={kuerzel}
              onChange={(e) => setKuerzel(e.target.value)}
              placeholder="z. B. GA-04"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="ein">Auftragseingang</Label>
              <Input
                id="ein"
                type="date"
                value={eingang}
                onChange={(e) => setEingang(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ter">Untersuchungstermin</Label>
              <Input
                id="ter"
                type="date"
                value={termin}
                onChange={(e) => setTermin(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fr">Frist</Label>
              <Input
                id="fr"
                type="date"
                value={frist}
                onChange={(e) => setFrist(e.target.value)}
                placeholder="Standard 8 Wochen"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Zusatzgutachten sofort parallel beauftragen</Label>
            <div className="flex flex-wrap gap-3">
              {ZUSATZ_FACHGEBIETE.filter((f) => f !== fach).map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={zusatz.includes(f)}
                    onCheckedChange={(c) =>
                      setZusatz((prev) => (c ? [...prev, f] : prev.filter((x) => x !== f)))
                    }
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={abrechnung}
              onCheckedChange={(c) => setAbrechnung(Boolean(c))}
            />
            Abrechnungsdaten vollständig (Rechnungsadresse, Steuernummer, Bankverbindung,
            Honorarvereinbarung)
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={submit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
