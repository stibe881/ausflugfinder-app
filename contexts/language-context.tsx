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
