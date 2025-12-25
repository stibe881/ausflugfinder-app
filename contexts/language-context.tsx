import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "de" | "en" | "fr" | "it";


type Translations = {
  // Navigation
  home: string;
  explore: string;
  trips: string;
  planner: string;
  profile: string;
  // Home Screen
  welcome: string;
  discoverTitle: string;
  discoverSubtitle: string;
  exploreButton: string;
  loginButton: string;
  logoutButton: string;
  // Explore Screen
  searchPlaceholder: string;
  noResults: string;
  tryDifferent: string;
  all: string;
  free: string;
  cheap: string;
  medium: string;
  expensive: string;
  // Trips Screen
  myTrips: string;
  savedTrips: string;
  favorites: string;
  done: string;
  noTrips: string;
  discoverTrips: string;
  // Planner Screen
  plannerTitle: string;
  noPlan: string;
  createPlan: string;
  activities: string;
  packingList: string;
  budget: string;
  checklist: string;
  // Profile Screen
  settings: string;
  notifications: string;
  language: string;
  appearance: string;
  friends: string;
  share: string;
  about: string;
  privacy: string;
  feedback: string;
  account: string;
  deleteAccount: string;
  // Common
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  add: string;
  back: string;
  loading: string;
  error: string;
  success: string;
  loginRequired: string;
  loginToAccess: string;
  // Seasons
  spring: string;
  summer: string;
  autumn: string;
  winter: string;
  // Cost Labels
  costFree: string;
  costCheap: string;
  costMedium: string;
  costExpensive: string;
  costVeryExpensive: string;
  // Trip Detail
  openMap: string;
  website: string;
  markAsDone: string;
  markAsFavorite: string;
  saveTrip: string;
  removeFromSaved: string;
  removeFromFavorites: string;
  markAsNotDone: string;
  // Delete Confirmations
  deleteTrip: string;
  deleteTripConfirm: string;
  deleted: string;
  deletedSuccess: string;
  deleteError: string;
  // Weather
  weatherTitle: string;
  forecast3Day: string;
  // Admin
  adminSection: string;
  adminEdit: string;
  adminDelete: string;
  // Trip Edit
  editTrip: string;
  tripName: string;
  tripDescription: string;
  streetAddress: string;
  zipCode: string;
  city: string;
  latitude: string;
  longitude: string;
  websiteUrl: string;
  category: string;
  costLevel: string;
  season: string;
  updateSuccess: string;
  updateError: string;
  // Errors
  errorOccurred: string;
  tryAgain: string;
  notFound: string;
  // Explore Screen Extended
  activitiesWaiting: string;
  searchTrips: string;
  noResultsFound: string;
  tryDifferentTerms: string;
  sortBy: string;
  sortByName: string;
  sortByDistance: string;
  sortByPriceAsc: string;
  sortByPriceDesc: string;
  sortByRegion: string;
  // Admin Create/Edit
  createTrip: string;
  chooseImage: string;
  permissionRequired: string;
  pleaseAllowPhotoAccess: string;
  pleaseEnterName: string;
  pleaseEnterAddress: string;
  successfullyCreated: string;
  successfullyUpdated: string;
  // Home Screen
  discoverSwitzerlandTitle: string;
  discoverSwitzerlandSub: string;
  freeActivitiesLabel: string;
  searchHundredsDescription: string;
  findNearbyDescription: string;
  // Common UI
  doneButton: string;
  close: string;
  name: string;
  description: string;
  address: string;
  // Empty States
  noActivitiesYet: string;
  discoverAndSave: string;
  // Trips Screen
  myTripsTab: string;
  savedActivities: string;
  allFilter: string;
  removeFromTrips: string;
  removeConfirm: string;
  remove: string;
  removed: string;
  removeFailed: string;
  favoriteFailed: string;
  markFailed: string;
  // Profile
  manageTrips: string;
  loginToManage: string;
  deleteAccountConfirm: string;
  deleteAllData: string;
  continueAction: string;
  // Home Screen Extended
  statistics: string;
  statsActivities: string;  // Renamed from activities to avoid duplicate
  regions: string;
  whatAwaits: string;
  perfectTrip: string;
  exploreDiscoverTrips: string;  // Renamed from discoverTrips to avoid duplicate
  discoverTripsDesc: string;
  dayPlanning: string;
  dayPlanningDesc: string;
  shareWithFriends: string;
  planAdventures: string;
  findNearbyDesc: string;
  // Planner
  myPlans: string;
  noPlansYet: string;
  createFirstPlan: string;
  // Trip Detail Sections
  descriptionTitle: string;
  detailsTitle: string;
  equipmentTitle: string;
  tripWeatherTitle: string;  // Renamed from weatherTitle to avoid duplicate
  categories: string;
  duration: string;
  tripSeason: string;  // Renamed from season to avoid duplicate
  difficulty: string;
  accessibility: string;
  // Detail Labels
  region: string;
  goodToKnow: string;
  parking: string;
  publicTransport: string;
  restaurantNearby: string;
  wheelchairAccessible: string;
  dogFriendly: string;
  childFriendly: string;
  openingHours: string;
  // Common
  yes: string;
  no: string;
  // Profile Screen Extended
  welcomeToApp: string;
  loginPromptText: string;
  login: string;
  register: string;
  generalSection: string;
  profileLocation: string;  // Renamed from location
  locationSubtitle: string;
  profileNotifications: string;  // Renamed from notifications
  notificationsSubtitle: string;
  profileLanguage: string;  // Renamed from language
  profileAppearance: string;  // Renamed from appearance
  appearanceSubtitle: string;
  socialSection: string;
  profileFriends: string;  // Renamed from friends
  friendsSubtitle: string;
  profileShare: string;  // Renamed from share
  shareSubtitle: string;
  shareMessage: string;
  supportSection: string;
  profileAbout: string;  // Renamed from about
  profilePrivacy: string;  // Renamed from privacy
  sendFeedback: string;
  accountSection: string;
  logout: string;
  logoutConfirm: string;
  logoutMessage: string;
  adminActionsSection: string;
  newTrip: string;
  newTripSubtitle: string;
  pushNotifications: string;
  broadcastSubtitle: string;
  adminMode: string;
  adminModeActive: string;
  adminModeInactive: string;
};

const translations: Record<Language, Translations> = {
  de: {
    // Navigation
    home: "Home",
    explore: "Entdecken",
    trips: "Trips",
    planner: "Planer",
    profile: "Profil",
    // Home Screen
    welcome: "Willkommen",
    discoverTitle: "Entdecke die Schweiz",
    discoverSubtitle: "Finde die schönsten Ausflugsziele",
    exploreButton: "Entdecken",
    loginButton: "Anmelden",
    logoutButton: "Abmelden",
    // Explore Screen
    searchPlaceholder: "Suche nach Ausflügen...",
    noResults: "Keine Ergebnisse",
    tryDifferent: "Versuche andere Suchbegriffe",
    all: "Alle",
    free: "Kostenlos",
    cheap: "Günstig",
    medium: "Mittel",
    expensive: "Teuer",
    // Trips Screen
    myTrips: "Meine Trips",
    savedTrips: "gespeicherte Ausflüge",
    favorites: "Favoriten",
    done: "Erledigt",
    noTrips: "Noch keine Trips gespeichert",
    discoverTrips: "Entdecke Ausflugsziele",
    // Planner Screen
    plannerTitle: "Planer",
    noPlan: "Noch keine Pläne erstellt",
    createPlan: "Plan erstellen",
    activities: "Aktivitäten",
    packingList: "Packliste",
    budget: "Budget",
    checklist: "Checkliste",
    // Profile Screen
    settings: "Einstellungen",
    notifications: "Benachrichtigungen",
    language: "Sprache",
    appearance: "Erscheinungsbild",
    friends: "Freunde",
    share: "Teilen",
    about: "Über AusflugFinder",
    privacy: "Datenschutz",
    feedback: "Feedback",
    account: "Konto",
    deleteAccount: "Konto löschen",
    // Common
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    edit: "Bearbeiten",
    add: "Hinzufügen",
    back: "Zurück",
    loading: "Laden...",
    error: "Fehler",
    success: "Erfolg",
    loginRequired: "Anmeldung erforderlich",
    loginToAccess: "Melde dich an, um diese Funktion zu nutzen",
    // Seasons
    spring: "Frühling",
    summer: "Sommer",
    autumn: "Herbst",
    winter: "Winter",
    // Cost Labels
    costFree: "Kostenlos",
    costCheap: "Günstig (CHF 10-30)",
    costMedium: "Mittel (CHF 30-60)",
    costExpensive: "Teuer (CHF 60-100)",
    costVeryExpensive: "Sehr teuer (CHF 100+)",
    // Trip Detail
    openMap: "Karte öffnen",
    website: "Website",
    markAsDone: "Als erledigt markieren",
    markAsFavorite: "Als Favorit markieren",
    saveTrip: "Trip speichern",
    removeFromSaved: "Aus gespeicherten entfernen",
    removeFromFavorites: "Aus Favoriten entfernen",
    markAsNotDone: "Als nicht erledigt markieren",
    // Delete Confirmations
    deleteTrip: "Ausflug löschen",
    deleteTripConfirm: "Möchtest du diesen Ausflug wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    deleted: "Gelöscht",
    deletedSuccess: "Der Ausflug wurde erfolgreich gelöscht.",
    deleteError: "Fehler beim Löschen.",
    // Weather
    weatherTitle: "Wetter",
    forecast3Day: "3-Tage-Vorhersage",
    // Admin
    adminSection: "Administration",
    adminEdit: "Bearbeiten",
    adminDelete: "Löschen",
    // Trip Edit
    editTrip: "Ausflug bearbeiten",
    tripName: "Name",
    tripDescription: "Beschreibung",
    streetAddress: "Straße",
    zipCode: "PLZ",
    city: "Ort",
    latitude: "Breitengrad",
    longitude: "Längengrad",
    websiteUrl: "Website-URL",
    category: "Kategorie",
    costLevel: "Kostenstufe",
    season: "Saison",
    updateSuccess: "Erfolgreich aktualisiert",
    updateError: "Fehler beim Aktualisieren",
    // Errors
    errorOccurred: "Ein Fehler ist aufgetreten",
    tryAgain: "Bitte versuche es erneut",
    notFound: "Nicht gefunden",
    // Explore Screen Extended
    activitiesWaiting: "Ausflugsziele warten auf dich",
    searchTrips: "Suche nach Ausflügen...",
    noResultsFound: "Keine Ausflüge gefunden",
    tryDifferentTerms: "Versuche andere Suchbegriffe oder Filter",
    sortBy: "Sortieren",
    sortByName: "Name",
    sortByDistance: "Entfernung",
    sortByPriceAsc: "Preis aufsteigend",
    sortByPriceDesc: "Preis absteigend",
    sortByRegion: "Region",
    // Admin Create/Edit
    createTrip: "Ausflug erstellen",
    chooseImage: "Bild auswählen",
    permissionRequired: "Berechtigung erforderlich",
    pleaseAllowPhotoAccess: "Bitte erlaube den Zugriff auf deine Fotos.",
    pleaseEnterName: "Bitte Name eingeben",
    pleaseEnterAddress: "Bitte Adresse eingeben",
    successfullyCreated: "Erfolgreich erstellt",
    successfullyUpdated: "Erfolgreich aktualisiert",
    // Home Screen
    discoverSwitzerlandTitle: "Entdecke die Schweiz",
    discoverSwitzerlandSub: "Entdecke die schönsten Ausflugsziele in der Schweiz und Umgebung",
    freeActivitiesLabel: "Kostenlose Aktivitäten",
    searchHundredsDescription: "Durchsuche hunderte von Ausflugszielen nach Kategorie, Region und Budget",
    findNearbyDescription: "Finde Ausflugsziele in deiner Nähe mit der interaktiven Karte",
    // Common UI
    doneButton: "Fertig",
    close: "Schließen",
    name: "Name",
    description: "Beschreibung",
    address: "Adresse",
    // Empty States
    noActivitiesYet: "Noch keine Trips gespeichert",
    discoverAndSave: "Entdecke Ausflugsziele und speichere deine Favoriten",
    // Trips Screen
    myTripsTab: "Meine Trips",
    savedActivities: "gespeicherte Ausflüge",
    allFilter: "Alle",
    removeFromTrips: "Aus Trips entfernen",
    removeConfirm: "Möchtest du diesen Trip wirklich aus deiner Liste entfernen?",
    remove: "Entfernen",
    removed: "Entfernt",
    removeFailed: "Entfernen fehlgeschlagen",
    favoriteFailed: "Fehler beim Favorisieren",
    markFailed: "Fehler beim Markieren",
    // Profile
    manageTrips: "Melde dich an, um deine Trips zu verwalten",
    loginToManage: "Anmeldung erforderlich",
    deleteAccountConfirm: "Konto löschen",
    deleteAllData: "Alle deine Daten werden unwiderruflich gelöscht. Fortfahren?",
    continueAction: "Fortfahren",
    // Home Screen Extended
    statistics: "Statistiken",
    activities: "Aktivitäten",
    regions: "Regionen",
    whatAwaits: "Was dich erwartet",
    perfectTrip: "Alles was du für deinen perfekten Ausflug brauchst",
    discoverTrips: "Ausflüge entdecken",
    discoverTripsDesc: "Durchsuche hunderte von Ausflugszielen nach Kategorie, Region und Budget",
    dayPlanning: "Tagesplanung",
    dayPlanningDesc: "Plane deinen perfekten Tag mit Zeitplanung, Packliste und Budget",
    shareWithFriends: "Mit Freunden teilen",
    planAdventures: "Teile deine Lieblingsausflüge und plane gemeinsame Abenteuer",
    findNearbyDesc: "Entdecke spannende Aktivitäten in deiner Nähe mit Karten-Ansicht",
    // Planner
    myPlans: "Meine Pläne",
    noPlansYet: "Noch keine Pläne erstellt",
    createFirstPlan: "Erstelle deinen ersten Tagesplan",
    // Trip Detail Sections
    descriptionTitle: "Beschreibung",
    detailsTitle: "Details",
    equipmentTitle: "Ausrüstung",
    tripWeatherTitle: "Wetter",
    categories: "Kategorien",
    duration: "Dauer",
    tripSeason: "Saison",
    difficulty: "Schwierigkeit",
    accessibility: "Zugänglichkeit",
    // Detail Labels
    region: "Region",
    goodToKnow: "Gut zu wissen",
    parking: "Parkplätze",
    publicTransport: "Öffentlicher Verkehr",
    restaurantNearby: "Restaurant in der Nähe",
    wheelchairAccessible: "Rollstuhlgängig",
    dogFriendly: "Hundefreundlich",
    childFriendly: "Kinderfreundlich",
    openingHours: "Öffnungszeiten",
    // Common
    yes: "Ja",
    no: "Nein",
    // Profile Screen Extended
    welcomeToApp: "Willkommen bei AusflugFinder",
    loginPromptText: "Melde dich an, um deine Ausflüge zu speichern, Pläne zu erstellen und mit Freunden zu teilen",
    login: "Anmelden",
    register: "Registrieren",
    generalSection: "ALLGEMEIN",
    profileLocation: "Standort",
    locationSubtitle: "Standort & Nähe-Benachrichtigungen",
    profileNotifications: "Benachrichtigungen",
    notificationsSubtitle: "Push-Benachrichtigungen verwalten",
    profileLanguage: "Sprache",
    profileAppearance: "Erscheinungsbild",
    appearanceSubtitle: "Systemeinstellung",
    socialSection: "SOZIAL",
    profileFriends: "Freunde",
    friendsSubtitle: "Freunde verwalten",
    profileShare: "Teilen",
    shareSubtitle: "App mit Freunden teilen",
    shareMessage: "Schau dir AusflugFinder an! Entdecke tolle Ausflugsziele in deiner Nähe. 🏞️",
    supportSection: "SUPPORT",
    profileAbout: "Über AusflugFinder",
    profilePrivacy: "Datenschutz",
    sendFeedback: "Feedback senden",
    accountSection: "KONTO",
    logout: "Abmelden",
    logoutConfirm: "Abmelden",
    logoutMessage: "Möchtest du dich wirklich abmelden?",
    adminActionsSection: "ADMINISTRATION",
    newTrip: "Neuer Ausflug",
    newTripSubtitle: "Ausflug hinzufügen",
    pushNotifications: "Push-Benachrichtigungen",
    broadcastSubtitle: "Broadcast an alle User senden",
    adminMode: "Admin-Modus",
    adminModeActive: "Aktiviert - Bearbeiten möglich",
    adminModeInactive: "Deaktiviert",
  },
  en: {
    // Navigation
    home: "Home",
    explore: "Explore",
    trips: "Trips",
    planner: "Planner",
    profile: "Profile",
    // Home Screen
    welcome: "Welcome",
    discoverTitle: "Discover Switzerland",
    discoverSubtitle: "Find the most beautiful destinations",
    exploreButton: "Explore",
    loginButton: "Login",
    logoutButton: "Logout",
    // Explore Screen
    searchPlaceholder: "Search for trips...",
    noResults: "No results",
    tryDifferent: "Try different search terms",
    all: "All",
    free: "Free",
    cheap: "Cheap",
    medium: "Medium",
    expensive: "Expensive",
    // Trips Screen
    myTrips: "My Trips",
    savedTrips: "saved trips",
    favorites: "Favorites",
    done: "Done",
    noTrips: "No trips saved yet",
    discoverTrips: "Discover destinations",
    // Planner Screen
    plannerTitle: "Planner",
    noPlan: "No plans created yet",
    createPlan: "Create Plan",
    activities: "Activities",
    packingList: "Packing List",
    budget: "Budget",
    checklist: "Checklist",
    // Profile Screen
    settings: "Settings",
    notifications: "Notifications",
    language: "Language",
    appearance: "Appearance",
    friends: "Friends",
    share: "Share",
    about: "About AusflugFinder",
    privacy: "Privacy",
    feedback: "Feedback",
    account: "Account",
    deleteAccount: "Delete Account",
    // Common
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    back: "Back",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    loginRequired: "Login required",
    loginToAccess: "Please login to access this feature",
    // Seasons
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",
    // Cost Labels
    costFree: "Free",
    costCheap: "Cheap (CHF 10-30)",
    costMedium: "Medium (CHF 30-60)",
    costExpensive: "Expensive (CHF 60-100)",
    costVeryExpensive: "Very expensive (CHF 100+)",
    // Trip Detail
    openMap: "Open map",
    website: "Website",
    markAsDone: "Mark as done",
    markAsFavorite: "Mark as favorite",
    saveTrip: "Save trip",
    removeFromSaved: "Remove from saved",
    removeFromFavorites: "Remove from favorites",
    markAsNotDone: "Mark as not done",
    // Delete Confirmations
    deleteTrip: "Delete trip",
    deleteTripConfirm: "Do you really want to delete this trip? This action cannot be undone.",
    deleted: "Deleted",
    deletedSuccess: "The trip was successfully deleted.",
    deleteError: "Error deleting.",
    // Weather
    weatherTitle: "Weather",
    forecast3Day: "3-day forecast",
    // Admin
    adminSection: "Administration",
    adminEdit: "Edit",
    adminDelete: "Delete",
    // Trip Edit
    editTrip: "Edit trip",
    tripName: "Name",
    tripDescription: "Description",
    streetAddress: "Street",
    zipCode: "ZIP code",
    city: "City",
    latitude: "Latitude",
    longitude: "Longitude",
    websiteUrl: "Website URL",
    category: "Category",
    costLevel: "Cost level",
    season: "Season",
    updateSuccess: "Successfully updated",
    updateError: "Error updating",
    // Errors
    errorOccurred: "An error occurred",
    tryAgain: "Please try again",
    notFound: "Not found",
    // Explore Screen Extended
    activitiesWaiting: "activities waiting for you",
    searchTrips: "Search for trips...",
    noResultsFound: "No trips found",
    tryDifferentTerms: "Try different search terms or filters",
    sortBy: "Sort by",
    sortByName: "Name",
    sortByDistance: "Distance",
    sortByPriceAsc: "Price ascending",
    sortByPriceDesc: "Price descending",
    sortByRegion: "Region",
    // Admin Create/Edit
    createTrip: "Create trip",
    chooseImage: "Choose image",
    permissionRequired: "Permission required",
    pleaseAllowPhotoAccess: "Please allow access to your photos.",
    pleaseEnterName: "Please enter name",
    pleaseEnterAddress: "Please enter address",
    successfullyCreated: "Successfully created",
    successfullyUpdated: "Successfully updated",
    // Home Screen
    discoverSwitzerlandTitle: "Discover Switzerland",
    discoverSwitzerlandSub: "Discover the most beautiful destinations in Switzerland and surroundings",
    freeActivitiesLabel: "Free activities",
    searchHundredsDescription: "Search hundreds of destinations by category, region and budget",
    findNearbyDescription: "Find destinations near you with the interactive map",
    // Common UI
    doneButton: "Done",
    close: "Close",
    name: "Name",
    description: "Description",
    address: "Address",
    // Empty States
    noActivitiesYet: "No trips saved yet",
    discoverAndSave: "Discover destinations and save your favorites",
    // Trips Screen
    myTripsTab: "My Trips",
    savedActivities: "saved activities",
    allFilter: "All",
    removeFromTrips: "Remove from trips",
    removeConfirm: "Do you really want to remove this trip from your list?",
    remove: "Remove",
    removed: "Removed",
    removeFailed: "Remove failed",
    favoriteFailed: "Failed to favorite",
    markFailed: "Failed to mark",
    // Profile
    manageTrips: "Sign in to manage your trips",
    loginToManage: "Login required",
    deleteAccountConfirm: "Delete account",
    deleteAllData: "All your data will be permanently deleted. Continue?",
    continueAction: "Continue",
    // Home Screen Extended
    statistics: "Statistics",
    statsActivities: "Activities",
    regions: "Regions",
    whatAwaits: "What awaits you",
    perfectTrip: "Everything you need for your perfect trip",
    exploreDiscoverTrips: "Discover trips",
    discoverTripsDesc: "Browse hundreds of destinations by category, region and budget",
    dayPlanning: "Day planning",
    dayPlanningDesc: "Plan your perfect day with scheduling, packing list and budget",
    shareWithFriends: "Share with friends",
    planAdventures: "Share your favorite trips and plan adventures together",
    findNearbyDesc: "Discover exciting activities nearby with map view",
    // Planner
    myPlans: "My Plans",
    noPlansYet: "No plans created yet",
    createFirstPlan: "Create your first day plan",
    // Trip Detail Sections
    descriptionTitle: "Description",
    detailsTitle: "Details",
    equipmentTitle: "Equipment",
    tripWeatherTitle: "Weather",
    categories: "Categories",
    duration: "Duration",
    tripSeason: "Season",
    difficulty: "Difficulty",
    accessibility: "Accessibility",
    // Detail Labels
    region: "Region",
    goodToKnow: "Good to know",
    parking: "Parking",
    publicTransport: "Public transport",
    restaurantNearby: "Restaurant nearby",
    wheelchairAccessible: "Wheelchair accessible",
    dogFriendly: "Dog friendly",
    childFriendly: "Child friendly",
    openingHours: "Opening hours",
    // Common
    yes: "Yes",
    no: "No",
    // Profile Screen Extended
    welcomeToApp: "Welcome to AusflugFinder",
    loginPromptText: "Sign in to save your trips, create plans and share with friends",
    login: "Sign in",
    register: "Register",
    generalSection: "GENERAL",
    profileLocation: "Location",
    locationSubtitle: "Location & proximity notifications",
    profileNotifications: "Notifications",
    notificationsSubtitle: "Manage push notifications",
    profileLanguage: "Language",
    profileAppearance: "Appearance",
    appearanceSubtitle: "System setting",
    socialSection: "SOCIAL",
    profileFriends: "Friends",
    friendsSubtitle: "Manage friends",
    profileShare: "Share",
    shareSubtitle: "Share app with friends",
    shareMessage: "Check out AusflugFinder! Discover great destinations nearby. 🏞️",
    supportSection: "SUPPORT",
    profileAbout: "About AusflugFinder",
    profilePrivacy: "Privacy",
    sendFeedback: "Send feedback",
    accountSection: "ACCOUNT",
    logout: "Sign out",
    logoutConfirm: "Sign out",
    logoutMessage: "Do you really want to sign out?",
    adminActionsSection: "ADMINISTRATION",
    newTrip: "New trip",
    newTripSubtitle: "Add trip",
    pushNotifications: "Push notifications",
    broadcastSubtitle: "Send broadcast to all users",
    adminMode: "Admin mode",
    adminModeActive: "Active - Editing enabled",
    adminModeInactive: "Inactive",
  },
  fr: {
    // Navigation
    home: "Accueil",
    explore: "Explorer",
    trips: "Voyages",
    planner: "Planificateur",
    profile: "Profil",
    // Home Screen
    welcome: "Bienvenue",
    discoverTitle: "Découvrez la Suisse",
    discoverSubtitle: "Trouvez les plus belles destinations",
    exploreButton: "Explorer",
    loginButton: "Connexion",
    logoutButton: "Déconnexion",
    // Explore Screen
    searchPlaceholder: "Rechercher des excursions...",
    noResults: "Aucun résultat",
    tryDifferent: "Essayez d'autres termes",
    all: "Tous",
    free: "Gratuit",
    cheap: "Bon marché",
    medium: "Moyen",
    expensive: "Cher",
    // Trips Screen
    myTrips: "Mes voyages",
    savedTrips: "excursions sauvegardées",
    favorites: "Favoris",
    done: "Terminé",
    noTrips: "Aucun voyage enregistré",
    discoverTrips: "Découvrir des destinations",
    // Planner Screen
    plannerTitle: "Planificateur",
    noPlan: "Aucun plan créé",
    createPlan: "Créer un plan",
    activities: "Activités",
    packingList: "Liste de bagages",
    budget: "Budget",
    checklist: "Liste de contrôle",
    // Profile Screen
    settings: "Paramètres",
    notifications: "Notifications",
    language: "Langue",
    appearance: "Apparence",
    friends: "Amis",
    share: "Partager",
    about: "À propos",
    privacy: "Confidentialité",
    feedback: "Commentaires",
    account: "Compte",
    deleteAccount: "Supprimer le compte",
    // Common
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
    edit: "Modifier",
    add: "Ajouter",
    back: "Retour",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    loginRequired: "Connexion requise",
    loginToAccess: "Connectez-vous pour accéder à cette fonction",
    // Seasons
    spring: "Printemps",
    summer: "Été",
    autumn: "Automne",
    winter: "Hiver",
    // Cost Labels
    costFree: "Gratuit",
    costCheap: "Bon marché (CHF 10-30)",
    costMedium: "Moyen (CHF 30-60)",
    costExpensive: "Cher (CHF 60-100)",
    costVeryExpensive: "Très cher (CHF 100+)",
    // Trip Detail
    openMap: "Ouvrir la carte",
    website: "Site web",
    markAsDone: "Marquer comme terminé",
    markAsFavorite: "Marquer comme favori",
    saveTrip: "Enregistrer le voyage",
    removeFromSaved: "Retirer des enregistrés",
    removeFromFavorites: "Retirer des favoris",
    markAsNotDone: "Marquer comme non terminé",
    // Delete Confirmations
    deleteTrip: "Supprimer l'excursion",
    deleteTripConfirm: "Voulez-vous vraiment supprimer cette excursion? Cette action ne peut pas être annulée.",
    deleted: "Supprimé",
    deletedSuccess: "L'excursion a été supprimée avec succès.",
    deleteError: "Erreur lors de la suppression.",
    // Weather
    weatherTitle: "Météo",
    forecast3Day: "Prévisions à 3 jours",
    // Admin
    adminSection: "Administration",
    adminEdit: "Modifier",
    adminDelete: "Supprimer",
    // Trip Edit
    editTrip: "Modifier l'excursion",
    tripName: "Nom",
    tripDescription: "Description",
    streetAddress: "Rue",
    zipCode: "Code postal",
    city: "Ville",
    latitude: "Latitude",
    longitude: "Longitude",
    websiteUrl: "URL du site web",
    category: "Catégorie",
    costLevel: "Niveau de coût",
    season: "Saison",
    updateSuccess: "Mis à jour avec succès",
    updateError: "Erreur de mise à jour",
    // Errors
    errorOccurred: "Une erreur s'est produite",
    tryAgain: "Veuillez réessayer",
    notFound: "Non trouvé",
    // Explore Screen Extended
    activitiesWaiting: "excursions vous attendent",
    searchTrips: "Rechercher des excursions...",
    noResultsFound: "Aucune excursion trouvée",
    tryDifferentTerms: "Essayez d'autres termes ou filtres",
    sortBy: "Trier par",
    sortByName: "Nom",
    sortByDistance: "Distance",
    sortByPriceAsc: "Prix croissant",
    sortByPriceDesc: "Prix décroissant",
    sortByRegion: "Région",
    // Admin Create/Edit
    createTrip: "Créer une excursion",
    chooseImage: "Choisir une image",
    permissionRequired: "Autorisation requise",
    pleaseAllowPhotoAccess: "Veuillez autoriser l'accès à vos photos.",
    pleaseEnterName: "Veuillez entrer un nom",
    pleaseEnterAddress: "Veuillez entrer une adresse",
    successfullyCreated: "Créé avec succès",
    successfullyUpdated: "Mis à jour avec succès",
    // Home Screen
    discoverSwitzerlandTitle: "Découvrez la Suisse",
    discoverSwitzerlandSub: "Découvrez les plus belles destinations en Suisse et ses environs",
    freeActivitiesLabel: "Activités gratuites",
    searchHundredsDescription: "Recherchez des centaines de destinations par catégorie, région et budget",
    findNearbyDescription: "Trouvez des destinations près de chez vous avec la carte interactive",
    // Common UI
    doneButton: "Terminé",
    close: "Fermer",
    name: "Nom",
    description: "Description",
    address: "Adresse",
    // Empty States
    noActivitiesYet: "Aucun voyage enregistré",
    discoverAndSave: "Découvrez des destinations et enregistrez vos favoris",
    // Trips Screen
    myTripsTab: "Mes voyages",
    savedActivities: "activités enregistrées",
    allFilter: "Tous",
    removeFromTrips: "Retirer des voyages",
    removeConfirm: "Voulez-vous vraiment retirer ce voyage de votre liste?",
    remove: "Retirer",
    removed: "Retiré",
    removeFailed: "Échec de la suppression",
    favoriteFailed: "Échec de l'ajout aux favoris",
    markFailed: "Échec du marquage",
    // Profile
    manageTrips: "Connectez-vous pour gérer vos voyages",
    loginToManage: "Connexion requise",
    deleteAccountConfirm: "Supprimer le compte",
    deleteAllData: "Toutes vos données seront définitivement supprimées. Continuer?",
    continueAction: "Continuer",
    // Home Screen Extended
    statistics: "Statistiques",
    statsActivities: "Activités",
    regions: "Régions",
    whatAwaits: "Ce qui vous attend",
    perfectTrip: "Tout ce dont vous avez besoin pour votre excursion parfaite",
    exploreDiscoverTrips: "Découvrir des excursions",
    discoverTripsDesc: "Parcourez des centaines de destinations par catégorie, région et budget",
    dayPlanning: "Planification de journée",
    dayPlanningDesc: "Planifiez votre journée parfaite avec planification, liste de bagages et budget",
    shareWithFriends: "Partager avec des amis",
    planAdventures: "Partagez vos excursions préférées et planifiez des aventures ensemble",
    findNearbyDesc: "Découvrez des activités passionnantes à proximité avec la vue carte",
    // Planner
    myPlans: "Mes plans",
    noPlansYet: "Aucun plan créé",
    createFirstPlan: "Créez votre premier plan de journée",
    // Trip Detail Sections
    descriptionTitle: "Description",
    detailsTitle: "Détails",
    equipmentTitle: "Équipement",
    tripWeatherTitle: "Météo",
    categories: "Catégories",
    duration: "Durée",
    tripSeason: "Saison",
    difficulty: "Difficulté",
    accessibility: "Accessibilité",
    // Detail Labels
    region: "Région",
    goodToKnow: "Bon à savoir",
    parking: "Parking",
    publicTransport: "Transports publics",
    restaurantNearby: "Restaurant à proximité",
    wheelchairAccessible: "Accessible en fauteuil roulant",
    dogFriendly: "Accepte les chiens",
    childFriendly: "Adapté aux enfants",
    openingHours: "Heures d'ouverture",
    // Common
    yes: "Oui",
    no: "Non",
    // Profile Screen Extended
    welcomeToApp: "Bienvenue sur AusflugFinder",
    loginPromptText: "Connectez-vous pour enregistrer vos excursions, créer des plans et partager avec des amis",
    login: "Se connecter",
    register: "S'inscrire",
    generalSection: "GÉNÉRAL",
    profileLocation: "Localisation",
    locationSubtitle: "Localisation & notifications de proximité",
    profileNotifications: "Notifications",
    notificationsSubtitle: "Gérer les notifications push",
    profileLanguage: "Langue",
    profileAppearance: "Apparence",
    appearanceSubtitle: "Réglage système",
    socialSection: "SOCIAL",
    profileFriends: "Amis",
    friendsSubtitle: "Gérer les amis",
    profileShare: "Partager",
    shareSubtitle: "Partager l'app avec des amis",
    shareMessage: "Découvrez AusflugFinder ! Découvrez de superbes destinations à proximité. 🏞️",
    supportSection: "SUPPORT",
    profileAbout: "À propos d'AusflugFinder",
    profilePrivacy: "Confidentialité",
    sendFeedback: "Envoyer des commentaires",
    accountSection: "COMPTE",
    logout: "Se déconnecter",
    logoutConfirm: "Se déconnecter",
    logoutMessage: "Voulez-vous vraiment vous déconnecter ?",
    adminActionsSection: "ADMINISTRATION",
    newTrip: "Nouvelle excursion",
    newTripSubtitle: "Ajouter une excursion",
    pushNotifications: "Notifications push",
    broadcastSubtitle: "Envoyer une diffusion à tous les utilisateurs",
    adminMode: "Mode admin",
    adminModeActive: "Actif - Édition possible",
    adminModeInactive: "Inactif",
  },
  it: {
    // Navigation
    home: "Home",
    explore: "Esplora",
    trips: "Viaggi",
    planner: "Pianificatore",
    profile: "Profilo",
    // Home Screen
    welcome: "Benvenuto",
    discoverTitle: "Scopri la Svizzera",
    discoverSubtitle: "Trova le destinazioni più belle",
    exploreButton: "Esplora",
    loginButton: "Accedi",
    logoutButton: "Esci",
    // Explore Screen
    searchPlaceholder: "Cerca escursioni...",
    noResults: "Nessun risultato",
    tryDifferent: "Prova termini diversi",
    all: "Tutti",
    free: "Gratuito",
    cheap: "Economico",
    medium: "Medio",
    expensive: "Costoso",
    // Trips Screen
    myTrips: "I miei viaggi",
    savedTrips: "escursioni salvate",
    favorites: "Preferiti",
    done: "Completato",
    noTrips: "Nessun viaggio salvato",
    discoverTrips: "Scopri destinazioni",
    // Planner Screen
    plannerTitle: "Pianificatore",
    noPlan: "Nessun piano creato",
    createPlan: "Crea piano",
    activities: "Attività",
    packingList: "Lista bagagli",
    budget: "Budget",
    checklist: "Checklist",
    // Profile Screen
    settings: "Impostazioni",
    notifications: "Notifiche",
    language: "Lingua",
    appearance: "Aspetto",
    friends: "Amici",
    share: "Condividi",
    about: "Informazioni",
    privacy: "Privacy",
    feedback: "Feedback",
    account: "Account",
    deleteAccount: "Elimina account",
    // Common
    cancel: "Annulla",
    save: "Salva",
    delete: "Elimina",
    edit: "Modifica",
    add: "Aggiungi",
    back: "Indietro",
    loading: "Caricamento...",
    error: "Errore",
    success: "Successo",
    loginRequired: "Accesso richiesto",
    loginToAccess: "Accedi per utilizzare questa funzione",
    // Seasons
    spring: "Primavera",
    summer: "Estate",
    autumn: "Autunno",
    winter: "Inverno",
    // Cost Labels
    costFree: "Gratuito",
    costCheap: "Economico (CHF 10-30)",
    costMedium: "Medio (CHF 30-60)",
    costExpensive: "Costoso (CHF 60-100)",
    costVeryExpensive: "Molto costoso (CHF 100+)",
    // Trip Detail
    openMap: "Apri mappa",
    website: "Sito web",
    markAsDone: "Segna come completato",
    markAsFavorite: "Segna come preferito",
    saveTrip: "Salva viaggio",
    removeFromSaved: "Rimuovi dai salvati",
    removeFromFavorites: "Rimuovi dai preferiti",
    markAsNotDone: "Segna come non completato",
    // Delete Confirmations
    deleteTrip: "Elimina escursione",
    deleteTripConfirm: "Vuoi davvero eliminare questa escursione? Questa azione non può essere annullata.",
    deleted: "Eliminato",
    deletedSuccess: "L'escursione è stata eliminata con successo.",
    deleteError: "Errore durante l'eliminazione.",
    // Weather
    weatherTitle: "Meteo",
    forecast3Day: "Previsioni a 3 giorni",
    // Admin
    adminSection: "Amministrazione",
    adminEdit: "Modifica",
    adminDelete: "Elimina",
    // Trip Edit
    editTrip: "Modifica escursione",
    tripName: "Nome",
    tripDescription: "Descrizione",
    streetAddress: "Via",
    zipCode: "CAP",
    city: "Città",
    latitude: "Latitudine",
    longitude: "Longitudine",
    websiteUrl: "URL del sito web",
    category: "Categoria",
    costLevel: "Livello di costo",
    season: "Stagione",
    updateSuccess: "Aggiornato con successo",
    updateError: "Errore durante l'aggiornamento",
    // Errors
    errorOccurred: "Si è verificato un errore",
    tryAgain: "Riprova",
    notFound: "Non trovato",
    // Explore Screen Extended
    activitiesWaiting: "escursioni ti aspettano",
    searchTrips: "Cerca escursioni...",
    noResultsFound: "Nessuna escursione trovata",
    tryDifferentTerms: "Prova termini o filtri diversi",
    sortBy: "Ordina per",
    sortByName: "Nome",
    sortByDistance: "Distanza",
    sortByPriceAsc: "Prezzo crescente",
    sortByPriceDesc: "Prezzo decrescente",
    sortByRegion: "Regione",
    // Admin Create/Edit
    createTrip: "Crea escursione",
    chooseImage: "Scegli immagine",
    permissionRequired: "Autorizzazione richiesta",
    pleaseAllowPhotoAccess: "Consenti l'accesso alle tue foto.",
    pleaseEnterName: "Inserisci il nome",
    pleaseEnterAddress: "Inserisci l'indirizzo",
    successfullyCreated: "Creato con successo",
    successfullyUpdated: "Aggiornato con successo",
    // Home Screen
    discoverSwitzerlandTitle: "Scopri la Svizzera",
    discoverSwitzerlandSub: "Scopri le destinazioni più belle in Svizzera e dintorni",
    freeActivitiesLabel: "Attività gratuite",
    searchHundredsDescription: "Cerca centinaia di destinazioni per categoria, regione e budget",
    findNearbyDescription: "Trova destinazioni vicino a te con la mappa interattiva",
    // Common UI
    doneButton: "Fatto",
    close: "Chiudi",
    name: "Nome",
    description: "Descrizione",
    address: "Indirizzo",
    // Empty States
    noActivitiesYet: "Nessun viaggio salvato",
    discoverAndSave: "Scopri destinazioni e salva i tuoi preferiti",
    // Trips Screen
    myTripsTab: "I miei viaggi",
    savedActivities: "attività salvate",
    allFilter: "Tutti",
    removeFromTrips: "Rimuovi dai viaggi",
    removeConfirm: "Vuoi davvero rimuovere questo viaggio dalla tua lista?",
    remove: "Rimuovi",
    removed: "Rimosso",
    removeFailed: "Rimozione fallita",
    favoriteFailed: "Errore nell'aggiungere ai preferiti",
    markFailed: "Errore nel segnare",
    // Profile
    manageTrips: "Accedi per gestire i tuoi viaggi",
    loginToManage: "Accesso richiesto",
    deleteAccountConfirm: "Elimina account",
    deleteAllData: "Tutti i tuoi dati saranno eliminati permanentemente. Continuare?",
    continueAction: "Continua",
    // Home Screen Extended
    statistics: "Statistiche",
    statsActivities: "Attività",
    regions: "Regioni",
    whatAwaits: "Cosa ti aspetta",
    perfectTrip: "Tutto ciò di cui hai bisogno per la tua escursione perfetta",
    exploreDiscoverTrips: "Scopri escursioni",
    discoverTripsDesc: "Sfoglia centinaia di destinazioni per categoria, regione e budget",
    dayPlanning: "Pianificazione giornaliera",
    dayPlanningDesc: "Pianifica la tua giornata perfetta con pianificazione, lista bagagli e budget",
    shareWithFriends: "Condividi con gli amici",
    planAdventures: "Condividi le tue escursioni preferite e pianifica avventure insieme",
    findNearbyDesc: "Scopri attività entusiasmanti nelle vicinanze con la vista mappa",
    // Planner
    myPlans: "I miei piani",
    noPlansYet: "Nessun piano creato",
    createFirstPlan: "Crea il tuo primo piano giornaliero",
    // Trip Detail Sections
    descriptionTitle: "Descrizione",
    detailsTitle: "Dettagli",
    equipmentTitle: "Attrezzatura",
    tripWeatherTitle: "Meteo",
    categories: "Categorie",
    duration: "Durata",
    tripSeason: "Stagione",
    difficulty: "Difficoltà",
    accessibility: "Accessibilità",
    // Detail Labels
    region: "Regione",
    goodToKnow: "Buono a sapersi",
    parking: "Parcheggio",
    publicTransport: "Trasporti pubblici",
    restaurantNearby: "Ristorante nelle vicinanze",
    wheelchairAccessible: "Accessibile in sedia a rotelle",
    dogFriendly: "Accetta cani",
    childFriendly: "Adatto ai bambini",
    openingHours: "Orari di apertura",
    // Common
    yes: "Sì",
    no: "No",
    // Profile Screen Extended
    welcomeToApp: "Benvenuto su AusflugFinder",
    loginPromptText: "Accedi per salvare le tue escursioni, creare piani e condividere con gli amici",
    login: "Accedi",
    register: "Registrati",
    generalSection: "GENERALE",
    profileLocation: "Posizione",
    locationSubtitle: "Posizione e notifiche di prossimità",
    profileNotifications: "Notifiche",
    notificationsSubtitle: "Gestisci notifiche push",
    profileLanguage: "Lingua",
    profileAppearance: "Aspetto",
    appearanceSubtitle: "Impostazione di sistema",
    socialSection: "SOCIAL",
    profileFriends: "Amici",
    friendsSubtitle: "Gestisci amici",
    profileShare: "Condividi",
    shareSubtitle: "Condividi l'app con gli amici",
    shareMessage: "Scopri AusflugFinder! Scopri fantastiche destinazioni nelle vicinanze. 🏞️",
    supportSection: "SUPPORTO",
    profileAbout: "Info su AusflugFinder",
    profilePrivacy: "Privacy",
    sendFeedback: "Invia feedback",
    accountSection: "ACCOUNT",
    logout: "Esci",
    logoutConfirm: "Esci",
    logoutMessage: "Vuoi davvero uscire?",
    adminActionsSection: "AMMINISTRAZIONE",
    newTrip: "Nuova escursione",
    newTripSubtitle: "Aggiungi escursione",
    pushNotifications: "Notifiche push",
    broadcastSubtitle: "Invia broadcast a tutti gli utenti",
    adminMode: "Modalità admin",
    adminModeActive: "Attiva - Modifica abilitata",
    adminModeInactive: "Inattiva",
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = "app_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("de");

  useEffect(() => {
    // Load saved language
    AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
      if (saved && (saved === "de" || saved === "en" || saved === "fr" || saved === "it")) {
        setLanguageState(saved as Language);
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
