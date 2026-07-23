# Technische und organisatorische Maßnahmen (Art. 32 DSGVO)

> Arbeitsvorlage zur Dokumentation der Sicherheitsmaßnahmen. Stand: Juli 2026.

## 1. Vertraulichkeit

- **Zugangskontrolle:** Zugriff auf geschützte Bereiche nur mit gültigen Zugangsdaten
  und sessionbasierter Authentifizierung; automatische Abmeldung nach Inaktivität.
- **Zugriffskontrolle:** Row-Level-Security (RLS) in Supabase trennt Datenbereiche;
  Admin-Funktionen sind auf berechtigte Konten beschränkt.
- **Passwortsicherheit:** Passwörter werden nicht im Klartext gespeichert, sondern
  serverseitig geschützt verarbeitet. Temporäre Passwörter laufen automatisch ab.
- **Trennungskontrolle:** Nutzer-, Galerie-, Zahlungs- und Konfigurationsdaten sind
  logisch getrennt (eigene Tabellen).

## 2. Integrität

- **Übertragungskontrolle:** Ausschließlich verschlüsselte Übertragung über HTTPS/TLS.
- **Eingabekontrolle:** Administrative Vorgänge (Freischaltung, Zahlungen) werden über
  Benachrichtigungen/Protokolle nachvollziehbar gehalten (`admin_notifications`,
  `store_orders`).
- **Secrets-Management:** API-Schlüssel (Google, Revolut, Resend) liegen ausschließlich
  serverseitig (Supabase `app_config` / Edge Functions), nie im Client-Code.

## 3. Verfügbarkeit und Belastbarkeit

- **Hosting:** Website über Vercel (CDN, TLS). Datenbank/Storage über Supabase mit
  Backup-Mechanismen des Anbieters.
- **Wiederherstellbarkeit:** Datensicherung im Rahmen der Supabase-Plattform.

## 4. Verfahren zur regelmäßigen Überprüfung

- **Datenminimierung:** Es werden nur Daten verarbeitet, die für Website, Testzugang,
  Software, Galerie, Zahlung oder Kommunikation erforderlich sind.
- **Einwilligungssteuerung:** Kunden-Einwilligung wird vor jeder KI-Fotoverarbeitung
  aktiv bestätigt; Registrierungseinwilligung ist Pflichtfeld.
- **Auftragsverarbeitung:** Einsatz von Dienstleistern nur auf Grundlage von AVV
  (siehe `02-Auftragsverarbeiter.md`).

## 5. Offene Härtungsmaßnahmen (empfohlen)

- Google Fonts lokal einbinden (keine IP-Übertragung an Google beim Seitenaufruf).
- FormSubmit durch eigenen Resend-/Supabase-Versand ersetzen.
- Dokumentierter Ablauf für Lösch- und Auskunftsanfragen.
