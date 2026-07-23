/* ==========================================================================
   ls-i18n.js — Zweisprachigkeit DE / EN für Logic Style (kundenseitig)
   - Deutsch ist die Quellsprache im HTML. Englisch wird per Wörterbuch ersetzt.
   - Nicht übersetzte Texte bleiben sicher auf Deutsch (graceful fallback).
   - Funktioniert auch für dynamisch erzeugte Inhalte (MutationObserver).
   - Sprache wird in localStorage 'ls_lang' gemerkt; Erstbesuch = Browsersprache.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- Wörterbuch: exakter, getrimmter deutscher Text  ->  Englisch ---- */
  var DICT = {
    /* Navigation */
    "Logic Haare Software": "Logic Hair Software",
    "Wahrheit": "Truth",
    "Models": "Models",
    "Model werden": "Become a model",
    "Preise": "Pricing",
    "Kontakt": "Contact",
    "Kostenlos testen": "Try for free",

    /* Testprojekt-Banner (Fragmente) */
    "Testprojekt": "Test project",
    "— Diese Website ist": "— This website is",
    "nicht veröffentlicht": "not published",
    "und dient ausschließlich zu Testzwecken. Aktuell findet": "and is intended solely for testing purposes. Currently there is",
    "kein Verkauf": "no sale",
    "statt.": "taking place.",

    /* Hero */
    "Nur für verifizierte Salons": "For verified salons only",
    "Die Zukunft": "The future",
    "der Salons": "of salons",
    "Zeig deinen Kunden neue Looks, Premium-Schnitte, Farben und Behandlungen, bevor du loslegst — mega realistisch, direkt auf ihrem eigenen Foto und direkt am Stuhl. Sicherer beraten. Mehr verkaufen.": "Show your clients new looks, premium cuts, colors and treatments before you start — super realistic, directly on their own photo and right at the chair. Advise with more confidence. Sell more.",
    "WAHRHEIT": "TRUTH",
    "Warum diese Software im Salon wirklich verkauft": "Why this software really sells in the salon",
    "6 klare Gründe. Keine schönen Sprüche. Nur Beispiele aus dem Salon-Alltag, die jeder sofort versteht.": "6 clear reasons. No fancy talk. Just examples from everyday salon life that everyone understands right away.",
    "Softwares": "Softwares",
    "Trend Looks & Services": "Trend looks & services",
    "Pro Simulation": "Per simulation",
    "Fotos auto-gelöscht": "Photos auto-deleted",

    /* Trust-Strip */
    "100% DSGVO-konform": "100% GDPR-compliant",
    "Kein Vertrag — monatlich kündbar": "No contract — cancel monthly",
    "Als Betriebsausgabe absetzbar": "Tax-deductible as a business expense",
    "Antwort in unter 2 Stunden": "Reply within 2 hours",

    /* So funktioniert es */
    "So einfach funktioniert es": "It's this simple",
    "4 Schritte. Fertig.": "4 steps. Done.",
    "Kein Training. Kein Aufwand. Du drückst auf einen Knopf — der Rest passiert von selbst.": "No training. No effort. You press a button — the rest happens by itself.",
    "Software öffnen": "Open software",
    "Wähle den gewünschten Style — Haare, Bart, Farbe oder Behandlung.": "Choose the desired style — hair, beard, color or treatment.",
    "Modell wählen": "Choose model",
    "Wähle den gewünschten Style, die Farbe oder die Behandlung aus dem Katalog.": "Choose the desired style, color or treatment from the catalog.",
    "Foto hochladen": "Upload photo",
    "Mache ein Foto direkt vom Kunden oder lade ein Bild.": "Take a photo directly of the customer or upload an image.",
    "Ergebnis in 30s": "Result in 30s",
    "Die KI liefert ein fotorealistisches Vorher/Nachher-Bild — zum Speichern und Teilen.": "The AI delivers a photorealistic before/after image — to save and share.",

    /* Modelle */
    "Unsere Modelle": "Our models",
    "Entdecke unsere Styles": "Discover our styles",
    "Wähle deinen Lieblingsstyle — von klassisch bis modern, für Damen und Herren.": "Choose your favorite style — from classic to modern, for women and men.",
    "📸 Alle Styles ansehen": "📸 View all styles",

    /* Preise */
    "Preise · monatlich kündbar": "Pricing · cancel monthly",
    "Mehr Simulationen. Klarere Team-Pakete.": "More simulations. Clearer team packages.",
    "Wähle das passende Paket für deinen Salon. Pro ist für einzelne Stylisten, Elite für kleine Teams und Studio für größere Teams mit dem stärksten Preis-Leistungs-Verhältnis. Sichere Zahlung über Revolut, jederzeit monatlich kündbar.": "Choose the right package for your salon. Pro is for individual stylists, Elite for small teams and Studio for larger teams with the best value for money. Secure payment via Revolut, cancellable monthly at any time.",
    "🎁 Testversion · erst prüfen, dann entscheiden": "🎁 Free version · check first, then decide",
    "20 Simulationen — 0€": "20 simulations — €0",
    "Logic Haare Software inklusive: Haare, Bart, Farbe und Keratin & Perm. Keine Online-Zahlung. Keine Kreditkarte. Manuelle Freischaltung nach Prüfung des Salons.": "Logic Hair Software included: hair, beard, color and keratin & perm. No online payment. No credit card. Manual activation after review of the salon.",
    "Testzugang anfragen — Logic Haare Software freischalten": "Request test access — unlock Logic Hair Software",
    "Hinweis:": "Note:",
    "Faire Preisbasis: 0,33 € pro Simulation. Elite enthält ~7% und Studio ~11% Mengenrabatt. Studio bietet 1000 gemeinsame Simulationen für 10 Benutzer, Elite ist der Team-Tarif mit 400 Simulationen und 5 Benutzern, Pro der Einstieg für einzelne Stylisten.": "Fair price basis: €0.33 per simulation. Elite includes ~7% and Studio ~11% volume discount. Studio offers 1000 shared simulations for 10 users, Elite is the team plan with 400 simulations and 5 users, Pro is the entry level for individual stylists.",
    "/Monat": "/month",
    "200 Simulationen": "200 simulations",
    "400 Simulationen": "400 simulations",
    "1000 Simulationen": "1000 simulations",
    "1 Software nach Wahl inklusive": "1 software of your choice included",
    "150+ Modelle & Services": "150+ models & services",
    "300+ Modelle & Services": "300+ models & services",
    "1 Benutzer im Pro-Zugang": "1 user in Pro access",
    "Regelmäßige Updates": "Regular updates",
    "Pro auswählen →": "Select Pro →",
    "Elite auswählen →": "Select Elite →",
    "Studio auswählen →": "Select Studio →",
    "Monatlich kündbar · Zahlung über Revolut": "Cancel monthly · Payment via Revolut",
    "✓ Steuerlich absetzbar": "✓ Tax-deductible",
    "⭐ Beliebteste Wahl": "⭐ Most popular choice",
    "5 Benutzer · gemeinsames Team-Budget": "5 users · shared team budget",
    "10 Benutzer · gemeinsames Team-Budget": "10 users · shared team budget",
    "Salon-Team-Tarif für kleine und mittlere Teams": "Salon team plan for small and medium teams",
    "Logic Haare Software inklusive": "Logic Hair Software included",
    "Bestes Preis-Leistungs-Verhältnis für Teams": "Best value for teams",

    /* Software-Zugang */
    "Software-Zugang": "Software access",
    "Nach dem Paket kommt die passende Software.": "After the package comes the right software.",
    "Wähle Herren oder Damen — im Pro-Paket eine Software, in Elite & Studio auch kombiniert. Wird nach Prüfung des Salons freigeschaltet.": "Choose Men or Women — one software in the Pro package, also combined in Elite & Studio. Activated after review of the salon.",
    "Logic Herren": "Logic Men",
    "Herren-Haarschnitte, Bart, Bartfarbe, Farbe und Behandlung.": "Men's haircuts, beard, beard color, color and treatment.",
    "→ Software öffnen": "→ Open software",
    "Logic Damen": "Logic Women",
    "Damen-Haarschnitte, Farbe, Balayage, Highlights, Toning, Glossing, Keratin und Dauerwelle.": "Women's haircuts, color, balayage, highlights, toning, glossing, keratin and perm.",
    "Logic Kombiniert": "Logic Combined",
    "Herren & Damen zusammen — nur in Elite & Studio.": "Men & women together — only in Elite & Studio.",

    /* FAQ */
    "Häufige Fragen": "Frequently asked questions",
    "Was du wissen möchtest.": "What you want to know.",
    "Muss ich mich mit KI auskennen?": "Do I need to know about AI?",
    "Nein. Du drückst auf einen Knopf — der Rest passiert von selbst. In vier Schritten von Unsicherheit zu Entscheidung. Kein technisches Wissen nötig.": "No. You press a button — the rest happens by itself. In four steps from uncertainty to decision. No technical knowledge required.",
    "Was passiert mit den Fotos meiner Kunden?": "What happens to my customers' photos?",
    "Fotos werden nach jeder Simulation automatisch gelöscht. Wir speichern keine Gesichter. 100% DSGVO-konform. Wenn der Kunde das Ergebnis behalten möchte, kann er es selbst auf seinem Gerät speichern.": "Photos are automatically deleted after each simulation. We do not store faces. 100% GDPR-compliant. If the customer wants to keep the result, they can save it themselves on their device.",
    "Wie realistisch sind die Simulationen?": "How realistic are the simulations?",
    "Fotorealistisch — kein Filter, kein Cartoon. Die Ergebnisse basieren auf dem echten Kundenfoto und werden durch Google Gemini KI erzeugt, die speziell für Salonbedarf konfiguriert wurde.": "Photorealistic — no filter, no cartoon. The results are based on the real customer photo and are generated by Google Gemini AI, configured specifically for salon needs.",
    "Wie komme ich nach der Anmeldung rein?": "How do I get in after signing up?",
    "Nach der Anmeldung prüfen wir deine Salonadresse — dauert maximal 24 Stunden. Dann bekommst du per E-Mail deinen persönlichen Zugangscode. Einloggen, fertig.": "After signing up we check your salon address — takes 24 hours at most. Then you receive your personal access code by email. Log in, done.",
    "Kann ich auf dem Handy arbeiten?": "Can I work on my phone?",
    "Ja. Alle Softwares funktionieren direkt im Browser — auf Handy, Tablet und Computer. Kein Download nötig. Du kannst sie direkt am Stuhl verwenden, während der Kunde sitzt.": "Yes. All softwares run directly in the browser — on phone, tablet and computer. No download needed. You can use them right at the chair while the customer is seated.",
    "Gibt es einen Vertrag?": "Is there a contract?",
    "Nein. Monatlich kündbar. Kein Risiko. Wenn Logic Style nichts für dich ist — kein Problem, kein Druck.": "No. Cancellable monthly. No risk. If Logic Style isn't for you — no problem, no pressure.",
    "Kann ich Logic Style von der Steuer absetzen?": "Can I deduct Logic Style from taxes?",
    "Ja. Als monatliches SaaS-Abo gilt Logic Style als laufende Betriebsausgabe und ist vollständig steuerlich absetzbar. Du bekommst monatlich eine ordentliche Rechnung für deinen Steuerberater.": "Yes. As a monthly SaaS subscription, Logic Style counts as an ongoing business expense and is fully tax-deductible. You receive a proper invoice each month for your tax advisor.",

    /* Kontakt */
    "Fragen? Wir antworten in unter 24 Stunden.": "Questions? We reply within 24 hours.",
    "Schreib uns direkt — per E-Mail oder WhatsApp. Ein echter Mensch antwortet.": "Write to us directly — by email or WhatsApp. A real person answers.",

    /* Footer */
    "KI-Simulation für Friseursalons in Deutschland.": "AI simulation for hair salons in Germany.",
    "Karlsruhe, Deutschland · DSGVO-konform": "Karlsruhe, Germany · GDPR-compliant",
    "Software": "Software",
    "✂️ Logic Haare · Farbe · Bart": "✂️ Logic Hair · Color · Beard",
    "📸 Models": "📸 Models",
    "Links": "Links",
    "Preise & Tarife": "Pricing & plans",
    "FAQ": "FAQ",
    "Datenschutz": "Privacy Policy",
    "Impressum": "Imprint",
    "© 2025 Logic Style · Karlsruhe · Deutschland": "© 2025 Logic Style · Karlsruhe · Germany",

    /* Registrierungs-Modal (dynamisch) */
    "Anmeldung": "Registration",
    "👤 Persönliche Angaben": "👤 Personal details",
    "Vorname *": "First name *",
    "Vorname": "First name",
    "Nachname *": "Last name *",
    "Nachname": "Last name",
    "E-Mail-Adresse *": "Email address *",
    "Telefon / WhatsApp *": "Phone / WhatsApp *",
    "✂️ Salon-Angaben": "✂️ Salon details",
    "Name des Salons *": "Salon name *",
    "z.B. Salon Bella": "e.g. Salon Bella",
    "📍 Salon-Standort ermitteln": "📍 Detect salon location",
    "✅ Adresse eingeben oder oben GPS nutzen:": "✅ Enter address or use GPS above:",
    "🚀 Kostenlos anmelden": "🚀 Sign up free",
    "🔒 Deine Daten werden nur zur Kontoerstellung verwendet. DSGVO-konform.": "🔒 Your data is only used to create your account. GDPR-compliant.",
    "Ich habe die": "I have read the",
    "gelesen und willige in die Verarbeitung meiner Daten zur Bearbeitung meiner Anfrage bzw. zur Bereitstellung des Zugangs ein. *": "and consent to the processing of my data to handle my request and provide access. *",
    "Bitte gib die Telefonnummer ein, die in deinem": "Please enter the phone number registered in your",
    "eingetragen ist. Diese wird zur Verifizierung verwendet.": "This is used for verification.",
    "Wichtig:": "Important:",
    "Adresse und Telefonnummer müssen mit dem": "Address and phone number must match the",
    "deines Salons übereinstimmen. Da die Software kostenlos ist, prüfen wir jeden Salon vorab. Nach Bestätigung wird dein Zugang innerhalb von 24 Stunden freigeschaltet.": "of your salon. Since the software is free, we review every salon in advance. After confirmation your access is unlocked within 24 hours.",
    "🗺 Standort auf der Karte prüfen & ggf. korrigieren": "🗺 Check location on the map & correct if needed",

    /* Häufige Fehlermeldungen (dynamisch) */
    "❌ Bitte Vor- und Nachnamen eingeben.": "❌ Please enter first and last name.",
    "❌ Bitte gültige E-Mail-Adresse eingeben.": "❌ Please enter a valid email address.",
    "❌ Bitte Telefonnummer eingeben.": "❌ Please enter a phone number.",
    "❌ Bitte Salonname eingeben.": "❌ Please enter a salon name.",
    "❌ Bitte zuerst den Standort ermitteln (📍 Button).": "❌ Please detect the location first (📍 button).",
    "❌ Bitte bestätige die Datenschutzerklärung.": "❌ Please confirm the privacy policy.",
    "❌ Bitte wähle eine Software (Herren oder Damen).": "❌ Please choose a software (Men or Women).",
    "❌ Bitte wähle eine Software.": "❌ Please choose a software.",

    /* Cookie-Banner */
    "Datenschutz & Cookies": "Privacy & Cookies",
    "Cookies": "Cookies",
    "Wir verwenden technisch notwendige Cookies und speichern Session-Daten zur Bereitstellung unserer Dienste. Keine Tracking-Cookies.": "We use technically necessary cookies and store session data to provide our services. No tracking cookies.",
    "Datenschutzerklärung": "Privacy Policy",
    "Ablehnen": "Decline",
    "Akzeptieren ✓": "Accept ✓",
    "— Nur technisch notwendige Speicherung für Funktion und Session.": "— Only technically necessary storage for function and session.",

    /* Zurück / allgemein */
    "← Zurück": "← Back",
    "Zurück": "Back",
    "Startseite": "Home",
    "Beispiele ansehen": "View examples",
    "Beispiele": "Examples",
    "Warum Logic Style?": "Why Logic Style?",
    "Fotomodell werden": "Become a photo model",

    /* ============ Software (Shells Logic_*.html) ============ */
    "— Technisch notwendig.": "— Technically necessary.",
    "10 – 30 Sekunden": "10 – 30 seconds",
    "10 – 30 Sekunden…": "10 – 30 seconds…",
    "AUFNAHMEWINKEL WÄHLEN": "CHOOSE CAMERA ANGLE",
    "BEHANDLUNGSINTENSITÄT": "TREATMENT INTENSITY",
    "Damen": "Women",
    "Herren": "Men",
    "E-Mail-Adresse": "Email address",
    "Echte Simulationen aus Logic Style": "Real simulations from Logic Style",
    "Foto": "Photo",
    "Fotorealistische KI-Simulation für Haare, Bart, Farbe und Behandlung": "Photorealistic AI simulation for hair, beard, color and treatment",
    "Für die beste Simulation bitte diese Anleitung befolgen:": "For the best simulation please follow this guide:",
    "Galerie": "Gallery",
    "Haare · Farbe · Bart · KI-Software": "Hair · Color · Beard · AI Software",
    "Kamera": "Camera",
    "Klinik-Login": "Login",
    "Logic Style · Damen": "Logic Style · Women",
    "Logic Style · KI-Software": "Logic Style · AI Software",
    "Logic Style · Nur für verifizierte Kunden": "Logic Style · For verified customers only",
    "NACHHER": "AFTER",
    "VORHER": "BEFORE",
    "Neues Passwort eingeben — mindestens 6 Zeichen.": "Enter a new password — at least 6 characters.",
    "Passwort": "Password",
    "Passwort vergessen?": "Forgot password?",
    "Winkel wählen und Foto hochladen": "Choose angle and upload photo",
    "Wird geladen…": "Loading…",
    "und starten": "and start",
    "• Gegenlicht (Fenster hinter dem Kunden) • Unscharfe Fotos • Brille • Zu dunkle Aufnahmen • Extreme Nahaufnahmen • Starkes Make-up oder Filter": "• Backlight (window behind the customer) • Blurry photos • Glasses • Too dark shots • Extreme close-ups • Heavy make-up or filters",
    "→ Anmelden": "→ Sign in",
    "① Frontansicht": "① Front view",
    "② Dreiviertelansicht (45°)": "② Three-quarter view (45°)",
    "③ Keine Rückansicht nötig": "③ No back view needed",
    "▸ Simulation starten": "▸ Start simulation",
    "✓ Passwort speichern": "✓ Save password",
    "✓ Verstanden": "✓ Understood",
    "✨ Simulation": "✨ Simulation",
    "❌ BITTE VERMEIDEN": "❌ PLEASE AVOID",
    "⬇ Auf Gerät": "⬇ To device",
    "👤 Für Bart reicht Front und 45° links/rechts · 🔙 Für Haare, Farbe und Behandlung ist auch Rückansicht sinnvoll · ✨ Haare, Ansatz, Längen und Konturen sichtbar halten": "👤 For beards, front and 45° left/right is enough · 🔙 For hair, color and treatment a back view is also useful · ✨ Keep hair, roots, lengths and contours visible",
    "📏 50–70 cm Abstand · 📐 Augenhöhe · 💡 Gleichmäßiges Licht · 👤 Kopf/Haar/Bart vollständig · 🎯 Neutraler Hintergrund": "📏 50–70 cm distance · 📐 Eye level · 💡 Even light · 👤 Head/hair/beard fully visible · 🎯 Neutral background",
    "📐 45-Grad-Winkel · 💡 Gutes Licht auf Haar oder Bart · 🎯 Kontur und Länge sichtbar": "📐 45-degree angle · 💡 Good light on hair or beard · 🎯 Contour and length visible",
    "📸 Foto-Anleitung": "📸 Photo guide",
    "🔑 Passwort ändern": "🔑 Change password",
    "🚀 Dieses Modell simulieren": "🚀 Simulate this model",
    /* Software Platzhalter / Titel */
    "E-Mail oder Benutzername": "Email or username",
    "Modell oder Service suchen…": "Search model or service…",
    "Neues Passwort": "New password",
    "Passwort bestätigen": "Confirm password",
    "Passwort eingeben…": "Enter password…",
    "Abmelden": "Log out",
    "Foto-Tipps": "Photo tips",

    /* ============ Software (ls-app.js, dynamisch) ============ */
    "✏️ Modell bearbeiten": "✏️ Edit model",
    "Noch keine Beispielbilder": "No example images yet",
    "Auflösung zu niedrig": "Resolution too low",
    "Bart Fade & Übergang": "Beard fade & transition",
    "Bildformat ungewöhnlich — bitte ein klares Salonfoto verwenden": "Unusual image format — please use a clear salon photo",
    "Bitte verwenden Sie ein stärkeres Passwort: mindestens 10 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.": "Please use a stronger password: at least 10 characters, upper and lower case, a number and a special character.",
    "Bitte zuerst einen Winkel wählen.": "Please choose an angle first.",
    "Bitte zuerst ein Kundenfoto hochladen.": "Please upload a customer photo first.",
    "Keine Simulationen mehr — jetzt Credits kaufen oder Paket upgraden.": "No simulations left — buy credits now or upgrade your package.",
    "Kein Bild zurückgegeben.": "No image returned.",
    "Keratin & Glätten": "Keratin & straightening",
    "Keratin · Glätten · Dauerwelle · Pflege": "Keratin · Straightening · Perm · Care",
    "Natürlich": "Natural",
    "Nur Admins können in die Galerie speichern": "Only admins can save to the gallery",
    "Passwörter stimmen nicht überein.": "Passwords do not match.",
    "Supabase Function hat keinen Erfolg zurückgegeben.": "The function did not return success.",
    "Temporäres Passwort abgelaufen.": "Temporary password expired.",
    "Ungültiges Bildformat. Bitte Foto erneut hochladen.": "Invalid image format. Please upload the photo again.",
    "⏳ Wird geprüft…": "⏳ Checking…",
    "✅ Als Download gespeichert": "✅ Saved as download",
    "✅ Auf Gerät gespeichert": "✅ Saved to device",
    "✅ Erfolgreich in Galerie gespeichert": "✅ Successfully saved to gallery",
    "✅ Falls ein Konto existiert, wurde eine E-Mail mit einem temporären Passwort gesendet. Bitte prüfe dein Postfach.": "✅ If an account exists, an email with a temporary password has been sent. Please check your inbox.",
    "✅ In Galerie": "✅ In gallery",
    "✅ In Photos gespeichert": "✅ Saved to Photos",
    "✅ Passwort geändert!": "✅ Password changed!",
    "⤓ oder Foto per Drag & Drop hier ablegen": "⤓ or drop a photo here via drag & drop",
    "💳 Credit-Kauf-Anfrage": "💳 Credit purchase request",
    "📁 In Galerie": "📁 In gallery",
    "📈 Upgrade-Anfrage": "📈 Upgrade request",
    "📸 In Photos speichern": "📸 Save to Photos",
    "📸 Machen Sie das Foto aus einem beliebigen Winkel — vorne, hinten, seitlich oder dazwischen — und klicken Sie einfach auf „Simulation starten\". Die KI erkennt den Winkel automatisch und simuliert genau diesen Winkel.": "📸 Take the photo from any angle — front, back, side or in between — and simply click „Start simulation“. The AI detects the angle automatically and simulates exactly that angle.",

    /* ============ Kunden-Einwilligung (Consent-Dialog) ============ */
    "Einwilligung des Kunden": "Customer consent",
    "Für die Simulation wird das Foto des Kunden verarbeitet und zur KI-Bildgenerierung an einen Dienstleister (Google, Verarbeitung ggf. in den USA) übermittelt. Bitte bestätigen Sie, dass Ihr Kunde": "For the simulation the customer's photo is processed and transmitted to a service provider (Google, processing possibly in the USA) for AI image generation. Please confirm that your customer",
    "der KI-Verarbeitung seines Fotos zugestimmt": "has consented to the AI processing of their photo",
    "hat.": "has done so.",
    "Der Kunde hat der Verarbeitung seines Fotos zur KI-Simulation zugestimmt. Details:": "The customer has consented to the processing of their photo for AI simulation. Details:",
    "Abbrechen": "Cancel",
    "Bestätigen & starten": "Confirm & start",

    /* ============ models.html ============ */
    "DIE ZUKUNFT DER SALONS": "THE FUTURE OF SALONS",
    "Logic Style · Galerie": "Logic Style · Gallery",
    "Noch keine Bilder in dieser Kategorie": "No images in this category yet",
    "📸 Beispiele ansehen": "📸 View examples",
    "Modell suchen…": "Search model…",

    /* ============ model.html (Fotomodell werden) ============ */
    "Logic Style | Fotomodell werden": "Logic Style | Become a photo model",
    "✨ Fotomodell für Logic Style": "✨ Photo model for Logic Style",
    "Fotomodell für die Logic Style Simulations-Galerie": "Photo model for the Logic Style simulation gallery",
    "Mehr als nur Haare": "More than just hair",
    "Dein Bild.": "Your image.",
    "Unsere Galerie.": "Our gallery.",
    "Modellgalerie": "Model gallery",
    "Modellgalerie ansehen": "View model gallery",
    "Logic Style Modellgalerie": "Logic Style model gallery",
    "Vorher/Nachher-Beispiele für Haare, Farbe, Bart, Keratin und Perm.": "Before/after examples for hair, color, beard, keratin and perm.",
    "Beispiele für Salons": "Examples for salons",
    "Was genau passiert?": "What exactly happens?",
    "Wo erscheinen die Beispiele?": "Where do the examples appear?",
    "Was ist für dich interessant?": "What are you interested in?",
    "Persönliche Angaben": "Personal details",
    "Optionale Informationen": "Optional information",
    "Optionales Styling:": "Optional styling:",
    "Geburtsdatum *": "Date of birth *",
    "Geschlecht *": "Gender *",
    "E-Mail *": "Email *",
    "Stadt / Ort *": "City / Town *",
    "Bitte wählen": "Please select",
    "Männlich": "Male",
    "Weiblich": "Female",
    "Divers / Keine Angabe": "Diverse / Not specified",
    "Haare / Schnitt": "Hair / Cut",
    "Bart": "Beard",
    "Farbe": "Color",
    "KI-Simulationen": "AI simulations",
    "Aktuelle Haarfarbe / Bartfarbe": "Current hair color / beard color",
    "Haarlänge": "Hair length",
    "Haartyp": "Hair type",
    "Sehr kurz": "Very short",
    "Kurz": "Short",
    "Mittel": "Medium",
    "Lang": "Long",
    "Glatt": "Straight",
    "Wellig": "Wavy",
    "Lockig": "Curly",
    "Sehr lockig / Afro": "Very curly / Afro",
    "Nicht relevant": "Not relevant",
    "PFLICHT": "REQUIRED",
    "Nächste →": "Next →",
    "← Vorherige": "← Previous",
    "← Galerie": "← Gallery",
    "Telefon / Nachricht": "Phone / message",
    "Kontaktaufnahme:": "Contact:",
    "Foto- und Simulationsmaterial:": "Photo and simulation material:",
    "Einwilligung & Zustimmung": "Consent & agreement",
    "Klare Zustimmung": "Clear consent",
    "Social Media / Werbung optional": "Social media / advertising optional",
    "Cookies & Datenschutz": "Cookies & Privacy",
    "1. Zweck der Datenverarbeitung": "1. Purpose of data processing",
    "2. Welche Fotos betroffen sein können": "2. Which photos may be affected",
    "3. Art der Nutzung": "3. Type of use",
    "4. Keine garantierte Dienstleistung": "4. No guaranteed service",
    "5. Widerruf": "5. Withdrawal",
    "6. Rechtsgrundlage": "6. Legal basis",
    "📅 Terminwunsch angeben": "📅 Choose a preferred appointment",
    "⬆️ Bitte wähle einen freien Termin aus dem Kalender.": "⬆️ Please choose an available appointment from the calendar.",
    "Ausgewählt": "Selected",
    "Frei": "Available",
    "Vergeben": "Taken",
    "E-Mail vorbereitet": "Email prepared",
    "Falls dein E-Mail-Programm nicht aufgeht": "If your email program doesn't open",
    "Bitte die E-Mail dort noch absenden.": "Please still send the email there.",

    /* ============ wahrheit.html (Warum Logic Style — die ehrliche Rechnung) ============ */
    "Warum Logic Style? | Die ehrliche Rechnung": "Why Logic Style? | The honest calculation",
    "Warum Logic Style · Die ehrliche Rechnung": "Why Logic Style · The honest calculation",
    "← Zur Hauptseite": "← To the main page",
    "Hauptseite": "Main page",
    "Live-Beispiele ansehen": "View live examples",
    "Modellgalerie öffnen": "Open model gallery",
    "Testversion": "Free version",
    "Termin": "Appointment",
    "Anfrage": "Request",
    "Interesse": "Interest",
    "Diagramm": "Chart",
    "Differenz": "Difference",
    "Basis": "Base",
    "Geschützt": "Protected",
    "Sichtbar": "Visible",
    "Standard": "Standard",
    "Premium/Trend": "Premium/Trend",
    "Premium-Look": "Premium look",
    "Premium-Wahrnehmung": "Premium perception",
    "Normaler Termin": "Normal appointment",
    "Business-Punkt": "Business point",
    "Marketing-Punkt": "Marketing point",
    "Beispielrechnung": "Example calculation",
    "Konservative Beispielrechnung": "Conservative example calculation",
    "Korrigierte Beispielrechnung": "Corrected example calculation",
    "Was ist die Wahrheit ist nicht:": "The truth is not:",
    "Die Wahrheit ist nicht:": "The truth is not:",
    "KI macht dich reich.": "AI makes you rich.",
    "KI macht dich reich.": "AI makes you rich.",
    "Dann entscheide.": "Then decide.",
    "Schau es dir selbst an.": "See for yourself.",
    "Eine Software": "One software",
    "Für Salons": "For salons",
    "Lesart:": "How to read it:",
    "Wichtig:": "Important:",
    "Was genau bietet Logic Style?": "What exactly does Logic Style offer?",
    "Logic Style ist eine KI-Testsoftware für Friseure, Barber und Friseursalons. Sie zeigt Kunden realistische Vorher/Nachher-Simulationen für Haare, Farbe, Bart, Keratin und Perm, bevor die Behandlung beginnt.": "Logic Style is an AI test software for hairdressers, barbers and hair salons. It shows customers realistic before/after simulations for hair, color, beard, keratin and perm before the treatment begins.",
    "Der Hauptpunkt ist nicht die Technik. Der Hauptpunkt ist Beratung, Vertrauen und Umsatz: Kunden verstehen schneller, was möglich ist. Salons verkaufen klarer, hochwertiger und mit weniger Missverständnissen.": "The main point is not the technology. The main point is consultation, trust and revenue: customers understand faster what is possible. Salons sell more clearly, at higher quality and with fewer misunderstandings.",
    "Das wäre unseriöser Unsinn, und davon gibt es im Internet schon genug, falls jemand noch eine Dosis gebraucht hat. Die Wahrheit ist nüchterner und stärker: Logic Style kann Beratung sichtbarer machen, Entscheidungen beschleunigen, hochwertige Leistungen besser erklären und typische Missverständnisse reduzieren.": "That would be dubious nonsense, and there is already plenty of that on the internet in case anyone needed another dose. The truth is more sober and stronger: Logic Style can make consultation more visible, speed up decisions, explain premium services better and reduce typical misunderstandings.",
    "Die Hauptseite erklärt die Plattform. Diese Seite erklärt, warum sie wirtschaftlich sinnvoll sein kann.": "The main page explains the platform. This page explains why it can make economic sense.",
    "Die Zahlen unten sind Beispielrechnungen für Salon-Entscheidungen, keine Umsatzgarantie. Sie zeigen, wo Logic Style wirtschaftlich wirken kann, wenn ein Salon es sauber in Beratung, Angebot und Nachbetreuung einsetzt.": "The figures below are example calculations for salon decisions, not a revenue guarantee. They show where Logic Style can have an economic effect when a salon uses it properly in consultation, offering and follow-up.",
    "Vor den nächsten drei Punkten: Beispiele ansehen.": "Before the next three points: view examples.",
    "Jedes Diagramm zeigt einen Vergleich:": "Each chart shows a comparison:",
    "(grau) und": "(gray) and",
    "(pink/grün). Auf dem Smartphone kannst du Diagramme antippen, um sie größer zu sehen.": "(pink/green). On a smartphone you can tap charts to see them larger.",
    "Bezahlte Beratung statt kostenlose Unsicherheit": "Paid consultation instead of free uncertainty",
    "Beratung wird oft kostenlos gegeben, obwohl sie Zeit und Erfahrung kostet. Logic Style macht sie sichtbar — mit Varianten und Vorher/Nachher-Vorschauen. Das macht eine bezahlte Beratung leichter akzeptabel, besonders bei Farbe, Bart oder Keratin/Perm.": "Consultation is often given for free, even though it costs time and experience. Logic Style makes it visible — with variants and before/after previews. This makes a paid consultation easier to accept, especially for color, beard or keratin/perm.",
    "Wenn Beratung sichtbarer und strukturierter wird, kann sie selbst zum verkaufbaren Salon-Service werden.": "When consultation becomes more visible and structured, it can itself become a sellable salon service.",
    "Kurz: Beratung darf Geld kosten, wenn sie sichtbar Wert liefert.": "In short: consultation may cost money if it visibly delivers value.",
    "Beratungspreis: 35 €": "Consultation price: €35",
    "Preis pro Beratung: 35 €": "Price per consultation: €35",
    "Beratungsumsatz": "Consultation revenue",
    "Beratungsumsatz pro Monat": "Consultation revenue per month",
    "20 bezahlte Beratungen pro Monat": "20 paid consultations per month",
    "10 / 20 / 30 Beratungen": "10 / 20 / 30 consultations",
    "10 Berat.": "10 cons.",
    "20 Berat.": "20 cons.",
    "30 Berat.": "30 cons.",
    "20 Beratungen × 35 €": "20 consultations × €35",
    "20 × 35 € =": "20 × €35 =",
    "700 € Monatsumsatz": "€700 monthly revenue",
    "Erst sichtbar machen, dann hochwertiger beraten": "First make it visible, then advise at a higher level",
    "Kurz: Erst sichtbar machen, dann hochwertiger beraten.": "In short: first make it visible, then advise at a higher level.",
    "Aus einem normalen Termin kann ein deutlich wertvollerer Termin werden, wenn der Kunde sieht, was möglich ist.": "A normal appointment can become a significantly more valuable appointment when the customer sees what is possible.",
    "Viele Kunden kommen mit einer einfachen Idee, obwohl mehr möglich wäre. Logic Style macht die Empfehlung sichtbar statt abstrakt — auf dem eigenen Foto. Das senkt Widerstand und erhöht die Chance auf einen größeren, passenden Service.": "Many customers arrive with a simple idea, even though more would be possible. Logic Style makes the recommendation visible instead of abstract — on their own photo. This lowers resistance and increases the chance of a larger, fitting service.",
    "Normaler Termin vs. Upgrade durch Software-Beratung": "Normal appointment vs. upgrade through software consultation",
    "Normaler Damen-Termin: ca. 45 €": "Normal women's appointment: approx. €45",
    "Mit Software-Beratung zu Balayage umgewandelt: Ø ca. 150 €": "Converted to balayage with software consultation: avg. approx. €150",
    "Ergebnis: 45 € → ca. 175 €": "Result: €45 → approx. €175",
    "Umsatz pro Termin": "Revenue per appointment",
    "Höhere Preise wirken glaubwürdiger, wenn Beratung hochwertiger aussieht": "Higher prices seem more credible when consultation looks higher quality",
    "Preiserhöhungen scheitern oft an der Wahrnehmung, nicht am Preis selbst. Mit strukturierter KI-Vorschau und sauberer Beratung wirkt derselbe Preis logischer — Kunden zahlen mehr, wenn sie einen nachvollziehbaren Grund sehen.": "Price increases often fail because of perception, not the price itself. With a structured AI preview and clean consultation, the same price feels more logical — customers pay more when they see an understandable reason.",
    "Die Software ersetzt keine Qualität. Aber sie macht Qualität sichtbarer. Genau dadurch werden höhere Preise besser begründbar.": "The software does not replace quality. But it makes quality more visible. Precisely this makes higher prices easier to justify.",
    "Kurz: Premium muss sichtbar sein, sonst bleibt es nur Behauptung.": "In short: premium must be visible, otherwise it remains just a claim.",
    "Standard vs. Premium-Look": "Standard vs. premium look",
    "Standard-Termin: ca. 54 €": "Standard appointment: approx. €54",
    "Premium-/Trend-Service: ca. 120 €": "Premium/trend service: approx. €120",
    "54 € vs. 120 €": "€54 vs. €120",
    "Monatsumsatz bei Preisanpassung": "Monthly revenue with price adjustment",
    "Basis vs. +5 / +10 / +15 %": "Base vs. +5 / +10 / +15 %",
    "Basis: 100 × 54 € = 5.400 €": "Base: 100 × €54 = €5,400",
    "+5 % Preisniveau: 5.670 € = +270 €": "+5% price level: €5,670 = +€270",
    "+10 % Preisniveau: 5.940 € = +540 €": "+10% price level: €5,940 = +€540",
    "+15 % Preisniveau: 6.210 € = +810 €": "+15% price level: €6,210 = +€810",
    "100 Termine × Ø 54 €": "100 appointments × avg. €54",
    "Durchschnittlicher Terminwert: 54 €": "Average appointment value: €54",
    "Bei +15 % Preisniveau": "At +15% price level",
    "Schon bei +5 %": "Even at +5%",
    "Die Zahlen sind konservativ. Selbst kleine Preisverbesserungen haben auf Monatsbasis Wirkung.": "The figures are conservative. Even small price improvements have an effect on a monthly basis.",
    "Der Salon verkauft nicht nur Zeit am Stuhl, sondern Entscheidungssicherheit. Genau das ist im Premium-Markt wertvoll.": "The salon sells not just time at the chair, but decision confidence. That is exactly what is valuable in the premium market.",
    "Weniger Missverständnisse — weniger verlorene Kunden": "Fewer misunderstandings — fewer lost customers",
    "Kunden gehen oft nicht wegen schlechter Arbeit, sondern weil Vorstellung und Ergebnis nicht zusammenpassten. Eine realistische Vorschau sorgt dafür, dass beide Seiten vor der Behandlung über dasselbe Bild sprechen — das schützt vor Diskussionen und stillem Kundenverlust.": "Customers often leave not because of poor work, but because expectation and result did not match. A realistic preview ensures that both sides talk about the same image before the treatment — protecting against disputes and silent customer loss.",
    "Die sauberste Rechnung ist oft nicht der zusätzliche Umsatz, sondern der Umsatz, der nicht verloren geht.": "The cleanest calculation is often not the additional revenue, but the revenue that is not lost.",
    "Kurz: Gute Beratung verhindert nicht alles, aber sie reduziert unnötige Verluste.": "In short: good consultation does not prevent everything, but it reduces unnecessary losses.",
    "Kundenverlust und geschützter Umsatz": "Customer loss and protected revenue",
    "Gesamtes Risikovolumen: 5 × 4 × 80 € = 1.600 €": "Total risk volume: 5 × 4 × €80 = €1,600",
    "Ohne Software: 3 Kunden verloren → 3 × 4 × 80 € = 960 € Verlust": "Without software: 3 customers lost → 3 × 4 × €80 = €960 loss",
    "Mit Software: nur 1 Kunde verloren → 1 × 4 × 80 € = 320 € Verlust": "With software: only 1 customer lost → 1 × 4 × €80 = €320 loss",
    "Geschützter Unterschied: 960 € - 320 € =": "Protected difference: €960 − €320 =",
    "Geschützter Umsatz": "Protected revenue",
    "Risiko 1.600 € · Netto-Schutz 640 €": "Risk €1,600 · net protection €640",
    "Ohne Software: 3 verloren": "Without software: 3 lost",
    "Mit Software: 1 verloren": "With software: 1 lost",
    "1 Kunde weg": "1 customer gone",
    "3 Kunden weg": "3 customers gone",
    "5 gefährdete Stammkunden/Jahr": "5 at-risk regulars/year",
    "5 gefährdete Kunden × 4 Besuche × 80 €": "5 at-risk customers × 4 visits × €80",
    "Jeder macht 4 Besuche/Jahr à 80 €": "Each makes 4 visits/year at €80",
    "Die Software garantiert keinen Kundenerhalt. Das Modell zeigt nur: Schon eine kleine Reduktion verlorener Stammkunden kann wirtschaftlich spürbar sein.": "The software does not guarantee customer retention. The model only shows: even a small reduction in lost regulars can be economically noticeable.",
    "Der frühere Vergleich war zu aggressiv. Diese Version trennt sauber zwischen gesamtem Risikovolumen, tatsächlichem Verlust und geschütztem Umsatz. So wirkt es seriöser und mathematisch belastbarer.": "The earlier comparison was too aggressive. This version cleanly separates total risk volume, actual loss and protected revenue. This makes it more serious and mathematically sound.",
    "Warum die alte Rechnung korrigiert wurde": "Why the old calculation was corrected",
    "Warum das ein eigener Umsatzpunkt ist": "Why this is a separate revenue point",
    "Warum das psychologisch funktioniert": "Why this works psychologically",
    "Besseres Marketing: Beispiele, Mundpropaganda und neue Kunden": "Better marketing: examples, word of mouth and new customers",
    "Gute Simulationen sind nicht nur Beratung. Sie sind Content, Gesprächsstoff und Beweisfläche.": "Good simulations are not just consultation. They are content, conversation starters and proof.",
    "Ein Salon, der auch mögliche Ergebnisse vorab zeigt, wirkt moderner als einer, der nur fertige Ergebnisse zeigt. Die öffentliche Modellgalerie macht das sichtbar — klassische Looks für Vertrauen, moderne für Alltag, Trend-Looks für Aufmerksamkeit.": "A salon that also shows possible results in advance appears more modern than one that only shows finished results. The public model gallery makes this visible — classic looks for trust, modern ones for everyday, trend looks for attention.",
    "Kurz: Sichtbare Beispiele machen den Salon erinnerbarer.": "In short: visible examples make the salon more memorable.",
    "Neue Kunden pro Monat": "New customers per month",
    "2 vs. 5 Neukunden": "2 vs. 5 new customers",
    "2 Neukunden × 80 €": "2 new customers × €80",
    "5 Neukunden × 80 €": "5 new customers × €80",
    "Ohne starke Beispiele: 2 neue Kunden/Monat à 80 € Erstumsatz = 160 €": "Without strong examples: 2 new customers/month at €80 first revenue = €160",
    "Mit sichtbarer Galerie: 5 neue Kunden/Monat à 80 € = 400 €": "With a visible gallery: 5 new customers/month at €80 = €400",
    "Ohne Galerie": "Without gallery",
    "Mit Galerie": "With gallery",
    "528 € mehr Umsatz": "€528 more revenue",
    "Das Diagramm ist kein Versprechen, sondern zeigt den Marketing-Hebel: mehr sichtbare Beispiele können mehr Anfragen erzeugen.": "The chart is not a promise, but shows the marketing lever: more visible examples can generate more requests.",
    "Trend- und Premium-Looks werden leichter verkaufbar": "Trend and premium looks become easier to sell",
    "Viele Kunden wollen etwas Moderneres — Money Piece, Fade, Beard Blend, Grey Blending — bremsen sich aber, weil sie nicht wissen, wie es an ihnen aussieht. Logic Style zeigt klassisch, modern und trendbasiert nebeneinander: ein Verkaufswerkzeug, kein reiner Content.": "Many customers want something more modern — money piece, fade, beard blend, grey blending — but hold back because they don't know how it looks on them. Logic Style shows classic, modern and trend-based side by side: a sales tool, not just content.",
    "Kurz: Trends verkaufen sich besser, wenn sie nicht wie ein Sprung ins Dunkle wirken.": "In short: trends sell better when they don't feel like a leap into the dark.",
    "Moderne Looks brauchen Mut. Eine realistische Vorschau reduziert das Risiko im Kopf des Kunden.": "Modern looks require courage. A realistic preview reduces the risk in the customer's mind.",
    "Pro Premium-Termin": "Per premium appointment",
    "8 Premium-Termine im Monat: 8 × 66 € =": "8 premium appointments per month: 8 × €66 =",
    "Differenz: +66 € pro Termin": "Difference: +€66 per appointment",
    "Differenz im Monat: +240 €": "Difference per month: +€240",
    "Bei 8 Terminen im Monat": "With 8 appointments per month",
    "Mehr Umsatz durch hochwertige Services und passende Pflegeprodukte": "More revenue through premium services and matching care products",
    "Zusätzlich steigt die Chance, dass aus der Beratung ein echter Termin wird": "In addition, the chance increases that the consultation turns into a real appointment",
    "8 Upgrades im Monat: 8 × 130 € =": "8 upgrades per month: 8 × €130 =",
    "Differenz: +130 € pro Upgrade": "Difference: +€130 per upgrade",
    "Upgrade + Pflege": "Upgrade + care",
    "+Pflege": "+Care",
    "+Termine": "+Appointments",
    "Passendes Pflegeprodukt oder Gloss-Service: ca. 25 €": "Matching care product or gloss service: approx. €25",
    "Premium/Trend-Service: ca. 120 €": "Premium/trend service: approx. €120",
    "Mini-Akademie: Welttrends lernen und das eigene Team schulen": "Mini-academy: learn world trends and train your own team",
    "Die 360°-Simulation erkennt jeden Winkel automatisch — dadurch wird die Software nebenbei zur Mini-Akademie: aktuelle Welttrends direkt am Bildschirm, ohne teure Fortbildungsreise. Auszubildende sehen, wie ein Fade oder eine Balayage aus jedem Winkel aufgebaut ist, bevor sie es an echten Kunden versuchen — weniger Fehlversuche, schnellere Einarbeitung.": "The 360° simulation detects every angle automatically — turning the software into a mini-academy on the side: current world trends directly on screen, without an expensive training trip. Trainees see how a fade or a balayage is built up from every angle before they try it on real customers — fewer failed attempts, faster onboarding.",
    "Wissen kostet sonst Geld: Kursgebühren, Reisezeit, Ausfallstunden — und langsamere neue Mitarbeiter. Mit der Mini-Akademie bleibt dieses Wissen jederzeit im Salon abrufbar, kostenlos wiederholbar und für das ganze Team gleichzeitig nutzbar.": "Otherwise knowledge costs money: course fees, travel time, lost hours — and slower new staff. With the mini-academy this knowledge stays available in the salon at all times, repeatable for free and usable by the whole team at once.",
    "Kurz: Lernen passiert direkt in der Software, die Sie ohnehin täglich für die Kundenberatung nutzen.": "In short: learning happens directly in the software you use every day for customer consultation anyway.",
    "Externe Kurse vs. Mini-Akademie in der Software": "External courses vs. mini-academy in the software",
    "Externe Trend-Fortbildungen ohne Software: ca. 2 Kurse/Jahr à 450 € plus Reise- und Ausfallzeit ≈ 1.500 € pro Jahr": "External trend training without software: approx. 2 courses/year at €450 plus travel and downtime ≈ €1,500 per year",
    "Mit Mini-Akademie: Trends werden laufend in der Software erkundet, nur noch gelegentliche Präsenzkurse für Zertifikate nötig ≈ 300 € pro Jahr": "With the mini-academy: trends are explored continuously in the software, only occasional in-person courses for certificates needed ≈ €300 per year",
    "Fortbildungskosten pro Jahr": "Training costs per year",
    "Ohne Mini-Akademie": "Without mini-academy",
    "Mit Mini-Akademie": "With mini-academy",
    "Ersparnis: 1.500 € − 300 € =": "Savings: €1,500 − €300 =",
    "Ersparnis pro Jahr": "Savings per year",
    "1.200 € pro Jahr": "€1,200 per year",
    "Die Mini-Akademie ersetzt keine Zertifikatskurse, aber sie reduziert, wie oft ein Salon dafür extern zahlen muss — und bringt neue Teammitglieder schneller ans Kundenmodell.": "The mini-academy does not replace certificate courses, but it reduces how often a salon has to pay for them externally — and brings new team members to the customer model faster.",
    "Zusatzumsatz durch schnellere Einarbeitung": "Additional revenue through faster onboarding",
    "Weil die Simulation jeden Winkel automatisch erkennt, wird aus derselben Software nebenbei eine interne Fortbildungs- und Trainingsstation — auch das ist ein Umsatzpunkt.": "Because the simulation detects every angle automatically, the same software also becomes an internal training station on the side — that too is a revenue point.",
    "Ein Azubi, der dank Simulationstraining ca. 2 Monate früher eigenständig Termine übernimmt und in dieser Zeit 15 zusätzliche Termine à 45 € macht: 15 × 45 € =": "A trainee who, thanks to simulation training, takes over appointments independently approx. 2 months earlier and in that time does 15 extra appointments at €45: 15 × €45 =",
    "675 € zusätzlicher Umsatz": "€675 additional revenue",
    "640 € pro Jahr": "€640 per year",
    "1.040 € zusätzlicher Monatsumsatz": "€1,040 additional monthly revenue",
    "1.600 € Jahreswert": "€1,600 annual value",
    "Wenn jeder neue Kunde 4 Besuche/Jahr macht: 5 × 80 € × 4 = 1.600 € Jahreswert": "If each new customer makes 4 visits/year: 5 × €80 × 4 = €1,600 annual value",
    "100 Termine im Monat": "100 appointments per month",
    "8 Premium-Termine im Monat": "8 premium appointments per month",
    "Möglicher Folgeumsatz nicht eingerechnet": "Possible follow-up revenue not included",
    "Beispiel pro Termin": "Example per appointment",
    "Beispiel durch bessere Sichtbarkeit": "Example through better visibility",
    "Bei 8 Terminen im Monat": "With 8 appointments per month",
    "Was genau bietet Logic Style?": "What exactly does Logic Style offer?",
    "Haare, Farbe, Bart, Keratin und Perm in einer klaren Salon-Software.": "Hair, color, beard, keratin and perm in one clear salon software.",
    "Für Friseure, Coloristen und Barber: realistische Vorschauen für Schnitte, Farbe, Balayage, Glossing, Bart, Keratin und Perm.": "For hairdressers, colorists and barbers: realistic previews for cuts, color, balayage, glossing, beard, keratin and perm.",
    "Damen- und Herrenmodelle": "Women's and men's models",
    "Farbe, Bart sowie Keratin & Perm klar getrennt": "Color, beard and keratin & perm clearly separated",
    "Front, 45° links/rechts und bei Haar/Farbe auch Rückansicht": "Front, 45° left/right and, for hair/color, also back view",
    "Speicherung in der Modellgalerie möglich": "Saving to the model gallery possible",
    "Gespeicherte Simulationen erscheinen in einer separaten Beispielgalerie.": "Saved simulations appear in a separate example gallery.",
    "Öffentliche Beispielgalerie für gespeicherte Simulationen.": "Public example gallery for saved simulations.",
    "Die Modellgalerie zeigt gespeicherte Simulationen aus den Bereichen Haare, Farbe, Bart, Keratin und Perm. Genau diese Sichtbarkeit verkauft Vertrauen.": "The model gallery shows saved simulations for hair, color, beard, keratin and perm. Exactly this visibility sells trust.",
    "Hauptseite mit Testzugang, DSGVO-Hinweis und Software-Erklärung.": "Main page with test access, GDPR notice and software explanation.",
    "Keine Online-Zahlung, manuelle Freischaltung, klare DSGVO-Hinweise im Hauptformular.": "No online payment, manual activation, clear GDPR notices in the main form.",
    "Fotomodell-Anfrage für Personen, die als Beispiel in der Galerie erscheinen möchten.": "Photo model request for people who want to appear as an example in the gallery.",
    "Nicht für private Spielerei, sondern für Beratung im professionellen Salon-Alltag.": "Not for private gimmickry, but for consultation in professional everyday salon work.",
    "Genau dafür wurden die Logic Style Software, die Modellgalerie und der Testzugang gebaut: nicht als Spielerei, sondern als Werkzeug für Friseure, Barber und Friseursalons, die Beratung professioneller und wirtschaftlicher machen wollen.": "That is exactly why the Logic Style software, the model gallery and the test access were built: not as a gimmick, but as a tool for hairdressers, barbers and hair salons that want to make consultation more professional and more economical.",
    "Ein moderner Salon verkauft nicht nur Ergebnisse. Er verkauft Vertrauen vor der Entscheidung.": "A modern salon sells not just results. It sells trust before the decision.",
    "Ein Salon, der professioneller berät, kann seine Leistung leichter als Premium positionieren.": "A salon that advises more professionally can position its service as premium more easily.",
    "Die Software gibt dem Salon etwas, das viele Wettbewerber nicht haben: personalisierte Beispielkommunikation. Nicht nur „wir können das“, sondern „so kann es aussehen“.": "The software gives the salon something many competitors don't have: personalized example communication. Not just “we can do that”, but “this is how it can look”.",
    "Die Software muss nicht nur rechnen. Sie muss attraktiv wirken. Deshalb sind moderne, klassische und trendige Beispiele wichtig: Sie zeigen die Spannbreite des Salons.": "The software doesn't just have to add up. It has to look attractive. That's why modern, classic and trendy examples matter: they show the salon's range.",
    "Kunden kaufen nicht nur Farbe oder Schnitt. Sie kaufen Sicherheit. Eine Vorschau macht die Entscheidung greifbarer und senkt das Gefühl, ein Risiko einzugehen.": "Customers don't just buy color or a cut. They buy confidence. A preview makes the decision more tangible and lowers the feeling of taking a risk.",
    "Psychologisch wirkt die Software, weil sie Unsicherheit reduziert: Kunden sehen nicht nur eine fremde Referenz, sondern eine Vorschau auf dem eigenen Foto. Das macht Entscheidungen konkreter. Trotzdem bleibt jede echte Behandlung handwerklich, individuell und nicht vollständig vorhersagbar.": "Psychologically, the software works because it reduces uncertainty: customers don't just see someone else's reference, but a preview on their own photo. That makes decisions more concrete. Nevertheless, every real treatment remains manual, individual and not fully predictable.",
    "Premium-Looks brauchen nicht nur Technik, sondern eine Entscheidungshilfe. Genau da sitzt der wirtschaftliche Hebel.": "Premium looks need not just technique, but decision support. That is exactly where the economic lever sits.",
    "Die Differenz entsteht nicht durch mehr Arbeitstage, sondern durch bessere Visualisierung und hochwertigere Beratung.": "The difference does not come from more working days, but from better visualization and higher-quality consultation.",
    "Beratung wird messbar. Das ist für Salons besonders wertvoll, weil gute Beratung bisher oft verschenkt wird.": "Consultation becomes measurable. That is especially valuable for salons, because good consultation has often been given away for free.",
    "Die Simulationen sind Vorschauen. Sie ersetzen keine fachliche Beratung und garantieren kein identisches echtes Ergebnis. Genau diese Ehrlichkeit ist wichtig, besonders im deutschen Markt, wo Vertrauen mehr verkauft als lautes Marketing.": "The simulations are previews. They do not replace professional consultation and do not guarantee an identical real result. Exactly this honesty matters, especially in the German market, where trust sells more than loud marketing.",
    "Alle Werte sind Beispielrechnungen. Der tatsächliche Umsatz hängt von Standort, Preisniveau, Zielgruppe, Teamqualität, Beratung und Umsetzung ab. Die Diagramme sind keine Finanzprognosen, sondern Rechenmodelle für typische Salon-Szenarien.": "All values are example calculations. Actual revenue depends on location, price level, target group, team quality, consultation and execution. The charts are not financial forecasts, but calculation models for typical salon scenarios.",
    "Alle Rechenbeispiele sind unverbindliche Beispielwerte. Es gibt keine Garantie für Umsatzsteigerung, Neukundenzahl oder reale Behandlungsergebnisse.": "All calculation examples are non-binding example values. There is no guarantee of revenue increase, number of new customers or real treatment results.",
    "Diese Berechnung basiert auf Recherchen in Friseursalons und wurde mit Wahrscheinlichkeiten kalkuliert — es gibt keine Garantie für dieses Ergebnis.": "This calculation is based on research in hair salons and was calculated with probabilities — there is no guarantee of this result.",
    "Logic Style ist eine Testsoftware mit manueller Freischaltung. KI-Simulationen sind Beratungsvorschauen und ersetzen keine fachliche, handwerkliche oder medizinische Beurteilung.": "Logic Style is test software with manual activation. AI simulations are consultation previews and do not replace professional, manual or medical assessment.",
    "Hinweis zu Zahlen, Psychologie und Ergebnisqualität": "Note on figures, psychology and result quality",
    "Sobald die Datei": "As soon as the file",
    "im selben Ordner wie diese Seite hochgeladen ist, erscheint hier automatisch das Video.": "is uploaded to the same folder as this page, the video appears here automatically.",
    "🎬 Video folgt in Kürze": "🎬 Video coming soon",
    "🔍 Klicken zum Vergrößern": "🔍 Click to enlarge",
    "mit Logic Style im Salonprozess": "with Logic Style in the salon process",
    "ohne strukturierte KI-Beratung": "without structured AI consultation",
    "Ohne Software": "Without software",
    "Mit Software": "With software",
    "Mehr als nur Haare": "More than just hair",
    "Möglicher Folgeumsatz nicht eingerechnet": "Possible follow-up revenue not included",

    /* ============ share.html ============ */
    "Logic Style | Simulation": "Logic Style | Simulation",
    "Simulation wird geladen…": "Loading simulation…",
    "Simulation nicht gefunden oder abgelaufen.": "Simulation not found or expired.",
    "Ungültiger Link — kein Token gefunden.": "Invalid link — no token found.",
    "KI-Simulationen sind visuelle Vorschläge — kein Garant für das Ergebnis beim Friseur.": "AI simulations are visual suggestions — not a guarantee of the result at the hairdresser.",
    "Eigene Simulation starten →": "Start your own simulation →",
    "⬇ Bild speichern": "⬇ Save image",

    /* ============ Logicstyle.html ============ */
    "Als Model mitmachen": "Join as a model",
    "Direkte Nachricht": "Direct message",
    "Direkter Kontakt": "Direct contact",
    "E-Mail": "Email",
    "Haare · Farbe · Bart · Keratin & Perm": "Hair · Color · Beard · Keratin & Perm",
    "Navigation": "Navigation",
    "Simulationen · Vorher / Nachher": "Simulations · Before / After",
    "Technisch notwendige Cookies.": "Technically necessary cookies.",
    "Warum Logic Style im Salon verkauft": "Why Logic Style sells in the salon",
    "Website · Preise · Informationen": "Website · Pricing · Information",

    /* ============ Datenschutz.html (Struktur/Überschriften) ============ */
    "Diese Datenschutzerklärung informiert über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten auf unserer Website, in unseren Testzugängen und in der Logic Style Software für Haare, Farbe, Bart, Keratin und Perm.": "This privacy policy informs you about the nature, scope and purpose of the processing of personal data on our website, in our test accounts and in the Logic Style software for hair, color, beard, keratin and perm.",
    "Stand: Juli 2026": "As of July 2026",
    "Inhaltsverzeichnis": "Table of contents",
    "Verantwortlicher": "Controller",
    "Welche Daten wir erheben": "What data we collect",
    "Zweck der Datenverarbeitung": "Purpose of data processing",
    "Rechtsgrundlagen": "Legal bases",
    "Speicherdauer": "Storage duration",
    "Weitergabe an Dritte": "Disclosure to third parties",
    "Externe Dienste & Drittanbieter": "External services & third parties",
    "Fotos, Bildrechte & Modell-Galerie": "Photos, image rights & model gallery",
    "Ihre Rechte": "Your rights",
    "Datensicherheit": "Data security",
    "Cookies & lokale Speicherung": "Cookies & local storage",
    "Änderungen dieser Erklärung": "Changes to this policy",
    "Kontakt & Aufsichtsbehörde": "Contact & supervisory authority",

    /* ============ Impressum.html (Überschriften) ============ */
    "01 · Anbieter": "01 · Provider",
    "02 · Kontakt": "02 · Contact",
    "03 · Inhalt des Angebots": "03 · Content of the offer",
    "04 · Testversion": "04 · Test version",
    "05 · Verantwortlichkeit": "05 · Responsibility",
    "06 · Haftungsausschluss": "06 · Disclaimer",
    "07 · Urheberrecht": "07 · Copyright",
    "08 · Streitbeilegung": "08 · Dispute resolution",
    "09 · Projektseiten": "09 · Project pages"
  };

  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };

  function trVal(deVal, lang) {
    if (lang !== 'en') return deVal;
    var key = (deVal || '').trim();
    if (!key) return deVal;
    var en = DICT[key];
    if (en === undefined) return deVal;
    return deVal.replace(key, en);
  }

  /* ---- Textknoten übersetzen (mit Merken der Quelle für Dynamik) ---- */
  function translateTextNode(n, lang) {
    // Wenn der aktuelle Wert nicht unser zuletzt gesetzter ist, hat die App
    // den Text geändert -> neue Quelle merken.
    if (n.__i18nLast === undefined || n.__i18nLast !== n.nodeValue) {
      n.__i18nDe = n.nodeValue;
    }
    var target = trVal(n.__i18nDe, lang);
    if (n.nodeValue !== target) n.nodeValue = target;
    n.__i18nLast = target;
  }

  function translateAttrs(el, lang) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      el.__i18nAttr = el.__i18nAttr || {};
      var cur = el.getAttribute(a);
      if (el.__i18nAttr[a + '_last'] === undefined || el.__i18nAttr[a + '_last'] !== cur) {
        el.__i18nAttr[a + '_de'] = cur;
      }
      var t = trVal(el.__i18nAttr[a + '_de'], lang);
      if (cur !== t) el.setAttribute(a, t);
      el.__i18nAttr[a + '_last'] = t;
    }
    // Button-/Submit-Value
    if (el.tagName === 'INPUT') {
      var ty = (el.getAttribute('type') || '').toLowerCase();
      if (ty === 'button' || ty === 'submit') {
        el.__i18nAttr = el.__i18nAttr || {};
        var v = el.value;
        if (el.__i18nAttr.value_last === undefined || el.__i18nAttr.value_last !== v) el.__i18nAttr.value_de = v;
        var tv = trVal(el.__i18nAttr.value_de, lang);
        if (v !== tv) el.value = tv;
        el.__i18nAttr.value_last = tv;
      }
    }
  }

  function translate(root, lang) {
    if (!root) return;
    if (root.nodeType === 3) { translateTextNode(root, lang); return; }
    if (root.nodeType !== 1) return;
    if (SKIP[root.nodeName]) return;
    // Attribute des Wurzelelements
    translateAttrs(root, lang);
    // Textknoten + Elemente
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) return SKIP[n.nodeName] ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    // Elemente separat für Attribute einsammeln
    var els = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (var i = 0; i < els.length; i++) { if (!SKIP[els[i].nodeName]) translateAttrs(els[i], lang); }
    var t;
    while ((t = walker.nextNode())) { if (t.nodeType === 3) translateTextNode(t, lang); }
  }

  var observer = null;
  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(function (muts) {
      if (currentLang() !== 'en') return;
      observer.disconnect();
      try {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type === 'childList') {
            for (var j = 0; j < m.addedNodes.length; j++) translate(m.addedNodes[j], 'en');
          } else if (m.type === 'characterData') {
            translateTextNode(m.target, 'en');
          } else if (m.type === 'attributes' && m.target.nodeType === 1) {
            translateAttrs(m.target, 'en');
          }
        }
      } finally {
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function currentLang() {
    try { return localStorage.getItem('ls_lang') || ''; } catch (e) { return ''; }
  }

  function setLang(lang) {
    lang = (lang === 'en') ? 'en' : 'de';
    try { localStorage.setItem('ls_lang', lang); } catch (e) {}
    document.documentElement.setAttribute('lang', lang);
    translate(document.body, lang);
    var btn = document.getElementById('lsLangToggle');
    if (btn) btn.textContent = (lang === 'en') ? 'DE' : 'EN';
  }

  function initialLang() {
    var stored = currentLang();
    if (stored === 'de' || stored === 'en') return stored;
    var nav = (navigator.language || navigator.userLanguage || 'de').toLowerCase();
    return nav.indexOf('de') === 0 ? 'de' : 'en';
  }

  function injectToggle() {
    if (document.getElementById('lsLangToggle')) return;
    var b = document.createElement('button');
    b.id = 'lsLangToggle';
    b.type = 'button';
    b.setAttribute('aria-label', 'Sprache umschalten / Switch language');
    b.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:100001;width:46px;height:46px;border-radius:50%;' +
      'background:rgba(0,0,0,.78);color:#fff;border:1px solid rgba(255,31,110,.6);font:700 14px/1 system-ui,sans-serif;' +
      'cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.45)';
    b.onclick = function () { setLang(currentLang() === 'en' ? 'de' : 'en'); };
    (document.body || document.documentElement).appendChild(b);
  }

  function boot() {
    injectToggle();
    startObserver();
    setLang(initialLang());
  }

  window.LS_I18N = { setLang: setLang, translate: function () { translate(document.body, currentLang() === 'en' ? 'en' : 'de'); }, dict: DICT };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
