import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { ThemeProvider as AppThemeProvider, useAppColorScheme } from "@/contexts/theme-context";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/manus-runtime";
import { LanguageProvider } from "@/contexts/language-context";
import { SupabaseAuthProvider } from "@/contexts/supabase-auth-context";
import { AdminProvider } from "@/contexts/admin-context";
import { ProximityTrackingInitializer } from "@/components/proximity-tracking-initializer";
import { NotificationInitializer } from "@/components/notification-initializer";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };
// Web iframe previewer cannot infer safe-area; default to zero until container sends metrics.

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useAppColorScheme();
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(
    () => initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame },
    [initialFrame, initialInsets],
  );

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SupabaseAuthProvider>
            <AdminProvider>
              <AppThemeProvider>
                <LanguageProvider>
                  <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
                      <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
                      <Stack.Screen name="trip/edit/[id]" options={{ headerShown: true, title: "Bearbeiten" }} />
                      <Stack.Screen name="plan/[id]" options={{ headerShown: true }} />
                      <Stack.Screen name="friends" options={{ headerShown: true }} />
                      <Stack.Screen name="about" options={{ headerShown: true }} />
                      <Stack.Screen name="settings/language" options={{ headerShown: true }} />
                      <Stack.Screen name="settings/appearance" options={{ headerShown: true, headerBackTitle: "Zurück" }} />
                      <Stack.Screen name="settings/notifications" options={{ headerShown: true }} />
                      <Stack.Screen name="settings/location" options={{ headerShown: true, title: "Standort" }} />
                      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
                      <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
                    </Stack>
                    <ProximityTrackingInitializer />
                    <NotificationInitializer />
                    <StatusBar style={colorScheme === "dark" ? "light" : "dark"} translucent backgroundColor="transparent" />
                  </ThemeProvider>
                </LanguageProvider>
              </AppThemeProvider>
            </AdminProvider>
          </SupabaseAuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={insets}>{content}</SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      </SafeAreaProvider>
    );
  }

  return <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>;
}
