import { useSupabaseAuth } from "@/contexts/supabase-auth-context";

/**
 * Hook to access authentication state from Supabase Auth.
 */
export function useAuth() {
  return useSupabaseAuth();
}
