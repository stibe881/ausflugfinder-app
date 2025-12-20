# AusflugFinder App - Design Document

## App Overview
AusflugFinder ist eine mobile App zum Entdecken und Planen von Ausflügen in der Schweiz und Umgebung. Die App ermöglicht es Benutzern, Ausflugsziele zu durchsuchen, Tagesausflüge zu planen und ihre Erlebnisse zu dokumentieren.

---

## Screen List

### 1. Home Screen (Tab: Home)
- Hero-Bereich mit App-Branding und animierten Icons
- Statistiken (Anzahl Aktivitäten, kostenlose Aktivitäten, Regionen)
- Feature-Übersicht mit Icons
- Quick-Action Buttons (Explore, Profile)
- Login/Logout Status

### 2. Explore Screen (Tab: Explore)
- Suchleiste mit Keyword-Suche
- Filter-Optionen (Region, Kategorie, Kosten, Entfernung)
- Ansichtsmodi: Grid, Liste, Karte
- Kategorie-Chips zur Schnellfilterung
- Trip-Karten mit Bild, Titel, Ort, Kosten-Badge
- Favoriten-Toggle auf jeder Karte

### 3. Trip Detail Screen
- Hero-Bild mit Parallax-Effekt
- Trip-Informationen (Titel, Beschreibung, Adresse)
- Kosten-Badge und Altersempfehlung
- Interaktive Karte mit Standort
- Wetter-Widget für den Standort
- Foto-Galerie (Swipe-Carousel)
- Video-Galerie (YouTube/TikTok Embeds)
- Reise-Tagebuch (Journal-Einträge)
- Kommentar-Sektion
- Teilnehmer-Liste
- Aktions-Buttons (Favorit, Erledigt, Teilen)

### 4. My Trips Screen (Tab: Trips)
- Liste der eigenen/gespeicherten Trips
- Filter: Alle, Favoriten, Erledigt, Geplant
- Sortierung nach Datum, Name
- Swipe-Aktionen (Bearbeiten, Löschen)

### 5. Planner Screen (Tab: Planner)
- Liste der Tagespläne
- Neuen Plan erstellen Button
- Plan-Karten mit Titel, Datum, Anzahl Aktivitäten

### 6. Planner Detail Screen
- Tagesübersicht mit Timeline
- Drag & Drop Aktivitäten-Reihenfolge
- Zeitslots für jede Aktivität
- Packliste mit Checkboxen
- Budget-Tracker (Kategorien, geschätzt vs. tatsächlich)
- Checkliste für Aufgaben
- Export-Optionen (PDF, iCal)

### 7. Profile Screen (Tab: Profile)
- Benutzer-Avatar und Name
- Statistiken (Trips, Favoriten, Erledigte)
- Einstellungen-Link
- Theme-Toggle (Hell/Dunkel)
- Sprach-Auswahl (DE, EN, FR, IT)
- Logout-Button
- Account löschen

### 8. Settings Screen
- Benachrichtigungen
- Datenschutz
- Impressum
- AGB

### 9. Login Screen
- OAuth Login Button
- App-Logo und Willkommenstext

### 10. Friends Screen (Optional Tab)
- Freundesliste
- Freundschaftsanfragen
- Freunde suchen

---

## Primary Content and Functionality

### Home Screen
- **Content**: App-Logo, animierte Icons (Berg, Sonne, Kompass), Statistik-Karten, Feature-Liste
- **Functionality**: Navigation zu Explore/Profile, Login/Logout

### Explore Screen
- **Content**: Trip-Karten mit Thumbnail, Titel, Ort, Kosten-Badge, Favorit-Icon
- **Functionality**: 
  - Suche nach Keywords
  - Filter nach Region (26 Schweizer Kantone + Nachbarländer)
  - Filter nach Kategorie (Wandern, Schwimmen, Museum, etc.)
  - Filter nach Kosten (Kostenlos, CHF 🪙 bis 🪙🪙🪙🪙)
  - Standort-basierte Filterung (in der Nähe)
  - Ansichtswechsel (Grid/Liste/Karte)
  - Favorit togglen

### Trip Detail
- **Content**: Vollständige Trip-Informationen, Medien-Galerien, Wetter, Karte
- **Functionality**:
  - Zu Favoriten hinzufügen
  - Als erledigt markieren
  - Fotos hinzufügen
  - Videos hinzufügen
  - Journal-Einträge schreiben
  - Kommentare hinterlassen
  - Zum Tagesplan hinzufügen

### Planner
- **Content**: Tagesplan mit Aktivitäten, Zeiten, Packliste, Budget
- **Functionality**:
  - Neuen Plan erstellen
  - Aktivitäten hinzufügen/entfernen
  - Reihenfolge ändern
  - Zeiten festlegen
  - Packliste verwalten
  - Budget tracken
  - Plan exportieren

---

## Key User Flows

### 1. Ausflug entdecken
1. User öffnet App → Home Screen
2. Tippt auf "Entdecken" → Explore Screen
3. Gibt Suchbegriff ein oder wählt Kategorie
4. Scrollt durch Ergebnisse
5. Tippt auf Trip-Karte → Trip Detail Screen
6. Tippt Herz-Icon → Zu Favoriten hinzugefügt

### 2. Tagesausflug planen
1. User öffnet Planner Tab
2. Tippt "Neuer Plan" → Plan erstellen Modal
3. Gibt Titel und Datum ein
4. Navigiert zu Explore → wählt Trip
5. Tippt "Zum Plan hinzufügen"
6. Zurück zum Planner → Aktivität erscheint
7. Fügt Packliste-Items hinzu
8. Trägt Budget ein

### 3. Erlebnis dokumentieren
1. User öffnet Trip Detail eines besuchten Trips
2. Tippt "Als erledigt markieren"
3. Fügt Fotos aus Galerie hinzu
4. Schreibt Journal-Eintrag
5. Bewertet den Ausflug

---

## Color Choices

### Primary Palette (basierend auf Original-Webapp)
- **Primary**: `#22C55E` (Grün - Natur/Outdoor)
- **Secondary**: `#F59E0B` (Orange/Gelb - Sonne/Energie)
- **Accent**: `#3B82F6` (Blau - Kompass/Navigation)

### Light Theme
- **Background**: `#FFFFFF`
- **Surface/Card**: `#F8FAFC`
- **Text Primary**: `#0F172A`
- **Text Secondary**: `#64748B`
- **Text Disabled**: `#94A3B8`
- **Border**: `#E2E8F0`

### Dark Theme
- **Background**: `#0F172A`
- **Surface/Card**: `#1E293B`
- **Text Primary**: `#F8FAFC`
- **Text Secondary**: `#94A3B8`
- **Text Disabled**: `#64748B`
- **Border**: `#334155`

### Semantic Colors
- **Success**: `#22C55E`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`
- **Info**: `#3B82F6`

### Cost Badges
- **Free**: `#22C55E` (Grün)
- **Low**: `#84CC16` (Lime)
- **Medium**: `#F59E0B` (Orange)
- **High**: `#F97316` (Dark Orange)
- **Very High**: `#EF4444` (Rot)

---

## Typography

- **Title (Hero)**: 32pt, Bold
- **Title (Screen)**: 28pt, Bold
- **Subtitle**: 20pt, SemiBold
- **Body**: 16pt, Regular
- **Body Small**: 14pt, Regular
- **Caption**: 12pt, Regular
- **Button**: 16pt, SemiBold

---

## Spacing & Layout

- **Base Unit**: 8pt
- **Screen Padding**: 16pt
- **Card Padding**: 16pt
- **Card Gap**: 12pt
- **Section Gap**: 24pt
- **Button Height**: 48pt (Touch Target)
- **Input Height**: 48pt
- **Tab Bar Height**: 49pt + Safe Area

---

## Component Styles

### Cards
- **Border Radius**: 16pt
- **Shadow**: Subtle elevation
- **Background**: Surface color

### Buttons
- **Border Radius**: 12pt
- **Primary**: Filled with Primary color
- **Secondary**: Outlined with border
- **Ghost**: Text only

### Inputs
- **Border Radius**: 12pt
- **Border**: 1pt solid Border color
- **Focus**: Primary color border

### Badges
- **Border Radius**: 8pt
- **Padding**: 4pt 8pt
- **Font Size**: 12pt

---

## Navigation Structure

```
Tab Navigator
├── Home (house.fill)
├── Explore (magnifyingglass)
├── Trips (heart.fill)
├── Planner (calendar)
└── Profile (person.fill)

Stack Screens (Modal/Push)
├── Trip Detail
├── Planner Detail
├── Settings
├── Login
├── Filter Sheet (Bottom Sheet)
└── Create Trip Wizard
```

---

## Native Features to Implement

1. **Geolocation**: Standort für "In der Nähe" Filter
2. **Maps**: Native Kartenansicht mit Markern
3. **Camera/Gallery**: Fotos zu Trips hinzufügen
4. **Haptic Feedback**: Bei Interaktionen
5. **Push Notifications**: Trip-Erinnerungen
6. **Share**: Trips teilen
7. **AsyncStorage**: Offline-Favoriten
8. **Secure Storage**: Auth-Token

---

## Animations

- **Screen Transitions**: Slide/Fade
- **Card Press**: Scale down 0.98
- **Favorite Toggle**: Heart bounce
- **Pull to Refresh**: Native indicator
- **Skeleton Loading**: Shimmer effect
- **Tab Switch**: Smooth crossfade
