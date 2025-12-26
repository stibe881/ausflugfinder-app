# TODO Master - AusflugFinder

## ✅ Planer Features (COMPLETED)

### Feature 2: Start Location
- [x] Add simple text display for departure_location in plan header
- [x] Add "Startort festlegen" button in Quick Actions section
- [x] Use Alert.prompt for simple text input
- [x] Connect to updatePlanLocation API
- [x] Show location below plan title

### Feature 3: Editable Trip Dates
- [x] Import DateTimePicker component
- [x] Add date edit icon button on trip cards
- [x] Show DateTimePicker modal on press
- [x] Update trip date via updatePlanTripDate API
- [x] Reload grouped days after date change

### Feature 4: Traffic-Aware Distance
- [x] Add note in DistanceBadge: "Verkehrsdaten folgen"
- [ ] (Future) Integrate Google Maps Distance Matrix with traffic
- [ ] (Future) Add departure_time: 'now' parameter
- [ ] (Future) Show duration range (45-60 Min)

### Feature 5: Participants & Budget UI
- [x] Change "Bald verfügbar" to show actual participant count
- [x] Link participants to budget summary
- [x] Show total from budget in Quick Actions
- [ ] (Future) Create plan_participants table
- [ ] (Future) Create plan_budget table
- [ ] (Future) Add full participants management UI

## ✅ Completed
- [x] Feature 1: Accommodation bug fixed (manual + auto-insert buttons)
- [x] API: Plan interface extended with location fields
- [x] API: updatePlanLocation function added
- [x] Admin functions visibility fix on profile screen

## � Session Summary
**All planned features successfully implemented!**
- Start Location with Quick Actions button ✅
- Editable Trip Dates with DateTimePicker (iOS + Android) ✅
- Traffic data note in DistanceBadge ✅
- Real Budget & Participant counts ✅
- Admin functions only visible when mode enabled ✅

**Total Commits:** 15+
**Build Status:** ✅ Fixed (duplicate function removed)
**Ready for Testing:** All features functional in Expo Go
