# Gutachten-Cockpit

Internes Dashboard zur Nachverfolgung medizinischer Gutachtenaufträge – mit Fristen-Ampel,
Prozess-KPIs, Zugriffsschutz und vollständiger Änderungshistorie.

**Datenschutz-Grundsatz:** Es werden **keine personenbezogenen Daten** gespeichert. Aufträge
werden ausschließlich über Aktenzeichen identifiziert, Gutachtende über pseudonyme Kürzel
(z. B. `GA-04`). Keine Namen, Adressen, Geburtsdaten oder Diagnosen.

- Live: https://gutachten-dashboard.lovable.app
- Editor: https://lovable.dev/projects/9b4987bc-9478-47c8-ab7b-92b6f49c30a5

---

## 1. Technologie-Stack

| Bereich | Technologie |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR, File-based Routing) |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 (Design-Tokens in `src/styles.css`), shadcn/ui + Radix |
| Datenhaltung | Lovable Cloud (Postgres, Zugriff nur über `service_role`) |
| Validierung | Zod |
| Tests | Vitest |
| Laufzeit Backend | Serverless Worker (Cloudflare-kompatibel) |

Backend-Logik läuft ausschließlich über `createServerFn` (typisiertes RPC). Es gibt keine
Edge Functions und keinen direkten Datenbankzugriff aus dem Browser.

## 2. Projektstruktur

```text
src/
  routes/
    __root.tsx              App-Shell, Head-Metadaten, Toaster
    index.tsx               Cockpit (Liste, KPIs, Filter, Suche)
    unlock.tsx              Passwort-Gate (Einstieg)
    historie.tsx            Gesamte Änderungshistorie
    passwort-reset.tsx      Einlösen einer Reset-Freigabe (Token-Link)
    admin/passwort.tsx      Team-Passwort ändern + Passwort-Historie
    admin/protokoll.tsx     Zugriffsprotokoll (Audit-Log)
  components/gutachten/
    StatusPill.tsx          Ampel (Farbe + Glyphe + ARIA-Label)
    KpiPanel.tsx            Kennzahlen-Kacheln
    ProzessPanel.tsx        Durchlaufzeiten, WIP, Engpass-Status je Schritt
    AuftragListe.tsx        Auftragstabelle / Karten (mobil)
    NeuerAuftragDialog.tsx  Anlage inkl. Zusatzgutachten
    GutachterPanel.tsx      Auswertung je Gutachterkürzel
    HistorieDialog.tsx      Änderungshistorie je Auftrag
  lib/
    gutachten.ts            Fachlogik: Typen, Ampel, Eskalation, KPIs (rein, testbar)
    gutachten.test.ts       Vitest-Suite der Fachlogik
    auftraege.functions.ts  Server-RPC für CRUD + Historie
    auftraege.server.ts     DB-Zugriff, Diffing, Protokollierung
    gate.functions.ts       Server-RPC für Login/Logout/Admin/Reset
    gate.server.ts          Passwort-Gate, Session, PBKDF2, Fehlversuchsbremse
    audit.server.ts         Zugriffsprotokoll, IP-Ermittlung
    historie.ts/.server.ts  Änderungshistorie (Typen + Schreiben/Lesen)
```

Konvention: `*.functions.ts` sind dünne, client-importierbare RPC-Wrapper;
`*.server.ts` enthält die serverseitige Implementierung und wird nur dynamisch
innerhalb der Handler importiert.

## 3. Datenmodell

### Tabellen (Lovable Cloud / Postgres)

| Tabelle | Zweck |
| --- | --- |
| `auftraege` | Gutachtenaufträge (Aktenzeichen, Fachgebiet, Phase, Fristen, Zusatzgutachten als JSONB) |
| `auftrag_historie` | Feldgenaue Änderungshistorie (Aktion, Feld, alt/neu, Rolle, IP) |
| `zugriff_protokoll` | Audit-Log (Freischaltung, Sperrung, Fehlversuche, Passwortänderungen) |
| `gate_credentials` | Team-Passwort als PBKDF2-Hash (+ Salt, Iterationen) |
| `gate_reset_tokens` | Einmalige, zeitlich begrenzte Reset-Freigaben (SHA-256-Hash) |

Alle Tabellen haben **RLS aktiviert und keine Policies**; Rechte existieren nur für
`service_role`. Damit ist über die öffentliche Data-API kein Zugriff möglich – jeder Lesevorgang
läuft über eine gegatete Serverfunktion.

### Fachliche Typen (`src/lib/gutachten.ts`)

- `Phase`: Prozessschritte von Auftragseingang bis Abgerechnet
- `Fachgebiet` / `FACHGEBIETE` (Hauptgutachten) und `ZUSATZ_FACHGEBIETE`
  (Zusatzgutachten, u. a. Neurophysiologie und EEG; ohne Psychiatrie/Orthopädie)
- `Auftraggeber`: Gericht, Versicherung, Berufsgenossenschaft, Sonstige
- `Zusatzgutachten`: parallel beauftragte Teilgutachten mit eigenem Status

## 4. Fachlogik

### Fristen-Ampel

Standardfrist: **8 Wochen** ab Auftragseingang (`standardfrist()`).

| Ampel | Bedingung |
| --- | --- |
| `gruen` | < 6 Wochen |
| `gelb` | 6–8 Wochen |
| `rot` | > 8 Wochen |
| `fertig` | Gutachten versandt / abgerechnet |

Eskalationsstufen (`eskalation()`): 6 Wochen automatische Erinnerung, 8 Wochen persönliche
Erinnerung, 10 Wochen Eskalation an den Auftraggeber.

Barrierefreiheit: Die Ampel wird zusätzlich über Glyphen (●▲■✓) und `aria-label` vermittelt,
nicht nur über Farbe.

### Kennzahlen

- `berechneKpi()`: offene Aufträge, Überfälligkeiten, fehlende Termine, offene
  Zusatzgutachten, Abrechnungsblocker
- `prozessKpi()`: Median- und P90-Durchlaufzeit, Quote über Standardfrist sowie je
  Prozessschritt WIP-Menge/-Anteil, Überfälligkeiten, Laufzeit ø/max
- `gutachterStatistik()`: durchschnittliche Bearbeitungsdauer und Fristtreue je Kürzel

Engpass-Bewertung je Schritt (`EngpassStatus`): `engpass` bei ≥ 2 überfälligen Aufträgen,
Laufzeit > 8 Wochen oder WIP-Anteil ≥ 40 % der offenen Aufträge; dazwischen `beobachten`.

## 5. Sicherheitsarchitektur

### Zwei-Ebenen-Passwort

| Ebene | Speicherort | Änderbar |
| --- | --- | --- |
| Admin | Server-Secret `SITE_PASSWORD` | nur über Secret-Verwaltung |
| Team | PBKDF2-SHA-256-Hash (210 000 Iterationen) in `gate_credentials` | unter `/admin/passwort` |

Vergleiche laufen zeitkonstant über SHA-256-Digests (`timingSafeEqual`). Solange kein
Team-Hash gesetzt ist, gilt das Admin-Passwort auch für das Team.

### Session

Verschlüsseltes Session-Cookie (`SESSION_SECRET`) mit `httpOnly`, `secure`,
`SameSite=Strict`. Sliding Expiration mit rollenabhängigen Grenzen:

| Rolle | Inaktivität | Absolut |
| --- | --- | --- |
| admin | 15 Min | 2 h |
| team | 60 Min | 8 h |

Geschützte Routen rufen `requireUnlocked()` bzw. `requireAdmin()` serverseitig auf und leiten
sonst auf `/unlock` bzw. `/` um.

### Fehlversuchsbremse

5 Fehlversuche derselben IP innerhalb von 15 Minuten sperren Anmeldung und Reset-Link
befristet. Der Zustand wird aus dem Zugriffsprotokoll abgeleitet (zustandslose Worker),
Ereignisse: `ip_gesperrt`, `ip_abgewiesen`.

### Passwort-Reset-Freigabe

Admins erzeugen einen 32-Byte-Hex-Token (nur als SHA-256-Hash gespeichert), gültig 30 Minuten
und einmalig einlösbar unter `/passwort-reset`. Damit wird ausschließlich das Team-Passwort
gesetzt; `SITE_PASSWORD` bleibt unverändert.

### Protokollierung

- `zugriff_protokoll`: Freischaltung, Sperrung, Fehlversuche, Passwortänderungen,
  Reset-Freigaben – mit Zeitstempel, Rolle, IP, User-Agent (Ansicht `/admin/protokoll`)
- `auftrag_historie`: Anlage, Änderung (feldgenaues Diffing), Löschung – Ansicht je Auftrag
  über den Historie-Dialog und gesamt unter `/historie`

## 6. Konfiguration

Server-Secrets (nicht im Repository, nur in der Laufzeitumgebung):

| Name | Zweck |
| --- | --- |
| `SITE_PASSWORD` | Admin-Passwort des Zugangs-Gates |
| `SESSION_SECRET` | Schlüssel für das verschlüsselte Session-Cookie |

Datenbank-Zugangsdaten werden von Lovable Cloud automatisch bereitgestellt
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` u. a., ausschließlich serverseitig lesbar).

## 7. Entwicklung

Voraussetzung: Node.js (Installation z. B. über [nvm](https://github.com/nvm-sh/nvm)).

```sh
git clone <repository-url>
cd <repository-name>
npm i
npm run dev
```

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktionsbuild |
| `npm run test` | Vitest-Suite der Fachlogik |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

Ohne gesetzte Secrets und Datenbankverbindung ist die Anwendung lokal nicht anmeldbar; die
Fachlogik in `src/lib/gutachten.ts` ist jedoch vollständig ohne Backend testbar.

## 8. Konventionen und Grenzen

- Keine personenbezogenen Daten – neue Felder müssen pseudonym bleiben.
- Kein Datenzugriff aus dem Browser: jede Lese-/Schreiboperation über `createServerFn`.
- `*.server.ts` niemals direkt in Komponenten importieren, nur dynamisch im Handler.
- Oberflächensprache durchgängig Deutsch.
- Bekannte Einschränkungen: ein gemeinsames Team-Passwort (keine Einzelkonten), kein
  E-Mail-Alarmkanal (erfordert eigene Absenderdomain), kein CSV-Export.

## 9. Deployment

Die Anwendung wird über Lovable veröffentlicht; jede Änderung im Editor wird in dieses
Repository committet, Pushes auf `main` fließen zurück in Lovable.
