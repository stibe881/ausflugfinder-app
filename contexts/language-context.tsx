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
