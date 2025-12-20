import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { getDayPlans, createDayPlan, deleteDayPlan, type DayPlan } from "@/lib/supabase-api";

type LocalDayPlan = {
  id: number;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
  isDraft: boolean;
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDaysDiff(start: Date | string, end: Date | string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function PlanCard({
  plan,
  onPress,
  onDelete
}: {
  plan: LocalDayPlan;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const days = getDaysDiff(plan.startDate, plan.endDate);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.planCardHeader}>
        <View style={[styles.planIcon, { backgroundColor: colors.primary + "20" }]}>
          <IconSymbol name="calendar" size={24} color={colors.primary} />
        </View>
        <View style={styles.planCardHeaderContent}>
          <ThemedText style={styles.planTitle} numberOfLines={1}>
            {plan.title}
          </ThemedText>
          <View style={styles.planMeta}>
            <ThemedText style={[styles.planDates, { color: colors.textSecondary }]}>
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </ThemedText>
          </View>
        </View>
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <IconSymbol name="trash.fill" size={18} color="#EF4444" />
        </Pressable>
      </View>

      {/* Description */}
      {plan.description && (
        <ThemedText style={[styles.planDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {plan.description}
        </ThemedText>
      )}

      {/* Footer */}
      <View style={styles.planCardFooter}>
        <View style={styles.planTags}>
          <View style={[styles.tag, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="clock.fill" size={12} color={colors.primary} />
            <ThemedText style={[styles.tagText, { color: colors.primary }]}>
              {days} {days === 1 ? "Tag" : "Tage"}
            </ThemedText>
          </View>
          {plan.isDraft && (
            <View style={[styles.tag, { backgroundColor: BrandColors.secondary + "15" }]}>
              <ThemedText style={[styles.tagText, { color: BrandColors.secondary }]}>
                Entwurf
              </ThemedText>
            </View>
          )}
          {plan.isPublic && (
            <View style={[styles.tag, { backgroundColor: BrandColors.accent + "15" }]}>
              <IconSymbol name="globe" size={12} color={BrandColors.accent} />
              <ThemedText style={[styles.tagText, { color: BrandColors.accent }]}>
                Öffentlich
              </ThemedText>
            </View>
          )}
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

function CreatePlanModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Fehler", "Bitte gib einen Titel ein");
      return;
    }
    onSubmit(title, description);
    setTitle("");
    setDescription("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose}>
            <ThemedText style={[styles.modalCancel, { color: colors.textSecondary }]}>
              Abbrechen
            </ThemedText>
          </Pressable>
          <ThemedText style={styles.modalTitle}>Neuer Plan</ThemedText>
          <Pressable onPress={handleSubmit}>
            <ThemedText style={[styles.modalSave, { color: colors.primary }]}>
              Erstellen
            </ThemedText>
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Titel</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="z.B. Wochenendausflug"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Beschreibung (optional)</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Beschreibe deinen Ausflug..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ThemedView>
    </Modal>
  );
}

function EmptyState({ onCreatePlan }: { onCreatePlan: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.emptyContainer}>
      <IconSymbol name="calendar" size={64} color={colors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        Noch keine Pläne erstellt
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Plane deinen nächsten Ausflug mit Zeitplanung, Packliste und Budget
      </ThemedText>
      <Pressable
        onPress={onCreatePlan}
        style={[styles.createButton, { backgroundColor: colors.primary }]}
      >
        <IconSymbol name="plus" size={18} color="#FFFFFF" />
        <ThemedText style={styles.createButtonText}>Plan erstellen</ThemedText>
      </Pressable>
    </View>
  );
}

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.emptyContainer}>
      <IconSymbol name="person.fill" size={64} color={colors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        Anmeldung erforderlich
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Melde dich an, um Ausflugspläne zu erstellen
      </ThemedText>
      <Pressable
        onPress={onLogin}
        style={[styles.createButton, { backgroundColor: colors.primary }]}
      >
        <IconSymbol name="person.fill" size={18} color="#FFFFFF" />
        <ThemedText style={styles.createButtonText}>Anmelden</ThemedText>
      </Pressable>
    </View>
  );
}

export default function PlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState<LocalDayPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch day plans from Supabase
  const loadPlans = useCallback(async () => {
    if (!isAuthenticated) return;

    const data = await getDayPlans();
    // Convert from database format to local format
    const localPlans = data.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      startDate: new Date(p.start_date),
      endDate: new Date(p.end_date),
      isPublic: p.is_public,
      isDraft: p.is_draft,
    }));
    setPlans(localPlans);
    setIsLoading(false);
  }, [isAuthenticated]);

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  }, [loadPlans]);

  const handleCreatePlan = async (title: string, description: string) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setIsCreating(true);
    const result = await createDayPlan({
      title,
      description: description || undefined,
      startDate: now,
      endDate: tomorrow,
    });
    setIsCreating(false);

    if (result.success) {
      setShowCreateModal(false);
      loadPlans();
    } else {
      Alert.alert("Fehler", result.error || "Plan konnte nicht erstellt werden.");
    }
  };

  const handleDeletePlan = (planId: number, title: string) => {
    Alert.alert(
      "Plan löschen",
      `Möchtest du "${title}" wirklich löschen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            const result = await deleteDayPlan(planId);
            if (result.success) {
              loadPlans();
            } else {
              Alert.alert("Fehler", result.error || "Plan konnte nicht gelöscht werden.");
            }
          },
        },
      ]
    );
  };

  const handlePlanPress = (planId: number) => {
    router.push(`/plan/${planId}` as any);
  };

  if (authLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Planer</ThemedText>
        </View>
        <LoginPrompt onLogin={() => router.push("/login" as any)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Planer</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {plans?.length || 0} Ausflugspläne
          </ThemedText>
        </View>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Plan List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (plans?.length || 0) === 0 ? (
        <EmptyState onCreatePlan={() => setShowCreateModal(true)} />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.planList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <PlanCard
              plan={item as any}
              onPress={() => handlePlanPress(item.id)}
              onDelete={() => handleDeletePlan(item.id, item.title)}
            />
          )}
        />
      )}

      {/* Create Plan Modal */}
      <CreatePlanModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePlan}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: 48,
    paddingBottom: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  planList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  planCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  planCardHeaderContent: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  planMeta: {
    marginTop: Spacing.xs,
  },
  planDates: {
    fontSize: 13,
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  planCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  planTags: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Modal styles
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
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 16,
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
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
});
