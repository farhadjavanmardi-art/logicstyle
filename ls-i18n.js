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
    "Fotomodell werden": "Become a photo model"
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
    b.style.cssText = 'position:fixed;top:12px;right:12px;z-index:100001;width:44px;height:44px;border-radius:50%;' +
      'background:rgba(0,0,0,.72);color:#fff;border:1px solid rgba(255,31,110,.55);font:700 13px/1 system-ui,sans-serif;' +
      'cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.4)';
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
