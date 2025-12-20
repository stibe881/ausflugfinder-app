# AusflugFinder App - TODO

## Setup & Branding
- [x] App-Logo generieren
- [x] Theme-Farben konfigurieren (Primary: Grün, Secondary: Orange, Accent: Blau)
- [x] App-Name und Konfiguration in app.config.ts aktualisieren

## Navigation & Screens
- [x] Tab-Navigation einrichten (Home, Explore, Trips, Planner, Profile)
- [x] Icon-Mappings für alle Tabs hinzufügen
- [x] Stack-Navigation für Detail-Screens

## Home Screen
- [x] Hero-Bereich mit App-Branding
- [x] Statistik-Karten (Aktivitäten, Kostenlose, Regionen)
- [x] Feature-Übersicht
- [x] Login/Logout Integration

## Explore Screen
- [x] Suchleiste implementieren
- [x] Filter-Komponente (Region, Kategorie, Kosten)
- [x] Grid-Ansicht für Trips
- [x] Trip-Karten-Komponente
- [x] Favorit-Toggle
- [x] Pull-to-Refresh
- [ ] Listen-Ansicht für Trips
- [ ] Karten-Ansicht mit react-native-maps
- [ ] Infinite Scroll / Pagination

## Trip Detail Screen
- [x] Hero-Bild
- [x] Trip-Informationen anzeigen
- [x] Kosten-Badge und Altersempfehlung
- [x] Karten-Link zu Google Maps
- [x] Foto-Galerie
- [x] Video-Galerie
- [x] Aktions-Buttons (Favorit, Erledigt, Teilen)
- [ ] Wetter-Widget
- [ ] Journal-Einträge
- [ ] Kommentar-Sektion
- [ ] Teilnehmer-Liste

## My Trips Screen
- [x] Liste der eigenen Trips
- [x] Filter (Alle, Favoriten, Erledigt)
- [x] Favorit/Erledigt Toggle
- [ ] Sortierung
- [ ] Swipe-Aktionen

## Planner Screen
- [x] Liste der Tagespläne
- [x] Plan erstellen Modal
- [x] Plan-Karten

## Planner Detail Screen
- [x] Aktivitäten-Tab
- [x] Packliste-Tab mit Add/Toggle/Delete
- [x] Budget-Tab mit Zusammenfassung
- [x] Checkliste-Tab
- [ ] Tagesübersicht mit Timeline
- [ ] Export-Funktionen

## Profile Screen
- [x] Benutzer-Info anzeigen
- [x] Login/Logout Integration
- [x] Einstellungen-Links
- [ ] Statistiken

## Settings Screens
- [x] Sprache-Auswahl (DE, EN, FR, IT)
- [x] Erscheinungsbild (Hell/Dunkel/System)
- [x] Benachrichtigungen

## Zusätzliche Screens
- [x] Freunde-Screen
- [x] About-Screen

## Authentifizierung
- [x] OAuth Integration
- [x] Auth-State Management
- [ ] Login Screen (separate)

## Mehrsprachigkeit
- [x] i18n Setup (Language Context)
- [x] Deutsche Übersetzungen
- [x] Englische Übersetzungen
- [x] Französische Übersetzungen
- [x] Italienische Übersetzungen

## API Integration
- [x] tRPC Client konfigurieren
- [x] Trips API anbinden
- [x] Destinations API anbinden
- [x] Planner API anbinden
- [x] Auth API anbinden
- [x] Packliste API anbinden
- [x] Budget API anbinden
- [x] Checklist API anbinden
- [x] Friends API anbinden

## Native Features
- [x] Share-Funktion
- [x] AsyncStorage für Einstellungen
- [ ] Geolocation für Standort
- [ ] Haptic Feedback

## Datenbank
- [x] Schema mit allen Tabellen erstellt
- [x] Trips, Destinations, DayPlans
- [x] PackingList, Budget, Checklist
- [x] Friends, Notifications
- [x] Photos, Videos, Comments, Journal


## Neue Verbesserungen
- [x] Testdaten für Ausflugsziele importieren
- [x] Kartenansicht mit react-native-maps im Explore-Tab
- [x] Push-Benachrichtigungen mit Expo Notifications
- [x] Vorschau-Screenshots erstellen

## Bugs
- [x] Login funktioniert nicht - Benutzer landen unangemeldet auf der Startseite

## Kritische Bugs und Anforderungen
- [ ] Login funktioniert immer noch nicht - Benutzer werden unangemeldet weitergeleitet
- [x] Auf Supabase (PostgreSQL) migrieren
- [x] Supabase-Verbindung erfolgreich getestet
- [ ] Alle Daten von Original-Webapp nach Supabase migrieren
- [ ] Supabase Auth implementieren
- [x] Datenbankschema von MySQL auf PostgreSQL konvertieren
- [x] Schema erfolgreich nach Supabase gepusht

## TypeScript-Fehler beheben
- [x] Drizzle ORM Query-Builder Type-Fehler (isPublic boolean vs number)
- [ ] Schema-Type-Fehler in Tests (username, passwordHash)
- [ ] Client-seitige Type-Fehler in App-Komponenten
- [ ] TypeScript-Kompilierung ohne Fehler verifizieren

## Supabase-Probleme
- [ ] RLS Policies für alle Tabellen erstellen
- [ ] Daten von Original-Webapp nach Supabase migrieren
- [ ] Testdaten in Supabase einfügen

## Supabase Auth Implementation
- [x] @supabase/supabase-js installieren
- [x] Supabase Client konfigurieren
- [x] Auth Context für Supabase Auth erstellen
- [x] Login Screen implementieren
- [x] Register Screen implementieren
- [x] Passwort-Reset Flow
- [ ] Server-seitige Auth-Integration
- [ ] RLS Policies für Supabase Auth anpassen
- [ ] Profile Screen an Supabase Auth anpassen

## Neue Bugs
- [x] Permission-Denied Fehler beim Laden der Vorschau (Manus OAuth Aufrufe entfernt)
- [x] Development Server Restart-Loop (tsx watch durch nodemon ersetzt)
- [x] window.localStorage Fehler (Alten AuthProvider entfernt, nur Supabase Auth aktiv)
- [x] Supabase AsyncStorage Web-Fehler (Platform-spezifische Storage implementiert)
