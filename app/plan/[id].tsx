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

// ============ MAIN COMPONENT ============

function PackingListTab({ dayPlanId }: { dayPlanId: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [newItem, setNewItem] = useState("");

  const { data: items, refetch } = trpc.packingList.list.useQuery({ dayPlanId });
  const addMutation = trpc.packingList.add.useMutation({ onSuccess: () => { refetch(); setNewItem(""); } });
  const toggleMutation = trpc.packingList.toggle.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.packingList.delete.useMutation({ onSuccess: () => refetch() });

  const handleAdd = () => {
    if (!newItem.trim()) return;
    addMutation.mutate({ dayPlanId, item: newItem.trim() });
  };

  const packedCount = items?.filter(i => i.isPacked).length || 0;
  const totalCount = items?.length || 0;

  return (
    <View style={styles.tabContent}>
      {/* Progress */}
      <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <ThemedText style={styles.progressTitle}>Fortschritt</ThemedText>
          <ThemedText style={[styles.progressCount, { color: colors.primary }]}>
            {packedCount}/{totalCount}
          </ThemedText>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: totalCount > 0 ? `${(packedCount / totalCount) * 100}%` : "0%",
              },
            ]}
          />
        </View>
      </View>

      {/* Add Item */}
      <View style={[styles.addItemRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.addItemInput, { color: colors.text }]}
          placeholder="Neuer Gegenstand..."
          placeholderTextColor={colors.textSecondary}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAdd}
        />
        <Pressable onPress={handleAdd} style={[styles.addItemButton, { backgroundColor: colors.primary }]}>
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggleMutation.mutate({ id: item.id, isPacked: !item.isPacked })}
            style={[styles.packingItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.checkbox, item.isPacked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {item.isPacked && <IconSymbol name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <ThemedText style={[styles.packingItemText, item.isPacked && styles.packedText]}>
              {item.item}
            </ThemedText>
            <Pressable onPress={() => deleteMutation.mutate({ id: item.id })}>
              <IconSymbol name="trash.fill" size={16} color="#EF4444" />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyTab}>
            <IconSymbol name="bag.fill" size={40} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyTabText, { color: colors.textSecondary }]}>
              Noch keine Gegenstände
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

// ============ BUDGET TAB ============

function BudgetTab({ dayPlanId }: { dayPlanId: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const { data: items, refetch } = trpc.budget.list.useQuery({ dayPlanId });
  const addMutation = trpc.budget.add.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddModal(false);
      setCategory("");
      setDescription("");
      setEstimatedCost("");
    },
  });
  const deleteMutation = trpc.budget.delete.useMutation({ onSuccess: () => refetch() });

  const handleAdd = () => {
    if (!category.trim() || !description.trim() || !estimatedCost.trim()) {
      Alert.alert("Fehler", "Bitte fülle alle Felder aus");
      return;
    }
    addMutation.mutate({ dayPlanId, category, description, estimatedCost });
  };

  const totalEstimated = items?.reduce((sum, item) => sum + parseFloat(item.estimatedCost || "0"), 0) || 0;
  const totalActual = items?.reduce((sum, item) => sum + parseFloat(item.actualCost || "0"), 0) || 0;

  return (
    <View style={styles.tabContent}>
      {/* Summary */}
      <View style={[styles.budgetSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.budgetSummaryItem}>
          <ThemedText style={[styles.budgetLabel, { color: colors.textSecondary }]}>Geplant</ThemedText>
          <ThemedText style={[styles.budgetValue, { color: colors.text }]}>CHF {totalEstimated.toFixed(2)}</ThemedText>
        </View>
        <View style={[styles.budgetDivider, { backgroundColor: colors.border }]} />
        <View style={styles.budgetSummaryItem}>
          <ThemedText style={[styles.budgetLabel, { color: colors.textSecondary }]}>Ausgegeben</ThemedText>
          <ThemedText style={[styles.budgetValue, { color: totalActual > totalEstimated ? "#EF4444" : colors.primary }]}>
            CHF {totalActual.toFixed(2)}
          </ThemedText>
        </View>
      </View>

      {/* Add Button */}
      <Pressable
        onPress={() => setShowAddModal(true)}
        style={[styles.addBudgetButton, { backgroundColor: colors.primary }]}
      >
        <IconSymbol name="plus" size={18} color="#FFFFFF" />
        <ThemedText style={styles.addBudgetButtonText}>Ausgabe hinzufügen</ThemedText>
      </Pressable>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.budgetItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.budgetItemHeader}>
              <View style={[styles.budgetCategory, { backgroundColor: colors.primary + "15" }]}>
                <ThemedText style={[styles.budgetCategoryText, { color: colors.primary }]}>{item.category}</ThemedText>
              </View>
              <Pressable onPress={() => deleteMutation.mutate({ id: item.id })}>
                <IconSymbol name="trash.fill" size={16} color="#EF4444" />
              </Pressable>
            </View>
            <ThemedText style={styles.budgetDescription}>{item.description}</ThemedText>
            <ThemedText style={[styles.budgetAmount, { color: colors.primary }]}>
              CHF {item.estimatedCost}
            </ThemedText>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyTab}>
            <IconSymbol name="dollarsign.circle.fill" size={40} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyTabText, { color: colors.textSecondary }]}>
              Noch keine Ausgaben
            </ThemedText>
          </View>
        }
      />

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowAddModal(false)}>
              <ThemedText style={{ color: colors.textSecondary }}>Abbrechen</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>Ausgabe hinzufügen</ThemedText>
            <Pressable onPress={handleAdd}>
              <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>Speichern</ThemedText>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Kategorie</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="z.B. Transport, Essen"
                placeholderTextColor={colors.textSecondary}
                value={category}
                onChangeText={setCategory}
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Beschreibung</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="z.B. Zugticket nach Zürich"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Betrag (CHF)</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </ThemedView>
      </Modal>
    </View>
  );
}

// ============ CHECKLIST TAB ============

function ChecklistTab({ dayPlanId }: { dayPlanId: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [newItem, setNewItem] = useState("");

  const { data: items, refetch } = trpc.checklist.list.useQuery({ dayPlanId });
  const addMutation = trpc.checklist.add.useMutation({ onSuccess: () => { refetch(); setNewItem(""); } });
  const toggleMutation = trpc.checklist.toggle.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.checklist.delete.useMutation({ onSuccess: () => refetch() });

  const handleAdd = () => {
    if (!newItem.trim()) return;
    addMutation.mutate({ dayPlanId, title: newItem.trim() });
  };

  const completedCount = items?.filter(i => i.isCompleted).length || 0;
  const totalCount = items?.length || 0;

  return (
    <View style={styles.tabContent}>
      {/* Progress */}
      <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <ThemedText style={styles.progressTitle}>Erledigt</ThemedText>
          <ThemedText style={[styles.progressCount, { color: colors.primary }]}>
            {completedCount}/{totalCount}
          </ThemedText>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
              },
            ]}
          />
        </View>
      </View>

      {/* Add Item */}
      <View style={[styles.addItemRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.addItemInput, { color: colors.text }]}
          placeholder="Neue Aufgabe..."
          placeholderTextColor={colors.textSecondary}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAdd}
        />
        <Pressable onPress={handleAdd} style={[styles.addItemButton, { backgroundColor: colors.primary }]}>
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggleMutation.mutate({ id: item.id, isCompleted: !item.isCompleted })}
            style={[styles.packingItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.checkbox, item.isCompleted && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {item.isCompleted && <IconSymbol name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <ThemedText style={[styles.packingItemText, item.isCompleted && styles.packedText]}>
              {item.title}
            </ThemedText>
            <Pressable onPress={() => deleteMutation.mutate({ id: item.id })}>
              <IconSymbol name="trash.fill" size={16} color="#EF4444" />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyTab}>
            <IconSymbol name="checkmark.circle.fill" size={40} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyTabText, { color: colors.textSecondary }]}>
              Noch keine Aufgaben
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

// ============ ACTIVITIES TAB ============

function ActivitiesTab({ dayPlanId }: { dayPlanId: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const { data: items, refetch } = trpc.dayPlanItems.list.useQuery({ dayPlanId });
  const removeMutation = trpc.dayPlanItems.remove.useMutation({ onSuccess: () => refetch() });

  return (
    <View style={styles.tabContent}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.activityIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="mappin.and.ellipse" size={20} color={colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <ThemedText style={styles.activityTitle}>Aktivität #{item.tripId}</ThemedText>
              {item.startTime && (
                <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                  {item.startTime} - {item.endTime || "?"}
                </ThemedText>
              )}
            </View>
            <Pressable onPress={() => removeMutation.mutate({ id: item.id })}>
              <IconSymbol name="trash.fill" size={16} color="#EF4444" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyTab}>
            <IconSymbol name="calendar" size={40} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyTabText, { color: colors.textSecondary }]}>
              Noch keine Aktivitäten geplant
            </ThemedText>
            <Pressable
              onPress={() => router.push("/(tabs)/explore")}
              style={[styles.addActivityButton, { backgroundColor: colors.primary }]}
            >
              <ThemedText style={styles.addActivityButtonText}>Ausflüge entdecken</ThemedText>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

// ============ MAIN COMPONENT ============

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
  tabContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  emptyTab: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyTabText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
  // Progress Card
  progressCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Add Item Row
  addItemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  addItemInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  addItemButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  // Packing Item
  packingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  packingItemText: {
    flex: 1,
    fontSize: 15,
  },
  packedText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  // Budget
  budgetSummary: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  budgetSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  budgetDivider: {
    width: 1,
    marginHorizontal: Spacing.md,
  },
  budgetLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  addBudgetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  addBudgetButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  budgetItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  budgetItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  budgetCategory: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  budgetCategoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  budgetDescription: {
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Activity
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  activityTime: {
    fontSize: 13,
    marginTop: 2,
  },
  addActivityButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  addActivityButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalContent: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
});
