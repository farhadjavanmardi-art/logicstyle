# DSGVO-Checkliste — Logic Style

> **Hinweis:** Diese Dokumente sind eine praxisnahe Arbeitsgrundlage zur DSGVO-Umsetzung,
> keine Rechtsberatung. Für die verbindliche Beurteilung – insbesondere bei kommerziellem
> Betrieb – sollte ein Datenschutzbeauftragter oder eine Kanzlei hinzugezogen werden.

Stand: Juli 2026 · Verantwortlicher: Farhad Javanmardi (Logic Style), Karlsruhe

---

## ✅ Bereits umgesetzt (im Code / auf der Website)

| Punkt | Status | Wo |
|---|---|---|
| Datenschutzerklärung (13 Abschnitte, Art. 13/14 DSGVO) | ✅ | `Datenschutz.html` |
| Impressum (§ 5 DDG) | ⚠️ teilweise | `Impressum.html` – **Anschrift fehlt** (s. u.) |
| Cookie-/Consent-Hinweis (nur technisch notwendig) | ✅ | Banner auf allen Seiten |
| Einwilligungs-Checkbox bei der Registrierung | ✅ | `index.html` (Pflichtfeld „regDs") |
| Einwilligung des Kunden vor KI-Foto-Verarbeitung | ✅ | `ls-app.js` (Dialog pro hochgeladenem Foto) |
| Alle eingesetzten Auftragsverarbeiter in der Datenschutzerklärung genannt | ✅ | `Datenschutz.html` Abschnitt 7 |
| Betroffenenrechte (Art. 15–21) beschrieben + Kontakt | ✅ | `Datenschutz.html` Abschnitt 9 |
| Zuständige Aufsichtsbehörde (LfDI BW) genannt | ✅ | `Datenschutz.html` Abschnitt 13 |
| Verschlüsselte Übertragung (HTTPS/TLS) | ✅ | Hosting (Vercel) |
| Passwörter nicht im Klartext, serverseitige Verarbeitung | ✅ | Supabase / Edge Functions |
| Zugriffskontrolle über Sessions + RLS | ✅ | Supabase RLS-Policies |
| Verzeichnis von Verarbeitungstätigkeiten (Art. 30) | ✅ Vorlage | `01-Verzeichnis-Verarbeitungstaetigkeiten.md` |
| Auftragsverarbeiter-Liste (Art. 28) | ✅ Vorlage | `02-Auftragsverarbeiter.md` |
| Technische & organisatorische Maßnahmen (Art. 32) | ✅ Vorlage | `03-TOM.md` |

---

## ⚠️ Noch zu erledigen (nur der Betreiber kann das)

1. **Vollständige Anschrift im Impressum ergänzen** (§ 5 DDG Pflicht):
   Straße, Hausnummer, PLZ, Ort. Aktuell nur „Karlsruhe" – das genügt nicht.
   → Platzhalter in `Impressum.html` und `Datenschutz.html` (Abschnitt 1) ersetzen.

2. **Auftragsverarbeitungsverträge (AVV / DPA) abschließen** mit jedem Dienstleister
   (Art. 28 DSGVO). Links & Vorgehen in `02-Auftragsverarbeiter.md`. Diese Verträge
   schließt man online meist mit wenigen Klicks im jeweiligen Anbieter-Dashboard ab.

3. **Google Fonts lokal einbinden** (statt vom Google-CDN zu laden). Sonst wird bei
   jedem Seitenaufruf die IP-Adresse an Google (USA) übertragen – ein häufiger
   Abmahngrund. Empfehlung: Schriftdateien herunterladen und lokal ausliefern.

4. **Resend-Domain verifizieren** (DKIM/SPF) – ist bereits angestoßen, wartet auf
   Bestätigung. Erst danach funktioniert der E-Mail-Versand zuverlässig.

5. **Gewerbeanmeldung / Rechtsform prüfen**: Sobald echte Zahlungen laufen (Revolut),
   ist der Betrieb geschäftsmäßig. Ggf. Kleinunternehmerregelung (§ 19 UStG) und
   Umsatzsteuer-ID im Impressum prüfen.

6. **Löschkonzept**: Betroffene können Löschung per E-Mail verlangen. Für den laufenden
   Betrieb empfiehlt sich ein einfacher, dokumentierter Ablauf, wie Löschanfragen
   in Supabase (Tabelle `users`, Storage `simulations`) umgesetzt werden.

---

## 📌 Kernaussage für die KI-Fotoverarbeitung

Der sensibelste Punkt: Kundenfotos (Gesichter) werden zur KI-Simulation an **Google
(Gemini, ggf. USA)** übermittelt. Deshalb:

- Der Salon bestätigt **vor jeder Simulation**, dass der Kunde zugestimmt hat
  (Dialog in der Software).
- Diese Einwilligung ist die Rechtsgrundlage (Art. 6 Abs. 1 lit. a DSGVO).
- Der Salon sollte die Einwilligung seiner Kunden dokumentieren können
  (z. B. kurzer Hinweis + mündliche/schriftliche Zustimmung im Salon).
