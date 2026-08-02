import { describe, expect, it } from "vitest";
import {
  ampel,
  berechneKpi,
  eskalation,
  gutachterStatistik,
  plusTage,
  standardfrist,
  tageBis,
  wochenSeit,
  type Auftrag,
} from "./gutachten";

function auftrag(overrides: Partial<Auftrag> = {}): Auftrag {
  return {
    id: "t1",
    aktenzeichen: "S 1 U 1/25",
    auftraggeber: "Gericht",
    fach: "Neurologie",
    gutachterKuerzel: "GA-01",
    auftragEingangAm: plusTage(-7),
    terminAm: plusTage(7),
    fristAm: plusTage(49),
    phase: "In Bearbeitung",
    zusatz: [],
    abrechnungsdatenKomplett: true,
    fristverlaengerungen: 0,
    notiz: "",
    ...overrides,
  };
}

describe("Datums-Hilfsfunktionen", () => {
  it("rechnet Resttage vorwärts und rückwärts", () => {
    expect(tageBis(plusTage(10))).toBe(10);
    expect(tageBis(plusTage(-3))).toBe(-3);
  });

  it("zählt volle Wochen seit Eingang, nie negativ", () => {
    expect(wochenSeit(plusTage(-13))).toBe(1);
    expect(wochenSeit(plusTage(-14))).toBe(2);
    expect(wochenSeit(plusTage(5))).toBe(0);
  });

  it("setzt die Standardfrist auf 8 Wochen nach Eingang", () => {
    expect(standardfrist("2026-01-01")).toBe("2026-02-26");
  });
});

describe("Fristen-Ampel", () => {
  it("ist grün unter 6 Wochen Laufzeit mit ausreichend Restfrist", () => {
    expect(ampel(auftrag({ auftragEingangAm: plusTage(-20), fristAm: plusTage(36) }))).toBe(
      "gruen",
    );
  });

  it("ist gelb ab 6 Wochen Laufzeit", () => {
    expect(ampel(auftrag({ auftragEingangAm: plusTage(-43), fristAm: plusTage(13) }))).toBe("gelb");
  });

  it("ist gelb bei Restfrist von maximal 14 Tagen", () => {
    expect(ampel(auftrag({ auftragEingangAm: plusTage(-10), fristAm: plusTage(14) }))).toBe("gelb");
  });

  it("ist rot über 8 Wochen Laufzeit", () => {
    expect(ampel(auftrag({ auftragEingangAm: plusTage(-64), fristAm: plusTage(20) }))).toBe("rot");
  });

  it("ist rot bei überschrittener Frist", () => {
    expect(ampel(auftrag({ auftragEingangAm: plusTage(-10), fristAm: plusTage(-1) }))).toBe("rot");
  });

  it("ist fertig für versandte und abgerechnete Aufträge, auch wenn überfällig", () => {
    expect(ampel(auftrag({ phase: "Versandt", fristAm: plusTage(-30) }))).toBe("fertig");
    expect(ampel(auftrag({ phase: "Abgerechnet", fristAm: plusTage(-30) }))).toBe("fertig");
  });
});

describe("Eskalationsstufen", () => {
  it("erinnert automatisch ab 6 Wochen", () => {
    expect(eskalation(auftrag({ auftragEingangAm: plusTage(-42) }))).toMatch(/Automatische/);
  });

  it("erinnert persönlich ab 8 Wochen", () => {
    expect(eskalation(auftrag({ auftragEingangAm: plusTage(-56) }))).toMatch(/Persönliche/);
  });

  it("eskaliert an den Auftraggeber ab 10 Wochen", () => {
    expect(eskalation(auftrag({ auftragEingangAm: plusTage(-70) }))).toMatch(/Eskalation/);
  });

  it("gibt vor 6 Wochen und nach Abschluss keinen Hinweis", () => {
    expect(eskalation(auftrag({ auftragEingangAm: plusTage(-14) }))).toBeNull();
    expect(eskalation(auftrag({ auftragEingangAm: plusTage(-90), phase: "Versandt" }))).toBeNull();
  });
});

describe("Kennzahlen", () => {
  const liste: Auftrag[] = [
    auftrag({ id: "a", auftragEingangAm: plusTage(-70), fristAm: plusTage(-5) }),
    auftrag({ id: "b", terminAm: null, abrechnungsdatenKomplett: false }),
    auftrag({
      id: "c",
      zusatz: [{ fach: "EEG", beauftragtAm: plusTage(-5), eingegangen: false }],
    }),
    auftrag({ id: "d", phase: "Abgerechnet", fristverlaengerungen: 0 }),
    auftrag({ id: "e", phase: "Versandt", fristverlaengerungen: 2 }),
  ];

  it("zählt offene, überfällige und blockierte Aufträge", () => {
    const kpi = berechneKpi(liste);
    expect(kpi.offen).toBe(3);
    expect(kpi.ueberfaellig).toBe(1);
    expect(kpi.ohneTermin).toBe(1);
    expect(kpi.wartetAufZusatz).toBe(1);
    expect(kpi.abrechnungBlockiert).toBe(1);
  });

  it("berechnet die Fristtreue nur über abgeschlossene Aufträge", () => {
    expect(berechneKpi(liste).quoteFristtreue).toBe(50);
  });

  it("liefert 100 % Fristtreue ohne abgeschlossene Aufträge", () => {
    expect(berechneKpi([auftrag()]).quoteFristtreue).toBe(100);
  });

  it("gruppiert die Gutachterstatistik nach Kürzel", () => {
    const stats = gutachterStatistik([
      auftrag({ id: "x", gutachterKuerzel: "GA-01" }),
      auftrag({ id: "y", gutachterKuerzel: "GA-02", fristverlaengerungen: 3 }),
      auftrag({ id: "z", gutachterKuerzel: "GA-02" }),
    ]);
    expect(stats).toHaveLength(2);
    const ga02 = stats.find((s) => s.kuerzel === "GA-02");
    expect(ga02?.offen).toBe(2);
    expect(ga02?.verlaengerungen).toBe(3);
  });
});
