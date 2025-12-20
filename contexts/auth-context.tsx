import * as Api from "@/lib/api";
import * as Auth from "@/lib/auth";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

type AuthContextType = {
  user: Auth.User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    console.log("[AuthContext] fetchUser called");
    try {
      setLoading(true);
      setError(null);

      // Web platform: use cookie-based auth, fetch user from API
      if (Platform.OS === "web") {
        console.log("[AuthContext] Web platform: fetching user from API...");
        const apiUser = await Api.getMe();
        console.log("[AuthContext] API user response:", apiUser);

        if (apiUser) {
          const userInfo: Auth.User = {
            id: apiUser.id,
            openId: apiUser.openId,
            name: apiUser.name,
            email: apiUser.email,
            loginMethod: apiUser.loginMethod,
            lastSignedIn: new Date(apiUser.lastSignedIn),
          };
          setUser(userInfo);
          // Cache user info in localStorage for faster subsequent loads
          await Auth.setUserInfo(userInfo);
          console.log("[AuthContext] Web user set from API:", userInfo);
        } else {
          console.log("[AuthContext] Web: No authenticated user from API");
          setUser(null);
          await Auth.clearUserInfo();
        }
        return;
      }

      // Native platform: use token-based auth
      console.log("[AuthContext] Native platform: checking for session token...");
      const sessionToken = await Auth.getSessionToken();
      console.log(
        "[AuthContext] Session token:",
        sessionToken ? `present (${sessionToken.substring(0, 20)}...)` : "missing",
      );
      if (!sessionToken) {
        console.log("[AuthContext] No session token, setting user to null");
        setUser(null);
        return;
      }

      // Use cached user info for native (token validates the session)
      const cachedUser = await Auth.getUserInfo();
      console.log("[AuthContext] Cached user:", cachedUser);
      if (cachedUser) {
        console.log("[AuthContext] Using cached user info");
        setUser(cachedUser);
      } else {
        console.log("[AuthContext] No cached user, setting user to null");
        setUser(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[AuthContext] fetchUser error:", error);
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("[AuthContext] fetchUser completed, loading:", false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch (err) {
      console.error("[AuthContext] Logout API call failed:", err);
      // Continue with logout even if API call fails
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  useEffect(() => {
    console.log("[AuthContext] Initial mount, platform:", Platform.OS);
    if (Platform.OS === "web") {
      // Web: fetch user from API directly
      console.log("[AuthContext] Web: fetching user from API...");
      fetchUser();
    } else {
      // Native: check for cached user info first for faster initial load
      Auth.getUserInfo().then((cachedUser) => {
        console.log("[AuthContext] Native cached user check:", cachedUser);
        if (cachedUser) {
          console.log("[AuthContext] Native: setting cached user immediately");
          setUser(cachedUser);
          setLoading(false);
        } else {
          // No cached user, check session token
          fetchUser();
        }
      });
    }
  }, [fetchUser]);

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        refresh: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
