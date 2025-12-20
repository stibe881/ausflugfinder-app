import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

type ThemePreference = "system" | "light" | "dark";
type ColorScheme = "light" | "dark";

interface ThemeContextType {
    themePreference: ThemePreference;
    colorScheme: ColorScheme;
    setThemePreference: (theme: ThemePreference) => void;
}

const THEME_KEY = "app_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useSystemColorScheme();
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference on mount
    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY).then((saved) => {
            if (saved === "system" || saved === "light" || saved === "dark") {
                setThemePreferenceState(saved);
            }
            setIsLoaded(true);
        });
    }, []);

    // Calculate actual color scheme based on preference
    const colorScheme = useMemo<ColorScheme>(() => {
        if (themePreference === "system") {
            return systemColorScheme ?? "light";
        }
        return themePreference;
    }, [themePreference, systemColorScheme]);

    // Set theme preference and persist to storage
    const setThemePreference = useCallback((theme: ThemePreference) => {
        setThemePreferenceState(theme);
        AsyncStorage.setItem(THEME_KEY, theme);
    }, []);

    const value = useMemo(() => ({
        themePreference,
        colorScheme,
        setThemePreference,
    }), [themePreference, colorScheme, setThemePreference]);

    // Don't render children until theme is loaded to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

// Re-export a hook compatible with existing useColorScheme usage
export function useAppColorScheme(): ColorScheme {
    const context = useContext(ThemeContext);
    // Fallback to system color scheme if not in ThemeProvider
    const systemColorScheme = useSystemColorScheme();

    if (context === undefined) {
        return systemColorScheme ?? "light";
    }
    return context.colorScheme;
}
