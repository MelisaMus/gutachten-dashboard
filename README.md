# Gutachten Flow

ich möchte ein Dashboard erstellen zur Nachverfolgung von Gutachtenaufträgen, aber Vorsicht, es sollen keine personenbezogenen Daten gespeichert werden, trotzdem soll ersichtlich sein, welches Gutachten wann fällig ist. Kernproblem: Die von Ihnen beschriebenen Probleme sind typisch für das medizinische Gutachtenwesen. Das Interessante ist: Der größte Zeitverlust entsteht meist nicht durch das Schreiben des Gutachtens, sondern durch den Prozess davor und danach. Wenn man den gesamten Ablauf betrachtet, gibt es vier wesentliche Engpunkte:

ProzessschrittHauptproblemVerbesserungspotenzialTerminvereinbarungViele Telefonate und E-MailsDigitalisierung und zentrale TerminsteuerungGutachtenerstellungLange Bearbeitungszeiten, FristüberschreitungenFristenmanagement und AnreizeKommunikation mit AuftraggebernFristverlängerungen, RückfragenStandardisierung und AutomatisierungAbrechnungWarten auf vollständige Gutachten und fehlende DatenFrühzeitige Datenerfassung und parallele Prozesse

1. Terminierung automatisieren


2. Klare Bearbeitungsfristen mit Transparenz

Viele Gutachter priorisieren klinische Arbeit verständlicherweise höher als Gutachten.

Deshalb helfen häufig keine Erinnerungen, sondern Transparenz.

Beispielsweise:

Standardfrist 8 Wochen

nach 6 Wochen automatische Erinnerung

nach 8 Wochen persönliche Erinnerung

nach 10 Wochen Eskalation

Ein Dashboard könnte anzeigen:

Grün (<6 Wochen)

Gelb (6–8 Wochen)

Rot (>8 Wochen)

Viele Institute berichten, dass allein die Sichtbarkeit der Fristen die Einhaltung verbessert.

3. Anreize statt ausschließlich Mahnungen

Man kann überlegen, Gutachter unterschiedlich zu incentivieren.

Beispielsweise

Priorisierte Gutachtenvergabe

Wer zuverlässig arbeitet,

bekommt bevorzugt neue Gutachten.

Wer regelmäßig 4–6 Monate benötigt,

erhält entsprechend weniger Aufträge.

Vergütungsmodell

Wenn möglich:

Bonus bei Einhaltung der Frist



Feedback

Jährliche Auswertung:

durchschnittliche Bearbeitungsdauer

Fristeinhaltung

Anzahl notwendiger Verlängerungen

Viele Gutachter wissen gar nicht, wie sie im Vergleich abschneiden.

4. Schreibprozess beschleunigen

Viele neurologische Gutachten bestehen aus ähnlichen Bausteinen.

Hilfreich wären:

strukturierte Vorlagen

Textbausteine

Diktat mit KI-Transkription

KI-gestützte Erstellung einer Rohfassung aus Anamnese und Untersuchung

Der Gutachter ergänzt dann nur noch die medizinische Bewertung.

Das kann die Schreibzeit erheblich verkürzen.

5. Fristverlängerungen standardisieren

Aktuell wird vermutlich jede Verlängerung individuell formuliert.

Stattdessen:

automatische Erinnerung an Gutachter

wenn keine Rückmeldung erfolgt:

Standardbrief an Gericht

Standardbrief an Versicherung

Standardbrief an Berufsgenossenschaft

Nur Datum und Aktenzeichen werden automatisch eingefügt.

Das spart viele administrative Stunden.

6. Zusatzgutachten parallel organisieren

Oft wartet das Hauptgutachten auf Zusatzgutachten.

Man könnte bereits bei Auftragseingang prüfen:

Wird ein neuropsychologisches Gutachten benötigt?


Dann werden alle Zusatzgutachten gleichzeitig beauftragt.



7. Abrechnung vorbereiten

Ein häufiger Zeitverlust entsteht, weil am Ende Bankdaten fehlen.

Deshalb bereits beim Auftrag:

✓ vollständige Rechnungsadresse

✓ Steuernummer

✓ Bankverbindung


Dann kann nach Eingang des letzten Gutachtens unmittelbar fakturiert werden.

8. Kennzahlen einführen

Viele Prozesse werden erst besser, wenn sie messbar sind.

Zum Beispiel monatlich:

Zeit Auftrag → Termin

Zeit Termin → Gutachten

Zeit Gutachten → Rechnung

Zeit Rechnung → Zahlung

Außerdem:

durchschnittliche Bearbeitungsdauer je Gutachter

Anzahl Fristverlängerungen

Anzahl Mahnungen

Anzahl Rückfragen

Erst dann wird sichtbar, wo tatsächlich der größte Flaschenhals liegt.

Ein möglicher Zielprozess

Auftragseingang

Vollständigkeitsprüfung (inkl. Bankdaten)

Sofortige Terminbuchung aus festen Gutachter-Slots

Gleichzeitige Beauftragung aller Zusatzgutachten

Automatische Fristenüberwachung

KI-/Vorlagen-gestützte Gutachtenerstellung

Automatisierte Erinnerung vor Fristablauf

Standardisierte Fristverlängerung nur bei Bedarf

Sofortige Rechnungsstellung nach Eingang aller Gutachten



Der größte Hebel

Maßnahmen nach erwarteter Wirkung priorisieren:

Verbindliche Gutachter-Slots mit digitaler Terminplanung – reduziert den Koordinationsaufwand erheblich.

Konsequentes Fristenmanagement mit Transparenz und Feedback für Gutachter – verkürzt die Bearbeitungszeit.

Standardisierte Vorlagen und KI-gestützte Rohentwürfe – beschleunigen das Schreiben der Gutachten.

Parallele Organisation von Haupt- und Zusatzgutachten – verhindert unnötige Wartezeiten.

Vollständige Abrechnungsdaten bereits bei Auftragseingang – verkürzt die Zeit bis zur Zahlung.


This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gutachten-dashboard.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9b4987bc-9478-47c8-ab7b-92b6f49c30a5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
