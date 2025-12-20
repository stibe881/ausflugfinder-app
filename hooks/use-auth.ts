import { useAuthContext } from "@/contexts/auth-context";

/**
 * Hook to access authentication state from AuthContext.
 * This is now a simple wrapper around useAuthContext.
 */
export function useAuth() {
  return useAuthContext();
}
