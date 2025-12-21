import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getDayPlanById } from "@/lib/supabase-api";
import type { DayPlan } from "@/lib/supabase-api";
import { PackingListTab, BudgetTab, ChecklistTab, ActivitiesTab } from "./plan-tabs";

type TabType = "activities" | "packing" | "budget" | "checklist";

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [activeTab, setActiveTab] = useState<TabType>("activities");
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch plan data
  useEffect(() => {
    if (!id) return;

    const fetchPlan = async () => {
      setIsLoading(true);
      const data = await getDayPlanById(Number(id));
      setPlan(data);
      setIsLoading(false);
    };

    fetchPlan();
  }, [id]);

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "activities", label: "Aktivitäten", icon: "calendar" },
    { key: "packing", label: "Packliste", icon: "bag.fill" },
    { key: "budget", label: "Budget", icon: "dollarsign.circle.fill" },
    { key: "checklist", label: "Checkliste", icon: "checkmark.circle.fill" },
  ];

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!plan) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.textSecondary} />
        <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
          Plan nicht gefunden
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.primary }]}
        >
          <ThemedText style={styles.backButtonText}>Zurück</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: plan.title,
          headerBackTitle: "Zurück",
        }}
      />
      <ThemedView style={styles.container}>
        {/* Plan Info */}
        <View style={[styles.planInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.planInfoRow}>
            <IconSymbol name="calendar" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.planInfoText, { color: colors.textSecondary }]}>
              {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
            </ThemedText>
          </View>
          {plan.description && (
            <ThemedText style={[styles.planDescription, { color: colors.text }]} numberOfLines={2}>
              {plan.description}
            </ThemedText>
          )}
        </View>

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab.key ? colors.primary : colors.surface,
                  borderColor: activeTab === tab.key ? colors.primary : colors.border,
                },
              ]}
            >
              <IconSymbol
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? "#FFFFFF" : colors.textSecondary}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  { color: activeTab === tab.key ? "#FFFFFF" : colors.textSecondary },
                ]}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab Content */}
        {activeTab === "activities" && <ActivitiesTab dayPlanId={Number(id)} />}
        {activeTab === "packing" && <PackingListTab dayPlanId={Number(id)} />}
        {activeTab === "budget" && <BudgetTab dayPlanId={Number(id)} />}
        {activeTab === "checklist" && <ChecklistTab dayPlanId={Number(id)} />}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 18,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  planInfo: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  planInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  planInfoText: {
    fontSize: 14,
  },
  planDescription: {
    fontSize: 14,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  tabBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
