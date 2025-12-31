import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "./supabase-auth-context";
import { supabase } from "@/lib/supabase";

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
    // Check if user is admin based on DB role
    const isAdmin = useMemo(() => {
        // We initialize with false, but will update asynchronously
        // However, useMemo is synchronous. We need a state.
        return false;
        // Logic moved to useEffect below
    }, []);

    const [isDbAdmin, setIsDbAdmin] = useState(false);

    // Initial check and subscription to user changes
    useEffect(() => {
        let mounted = true;

        async function checkAdminStatus() {
            if (!user) {
                if (mounted) {
                    setIsDbAdmin(false);
                    setIsLoaded(true); // FIX: Ensure we stop loading if no user
                }
                return;
            }

            try {
                // Determine user ID (uuid or int depending on schema usage, consistent with migration)
                // Migration uses: WHERE open_id = auth.uid()::text
                const { data, error } = await supabase
                    .from('users')
                    .select('is_admin')
                    .eq('open_id', user.id)
                    .single();

                if (data && data.is_admin && !error) {
                    if (mounted) setIsDbAdmin(true);
                } else {
                    if (mounted) setIsDbAdmin(false);
                }
            } catch (e) {
                console.error("Error checking admin status:", e);
                if (mounted) setIsDbAdmin(false);
            } finally {
                if (mounted) setIsLoaded(true);
            }
        }

        checkAdminStatus();

        return () => { mounted = false; };
    }, [user]);

    // Derived admin state (Legacy code used 'isAdmin', redirecting to DB state)
    const isAdminUser = isDbAdmin;

    // Load saved admin mode preference on mount
    useEffect(() => {
        if (!isLoaded) return;

        AsyncStorage.getItem(ADMIN_MODE_KEY).then((saved) => {
            if (saved === "true" && isAdminUser) {
                setIsAdminModeEnabled(true);
            }
        });
    }, [isAdminUser, isLoaded]);

    // Toggle admin mode and persist
    const toggleAdminMode = useCallback(() => {
        if (!isAdminUser) return;

        setIsAdminModeEnabled((prev) => {
            const newValue = !prev;
            AsyncStorage.setItem(ADMIN_MODE_KEY, newValue.toString());
            return newValue;
        });
    }, [isAdminUser]);

    // User can edit if they are admin AND admin mode is enabled
    const canEdit = useMemo(() => {
        return isAdminUser && isAdminModeEnabled;
    }, [isAdminUser, isAdminModeEnabled]);

    const value = useMemo(() => ({
        isAdmin: isAdminUser,
        isAdminModeEnabled,
        toggleAdminMode,
        canEdit,
    }), [isAdminUser, isAdminModeEnabled, toggleAdminMode, canEdit]);

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
