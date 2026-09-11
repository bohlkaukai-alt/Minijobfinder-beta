# MiniJob Finder

MiniJob Finder ist eine Web-App, mit der Nutzer kleine Jobs, Hilfsangebote und Gesuche in ihrer Nähe finden, erstellen und verwalten können.

Die Website ist dafür gedacht, Menschen unkompliziert miteinander zu verbinden, wenn jemand Hilfe braucht oder selbst Hilfe anbieten möchte. Beispiele sind Nachhilfe, Gartenarbeit, Hundesitting, Babysitting, Einkaufen helfen, Computerhilfe oder Haushaltshilfe.

## Wozu ist die Website da?

Die Website soll eine einfache Plattform für kleine lokale Aufgaben sein.

Nutzer können:

- eigene MiniJobs erstellen
- Hilfe anbieten
- Hilfe suchen
- Jobs nach Kategorien filtern
- Jobs in der Nähe finden
- den eigenen Standort verwenden
- Jobs auf einer Karte ansehen
- andere Nutzer per Chat kontaktieren
- ungelesene Nachrichten sehen
- Bewertungen ansehen
- Feedback an den Admin senden
- das eigene Profil bearbeiten
- den eigenen Account löschen

## Ziel der App

Ziel ist eine moderne, einfache und für Handy, Tablet und PC nutzbare MiniJob-Plattform.

Die App soll besonders einfach bedienbar sein:

- auf dem Smartphone wie eine App
- auf dem PC mit breitem Layout
- mit Kartenansicht
- mit Chat-Funktion
- mit Profil und Einstellungen
- mit Datenschutz- und Cookie-Einstellungen

## Hauptfunktionen

### 1. Registrierung und Login

Nutzer können sich mit Name, E-Mail, Passwort und Geburtsdatum registrieren.

Bei der Registrierung muss die Datenschutzerklärung akzeptiert werden.

Zusätzlich gibt es eine E-Mail-Validierung, damit keine offensichtlich falschen oder ungültigen E-Mail-Adressen eingegeben werden.

### 2. Jobs suchen

Auf der Startseite werden verfügbare MiniJobs angezeigt.

Die Jobs können gefiltert werden nach:

- Suchbegriff
- Kategorie
- Art des Jobs
- Entfernung
- Standort

### 3. Jobs erstellen

Nutzer können eigene Anzeigen erstellen.

Dabei können angegeben werden:

- Titel
- Kategorie
- Beschreibung
- Ort oder Adresse
- Bezahlung
- ob Hilfe angeboten oder gesucht wird

### 4. Standort und Karte

Die App kann den Standort des Nutzers verwenden, wenn der Nutzer die Standortfreigabe erlaubt.

Der Standort wird genutzt für:

- Entfernung zu Jobs
- Umkreissuche
- Kartenansicht
- Standort-Nadel auf der Karte

Auf der Karte wird der eigene Standort sichtbar angezeigt.

### 5. Chat

Nutzer können andere Nutzer zu einem Job kontaktieren.

Die Chat-Funktion enthält:

- private Chats
- ungelesene Nachrichten
- Hinweis „Ungelesene Nachrichten“
- automatisches Scrollen zur ersten ungelesenen Nachricht
- Drei-Punkte-Menü wie bei WhatsApp
- Aktionen wie Anpinnen, als ungelesen markieren, melden und löschen

### 6. Profil

Im Profil können Nutzer eigene Informationen sehen und verwalten.

Dazu gehören:

- Name
- E-Mail
- Wohnort
- eigene Jobs
- Bewertungen
- Einstellungen
- Account löschen

### 7. Feedback an Admin

Nutzer können Feedback senden, zum Beispiel:

- Fehler melden
- Verbesserungsvorschläge senden
- sonstige Hinweise geben

Das Feedback wird in Firebase gespeichert, damit der Admin es prüfen kann.

### 8. Datenschutz und Cookies

Die Website enthält:

- Datenschutzerklärung
- Cookie-/Speicher-Banner
- Cookie-/Speicher-Einstellungen
- Möglichkeit, optionale lokale Daten zu löschen
- Möglichkeit, den Account zu löschen

Die App verwendet keine Werbe-Cookies. Es werden aber lokale Speicherfunktionen und Firebase genutzt, damit Login, Einstellungen, Standort, Chat und Jobs funktionieren.

## Technik

Die Website ist als statische Web-App aufgebaut und kann über GitHub Pages veröffentlicht werden.

Verwendete Technik:

- HTML
- CSS
- JavaScript
- Firebase Authentication
- Cloud Firestore
- Leaflet
- OpenStreetMap
- Nominatim
- Progressive Web App Funktionen
- Service Worker

## Firebase

Firebase wird verwendet für:

- Registrierung
- Login
- Passwortverarbeitung
- Nutzerprofile
- Jobs
- Chats
- Bewertungen
- Meldungen
- Feedback

Wichtig: Passwörter werden nicht als Klartext in Firestore gespeichert. Die Passwortverarbeitung läuft über Firebase Authentication.

## GitHub Pages Veröffentlichung

Damit die Website funktioniert, müssen die Dateien im Hauptverzeichnis des GitHub-Repositorys liegen.

Wichtige Dateien und Ordner:

```text
index.html
404.html
datenschutz.html
impressum.html
manifest.json
sw.js
assets/
.github/
README.md
```

In GitHub Pages sollte eingestellt werden:

```text
Deploy from branch
Branch: main
Folder: /root
```

Die Website ist danach normalerweise erreichbar unter:

```text
https://BENUTZERNAME.github.io/REPOSITORY-NAME/
```

## Wichtige Einstellungen in Firebase

Damit Login und Datenbank funktionieren, müssen in Firebase passende Einstellungen vorgenommen werden.

### Authentication

Aktivieren:

- E-Mail/Passwort Anmeldung

Bei autorisierten Domains muss die GitHub-Pages-Domain eingetragen sein, zum Beispiel:

```text
BENUTZERNAME.github.io
```

### Firestore

Cloud Firestore muss aktiviert sein.

Außerdem müssen Firestore-Regeln so gesetzt werden, dass angemeldete Nutzer die App verwenden können, aber keine fremden Daten unkontrolliert verändern dürfen.

## Datenschutz-Hinweis

Die App verarbeitet personenbezogene Daten, z. B.:

- Name
- E-Mail-Adresse
- Standortdaten
- Job-Anzeigen
- Chat-Nachrichten
- Bewertungen
- Feedback
- technische Nutzungsdaten

Deshalb enthält die Website eine Datenschutzerklärung.

Vor einer echten öffentlichen Nutzung sollten folgende Punkte geprüft werden:

- Betreiberangaben im Impressum ergänzen
- Betreiberangaben in der Datenschutzerklärung ergänzen
- Firebase-Auftragsverarbeitung prüfen
- Firestore-Regeln absichern
- vollständige Löschroutine für Nutzer, Jobs, Chats und Bewertungen prüfen
- Nutzung durch Minderjährige rechtlich prüfen

## Dateien im Projekt

### Hauptdateien

- `index.html`  
  Startseite der App

- `404.html`  
  Fehlerseite für GitHub Pages

- `datenschutz.html`  
  Datenschutzerklärung

- `impressum.html`  
  Impressum mit Social-Media-Links

- `manifest.json`  
  PWA-Konfiguration

- `sw.js`  
  Service Worker für Cache und PWA-Funktionen

### JavaScript

- `assets/js/core.js`  
  Grundfunktionen, Firebase, globale Variablen, Standort, Hilfsfunktionen

- `assets/js/auth.js`  
  Login, Registrierung und E-Mail-Validierung

- `assets/js/jobs.js`  
  Jobs anzeigen, erstellen, bearbeiten und löschen

- `assets/js/map.js`  
  Kartenansicht und Standort-Nadel

- `assets/js/chat.js`  
  Grundfunktionen für Chats

- `assets/js/profile.js`  
  Profil, Einstellungen, Feedback und Account löschen

- `assets/js/features.js`  
  Erweiterte Funktionen und Tutorial

- `assets/js/quality.js`  
  Verbesserungen für Chat, Feedback, Performance, Badges und Layout

- `assets/js/cookies.js`  
  Cookie- und Speicher-Einstellungen

- `assets/js/social.js`  
  Instagram- und TikTok-Links

- `assets/js/device.js`  
  Geräteerkennung für Handy, Tablet und PC

- `assets/js/theme.js`  
  Hell-/Dunkelmodus

- `assets/js/navigation.js`  
  Navigation zwischen den Seiten

- `assets/js/app-init.js`  
  Start der App

### CSS

- `assets/css/style.css`  
  Design, Layout, mobile Ansicht, PC-Ansicht, Chat, Tutorial und rechtliche Seiten

## Social-Media-Links anpassen

Die Links für Instagram und TikTok können in dieser Datei angepasst werden:

```text
assets/js/social.js
```

Dort stehen diese Werte:

```js
window.MINIJOB_SOCIAL_LINKS = {
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/"
};
```

Hier müssen die echten Profil-Links eingetragen werden.

## Aktueller Stand

Die App enthält bereits:

- modernes responsives Layout
- PC-Layout mit dynamischer Breite
- mobile Optimierungen
- Standortfunktion mit Karte und Nadel
- Chat mit ungelesenen Nachrichten
- Drei-Punkte-Menü im Chat
- PWA-Unterstützung
- Cookie-/Speicher-Einstellungen
- Datenschutzerklärung
- Impressum
- Account löschen
- Feedback an Admin
- E-Mail-Validierung
- Tutorial mit Highlight-Funktion

## Noch zu prüfen

Vor der echten Nutzung sollten diese Punkte getestet werden:

- Registrierung mit echter E-Mail
- E-Mail-Bestätigung über Firebase
- Login auf Handy und PC
- Standortfreigabe auf Handy und PC
- Job erstellen
- Job suchen
- Chat starten
- ungelesene Nachrichten
- Feedback senden
- Account löschen
- Firestore Security Rules
- Darstellung als installierte PWA
- Impressum und Datenschutz mit echten Betreiberdaten

## Hinweis

Dieses Projekt ist eine Web-App-Vorlage. Für eine produktive Veröffentlichung müssen Datenschutz, Impressum, Firebase-Regeln und Löschkonzept sorgfältig geprüft und angepasst werden.

## Update: Passwort vergessen

Neu hinzugefügt:
- `passwort-zuruecksetzen.html`

Geändert:
- `assets/js/auth.js`
- `assets/js/features.js`
- `assets/css/style.css`
- `sw.js`
- `README.md`

Umgesetzt:
- Auf der Login-Seite gibt es jetzt den Button `Passwort vergessen?`.
- Nutzer geben ihre registrierte E-Mail-Adresse ein.
- Firebase verschickt eine Passwort-Zurücksetzen-Mail.
- Der Link führt zur Seite `passwort-zuruecksetzen.html`.
- Dort kann der Nutzer ein neues Passwort setzen.
- Das neue Passwort muss mindestens 8 Zeichen haben.
- Das Passwort muss zur Sicherheit zweimal eingegeben werden.

## Update: Passwort-Empfehlungen

Geändert:
- `assets/js/auth.js`
- `assets/js/features.js`
- `assets/css/style.css`
- `passwort-zuruecksetzen.html`
- `sw.js`
- `README.md`

Umgesetzt:
- Beim Anklicken eines Passwortfelds erscheint eine Passwort-Hilfe.
- Die Hilfe zeigt typische Empfehlungen:
  - mindestens 8 Zeichen
  - mindestens 1 Großbuchstabe
  - mindestens 1 Kleinbuchstabe
  - mindestens 1 Zahl
  - mindestens 1 Sonderzeichen
- Beim Tippen werden erfüllte Regeln live abgehakt.
- Registrierung und Passwort-Zurücksetzen prüfen diese Regeln.

## Update: Passwort-Reset direkt beim Login

Geändert:
- `assets/js/auth.js`
- `assets/js/features.js`
- `assets/css/style.css`
- `sw.js`
- `README.md`

Umgesetzt:
- Auf der Login-Seite ist `Passwort vergessen?` direkt sichtbar.
- Nutzer können dort ihre registrierte E-Mail-Adresse eingeben.
- Firebase sendet eine Reset-Mail.
- Der Reset-Link führt auf `passwort-zuruecksetzen.html`.
- Dort kann ein neues Passwort gesetzt werden.

## Update: Passwort-Empfehlung nur bei Registrierung

Geändert:
- `assets/js/auth.js`
- `assets/js/features.js`
- `passwort-zuruecksetzen.html`
- `assets/css/style.css`
- `sw.js`
- `README.md`

Umgesetzt:
- Die Passwort-Empfehlungen erscheinen nur noch beim Registrieren.
- Beim Login wird keine Passwort-Empfehlung mehr angezeigt.
- Beim Passwort-Zurücksetzen wird keine Passwort-Empfehlung mehr angezeigt.
- Die Passwort-Regeln bleiben technisch weiterhin aktiv.

## Update: Admin-Seite mit GitHub-Authentifizierung

Neu hinzugefügt:
- `admin.html`
- `assets/js/admin.js`
- `firestore.rules.admin-example`

Geändert:
- `assets/css/style.css`
- `assets/js/profile.js`
- `assets/js/features.js`
- `assets/js/social.js`
- `sw.js`
- `README.md`

Umgesetzt:
- Separate Admin-Seite unter `admin.html`.
- Admin-Anmeldung über GitHub mit Firebase Authentication.
- Admin-Freischaltung über Firestore-Dokument `admins/<Firebase-UID>`.
- Job-Übersicht mit Suche, Statusfilter und Sortierung.
- Jobs können durch Admins mit Pflicht-Grund gelöscht/ausgeblendet werden.
- Löschungen werden in `admin_logs` protokolliert.
- Gelöschte Jobs werden per Soft-Delete markiert, damit Grund und Historie erhalten bleiben.
- Wiederherstellen gelöschter Jobs mit Grund ist möglich.
- Beispiel-Regeln für Firestore liegen in `firestore.rules.admin-example`.

### Admin einrichten

1. Firebase Console öffnen.
2. Authentication → Sign-in method → GitHub aktivieren.
3. GitHub OAuth App Client-ID und Secret eintragen.
4. Einmal mit GitHub auf `admin.html` anmelden.
5. Die Firebase-UID des Nutzers kopieren.
6. In Firestore erstellen:

```text
Collection: admins
Document-ID: <Firebase-UID>
Felder:
enabled: true
role: owner
email: admin@example.de
github: github-benutzername
```

7. Firestore-Regeln aus `firestore.rules.admin-example` prüfen und übernehmen.

Wichtig: Die sichere Admin-Prüfung muss über Firestore-Regeln erfolgen. Eine reine Admin-Liste im JavaScript wäre nicht sicher.

## Update: Sicherheits- und Qualitätskorrekturen

Neu hinzugefügt:
- `assets/js/security-quality.js`

Geändert:
- `index.html`
- `admin.html`
- `assets/js/admin.js`
- `assets/css/style.css`
- `firestore.rules.admin-example`
- `sw.js`
- `README.md`

Umgesetzt:
- Kartensuche mit mehreren Adressvorschlägen ähnlich Suchcompletion.
- Gleiche Stadtnamen werden über vollständige Vorschläge mit Bundesland/Land besser unterscheidbar.
- Wenn ein Ort nicht gefunden wird, wird automatisch Seesen als Fallback verwendet.
- Job-Erstellen speichert Eingaben als lokalen Entwurf, damit Chat-/Nachrichtenereignisse das Formular nicht leeren.
- Kostenfeld wird validiert: keine negativen Zahlen, kein Nullbetrag, Limit aktuell 500 €.
- E-Mail-Domainprüfung nutzt jetzt eine Whitelist statt nur Blacklist.
- Wegwerf-Domains wie `sharklasers.com` werden blockiert.
- Plus-Aliase wie `name+abc@domain.de` werden für Ban-Prüfung normalisiert.
- E-Mail-Bans werden als SHA-256-Hash in `banned_emails` geprüft.
- Admin kann E-Mail-Adressen mit Grund sperren.
- E-Mail-Verifizierung wird für Passwort-Accounts erzwungen.
- Wortfilter für E-Mail-/Nutzernamen-/Profil-/Job-Texte vorbereitet.
- Illegale Jobbegriffe werden vor Veröffentlichung blockiert.
- Profanitätsniveau unterscheidet leichte Sprache von schweren Beleidigungen.
- Einfaches Reputations-Meter im Profil ergänzt.

Hinweis:
Die E-Mail-Hash-Sperre ist clientseitig ohne geheimen Salt umgesetzt. Für maximale Sicherheit sollte später eine Cloud Function oder ein eigener Backend-Endpunkt verwendet werden.

## Update: Dynamisches Minijob-Limit

Neu hinzugefügt:
- `assets/js/minijob-limit.js`
- `assets/data/minijob-limit-fallback.json`

Geändert:
- `index.html`
- `admin.html`
- `assets/js/security-quality.js`
- `assets/css/style.css`
- `sw.js`
- `README.md`

Umgesetzt:
- Das feste 500-€-Limit wurde ersetzt.
- Die App versucht beim Start, das aktuelle Minijob-Monatslimit aus offiziellen Quellen online zu laden.
- Falls das online nicht möglich ist, nutzt die App lokale Fallback-Werte.
- Für 2026 ist als Fallback 603 € hinterlegt.
- Für 2027 ist als Fallback 633 € hinterlegt.
- Beim Job-Erstellen wird das aktuelle Minijob-Limit unter dem Kostenfeld angezeigt.
- Die Kostenprüfung nutzt das dynamische Limit.
- Im Admin-Bereich wird das aktuelle Limit ebenfalls angezeigt.

Hinweis:
Da eine reine GitHub-Pages-Website keine eigene Serverlogik hat, kann ein offizieller Wert nicht immer zuverlässig direkt aus Behörden-Webseiten ausgelesen werden, wenn CORS oder Netzwerkzugriff blockiert. Deshalb gibt es zusätzlich die lokale Fallback-Datei `assets/data/minijob-limit-fallback.json`.

## Update: index.html repariert

Geändert:
- `index.html`
- `assets/js/minijob-limit.js`
- `assets/js/security-quality.js`
- `sw.js`
- `README.md`

Umgesetzt:
- `index.html` wurde sauber neu aufgebaut.
- Script-Reihenfolge wurde stabilisiert.
- Doppelte/fehleranfällige Initialisierung im Kopfbereich wurde bereinigt.
- `minijob-limit.js` wurde robuster gemacht, damit ein fehlgeschlagener Online-Abruf die Startseite nicht beschädigt.
- Fallback-Funktionen ergänzt, damit die Seite nicht abstürzt, falls ein vorheriges Skript nicht vollständig geladen wurde.
- Service-Worker-Version erhöht, damit Browser nicht die kaputte alte Datei aus dem Cache verwenden.

## Update: E-Mail-Bestätigung Layout-Fix

Geändert:
- `index.html`
- `assets/js/security-quality.js`
- `assets/css/style.css`
- `sw.js`
- `README.md`

Umgesetzt:
- Die E-Mail-Bestätigungsseite nutzt jetzt wieder das App-Layout.
- Kritische Fallback-CSS wurde direkt in `index.html` ergänzt, damit die Seite nicht mehr im Browser-Standarddesign erscheint.
- Die untere Navigation wird auf der E-Mail-Bestätigungsseite hart ausgeblendet.
- Die Bestätigungsbuttons sind mobil sauber untereinander angeordnet.
- Service-Worker-Version erhöht, damit alte kaputte Cache-Dateien ersetzt werden.

## Update: Mobile Optimierung

Geändert:
- `assets/css/style.css`
- `index.html`
- `assets/js/device.js`
- `assets/js/social.js`
- `sw.js`
- `README.md`

Umgesetzt:
- Handy-Layout für iPhone und Android verbessert.
- Untere Navigation als moderne mobile App-Navigation optimiert.
- Header mobil sticky und kompakter gemacht.
- Karten, Job-Karten und Profilkarten mobil besser skaliert.
- Formulare und Buttons fingerfreundlicher gemacht.
- Eingabefelder verwenden mobil 16 px Schriftgröße, damit iOS nicht automatisch hineinzoomt.
- Kartenansicht nutzt die verfügbare Handyhöhe besser.
- Modale Fenster erscheinen mobil als Bottom-Sheet.
- Chat-Ansicht blendet die Navigation zuverlässiger aus.
- E-Mail-Bestätigungsseite und Passwortseiten mobil besser angepasst.
- Footer-Links mobil kompakter gemacht.
- Admin-Seite mobil nutzbarer gemacht.
- Service-Worker-Version erhöht.
