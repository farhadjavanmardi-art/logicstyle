# Auftragsverarbeiter & AVV-Übersicht (Art. 28 DSGVO)

> Arbeitsvorlage. Mit jedem Dienstleister ist ein Auftragsverarbeitungsvertrag (AVV/DPA)
> abzuschließen. Bei den meisten Anbietern geschieht das online im Konto-Dashboard oder
> gilt automatisch mit den Nutzungsbedingungen. Bitte je Anbieter prüfen und dokumentieren.

Stand: Juli 2026

| Anbieter | Zweck | Sitz / Drittland | AVV / DPA | Status |
|---|---|---|---|---|
| **Supabase Inc.** | Datenbank, Auth, Datei-Speicher, Edge Functions | USA | https://supabase.com/legal/dpa | ☐ abschließen |
| **Google LLC** (Gemini API) | KI-Bildgenerierung aus Kundenfotos | USA | https://cloud.google.com/terms/data-processing-addendum | ☐ abschließen |
| **Google LLC** (Maps/Places, Fonts) | Adresssuche, Schriftarten | USA | wie oben / Google Maps Platform Terms | ☐ prüfen |
| **Revolut** | Zahlungsabwicklung | EU (Litauen) / UK | Als Zahlungsdienstleister eigenverantwortlich; Merchant-Vertrag | ☐ Merchant-Vertrag |
| **Resend** (Plus Five Five, Inc.) | Transaktionale E-Mails | USA | https://resend.com/legal/dpa | ☐ abschließen |
| **FormSubmit** | Weiterleitung Registrierungs-E-Mails | USA | Anbieter-Bedingungen prüfen | ☐ prüfen / ggf. ablösen |
| **Vercel Inc.** | Hosting / CDN | USA | https://vercel.com/legal/dpa | ☐ abschließen |

---

## Hinweise

- **Drittlandübermittlung (USA):** Für Supabase, Google, Resend, FormSubmit und Vercel
  erfolgt eine Verarbeitung (auch) in den USA. Absicherung über EU-Standardvertrags­klauseln
  (SCC) und/oder das EU-US Data Privacy Framework. In der Datenschutzerklärung ist das
  in Abschnitt 7 dokumentiert.

- **FormSubmit** ist datenschutzrechtlich der schwächste Punkt (kostenloser Dienst, wenig
  transparente AVV-Lage). Empfehlung: mittelfristig durch den bereits vorhandenen
  Resend-/Supabase-basierten E-Mail-Versand ersetzen, damit Registrierungsdaten nicht
  zusätzlich an einen weiteren US-Dienst gehen.

- **Google Fonts** lädt aktuell vom Google-CDN und überträgt dabei die Besucher-IP an
  Google. Für einen sauberen Betrieb: Schriften lokal einbinden (Download + Selbst-Hosting).
