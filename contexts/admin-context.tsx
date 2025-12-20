import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "./supabase-auth-context";

// Admin email addresses
const ADMIN_EMAILS = [
    "stefan.gross@hotmail.ch",
];

interface AdminContextType {
    isAdmin: boolean;           // User has admin privileges (based on email)
    isAdminModeEnabled: boolean; // Admin mode is currently active
    toggleAdminMode: () => void;
    canEdit: boolean;           // Can user currently edit (admin + mode enabled)
}

const ADMIN_MODE_KEY = "admin_mode_enabled";

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { user } = useSupabaseAuth();
    const [isAdminModeEnabled, setIsAdminModeEnabled] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Check if user email is in admin list
    const isAdmin = useMemo(() => {
        if (!user?.email) return false;
        return ADMIN_EMAILS.includes(user.email.toLowerCase());
    }, [user?.email]);

    // Load saved admin mode preference on mount
    useEffect(() => {
        AsyncStorage.getItem(ADMIN_MODE_KEY).then((saved) => {
            if (saved === "true" && isAdmin) {
                setIsAdminModeEnabled(true);
            }
            setIsLoaded(true);
        });
    }, [isAdmin]);

    // Toggle admin mode and persist
    const toggleAdminMode = useCallback(() => {
        if (!isAdmin) return;

        setIsAdminModeEnabled((prev) => {
            const newValue = !prev;
            AsyncStorage.setItem(ADMIN_MODE_KEY, newValue.toString());
            return newValue;
        });
    }, [isAdmin]);

    // User can edit if they are admin AND admin mode is enabled
    const canEdit = useMemo(() => {
        return isAdmin && isAdminModeEnabled;
    }, [isAdmin, isAdminModeEnabled]);

    const value = useMemo(() => ({
        isAdmin,
        isAdminModeEnabled,
        toggleAdminMode,
        canEdit,
    }), [isAdmin, isAdminModeEnabled, toggleAdminMode, canEdit]);

    if (!isLoaded) {
        return null;
    }

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin(): AdminContextType {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error("useAdmin must be used within an AdminProvider");
    }
    return context;
}
