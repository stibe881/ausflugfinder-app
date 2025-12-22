import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MapViewComponent } from "@/components/map-view-component";
import { Colors, BrandColors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getDayPlanById,
  getPlanActivities,
  getPlanChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  removeActivityFromPlan,
  updatePlanNotes,
  type DayPlan,
  type PlanActivity,
  type ChecklistItem,
} from "@/lib/supabase-api";

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("de-CH", {
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

  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [activities, setActivities] = useState<PlanActivity[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    if (!id) return;

    setIsLoading(true);
    const planData = await getDayPlanById(Number(id));
    setPlan(planData);
    setNotes(planData?.notes || "");

    const activitiesData = await getPlanActivities(Number(id));
    setActivities(activitiesData);

    const checklistData = await getPlanChecklist(Number(id));
    setChecklist(checklistData);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Handlers
  const handleRemoveActivity = async (ausflugId: number) => {
    const result = await removeActivityFromPlan(Number(id), ausflugId);
    if (result.success) {
      fetchData();
    } else {
      Alert.alert("Fehler", result.error);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;

    const result = await addChecklistItem(Number(id), newChecklistItem.trim());
    if (result.success) {
      setNewChecklistItem("");
      fetchData();
    }
  };

  const handleToggleChecklistItem = async (itemId: number) => {
    const result = await toggleChecklistItem(itemId);
    if (result.success) {
      fetchData();
    }
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    const result = await deleteChecklistItem(itemId);
    if (result.success) {
      fetchData();
    }
  };

  const handleNotesBlur = async () => {
    if (notes !== (plan?.notes || "")) {
      await updatePlanNotes(Number(id), notes);
    }
  };

  if (isLoading || !plan) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  const daysCount = Math.ceil(
    (new Date(plan.end_date).getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: "#FFFFFF",
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>{plan.title}</ThemedText>
            <View style={styles.headerDate}>
              <IconSymbol name="calendar" size={16} color="#FFFFFF" />
              <ThemedText style={styles.headerDateText}>
                {formatDate(plan.start_date)} - {formatDate(plan.end_date)} ({daysCount}{" "}
                {daysCount === 1 ? "Tag" : "Tage"})
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={[styles.statsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.statItem}>
            <IconSymbol name="mappin.circle.fill" size={20} color={colors.primary} />
            <ThemedText style={styles.statValue}>{activities.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Aktivitäten</ThemedText>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={BrandColors.primary} />
            <ThemedText style={styles.statValue}>{checklist.filter((i) => i.is_done).length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              / {checklist.length} erledigt
            </ThemedText>
          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="mappin.and.ellipse" size={24} color={colors.text} />
            <ThemedText style={styles.sectionTitle}>Aktivitäten</ThemedText>
          </View>

          {activities.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <IconSymbol name="mappin.slash" size={32} color={colors.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                Noch keine Aktivitäten
              </ThemedText>
              <Pressable
                onPress={() => router.push("/(tabs)/explore")}
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="plus.circle.fill" size={18} color="#FFFFFF" />
                <ThemedText style={styles.emptyButtonText}>Aktivitäten hinzufügen</ThemedText>
              </Pressable>
            </View>
          ) : (
            activities.map((activity) => (
              <View key={activity.id} style={[styles.activityCard, { backgroundColor: colors.card }]}>
                {activity.primaryPhotoUrl && (
                  <Image source={{ uri: activity.primaryPhotoUrl }} style={styles.activityImage} contentFit="cover" />
                )}
                <View style={styles.activityContent}>
                  <ThemedText style={styles.activityName}>{activity.name}</ThemedText>
                  <View style={styles.activityLocation}>
                    <IconSymbol name="mappin" size={12} color={colors.textSecondary} />
                    <ThemedText style={[styles.activityAddress, { color: colors.textSecondary }]}>
                      {activity.adresse}
                    </ThemedText>
                  </View>
                  {activity.kosten_stufe !== null && (
                    <View
                      style={[
                        styles.activityCostBadge,
                        { backgroundColor: CostColors[activity.kosten_stufe] + "20" },
                      ]}
                    >
                      <ThemedText style={[styles.activityCostText, { color: CostColors[activity.kosten_stufe] }]}>
                        {["Gratis", "Günstig", "Mittel", "Teuer", "Sehr teuer"][activity.kosten_stufe]}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <Pressable
                  onPress={() => handleRemoveActivity(activity.ausflug_id)}
                  style={styles.activityRemove}
                >
                  <IconSymbol name="trash" size={18} color="#EF4444" />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Map Section */}
        {activities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="map.fill" size={24} color={colors.text} />
              <ThemedText style={styles.sectionTitle}>Karte</ThemedText>
            </View>
            <View style={styles.mapContainer}>
              <MapViewComponent
                trips={activities.map((a) => ({
                  id: a.ausflug_id,
                  name: a.name,
                  lat: null, // Will be fetched by MapView
                  lng: null,
                  kosten_stufe: a.kosten_stufe,
                  region: a.region,
                  primaryPhotoUrl: a.primaryPhotoUrl,
                }))}
                onMarkerPress={(id) => router.push(`/trip/${id}` as any)}
              />
            </View>
          </View>
        )}

        {/* Checklist Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="checklist" size={24} color={colors.text} />
            <ThemedText style={styles.sectionTitle}>Checklist</ThemedText>
          </View>

          {checklist.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleToggleChecklistItem(item.id)}
              style={[styles.checklistItem, { backgroundColor: colors.card }]}
            >
              <IconSymbol
                name={item.is_done ? "checkmark.circle.fill" : "circle"}
                size={24}
                color={item.is_done ? BrandColors.primary : colors.textSecondary}
              />
              <ThemedText
                style={[
                  styles.checklistText,
                  { color: item.is_done ? colors.textSecondary : colors.text },
                  item.is_done && styles.checklistTextDone,
                ]}
              >
                {item.title}
              </ThemedText>
              <Pressable onPress={() => handleDeleteChecklistItem(item.id)} hitSlop={8}>
                <IconSymbol name="trash" size={16} color="#EF4444" />
              </Pressable>
            </Pressable>
          ))}

          <View style={[styles.checklistInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={newChecklistItem}
              onChangeText={setNewChecklistItem}
              onSubmitEditing={handleAddChecklistItem}
              placeholder="Neue Aufgabe..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.checklistTextInput, { color: colors.text }]}
              returnKeyType="done"
            />
            {newChecklistItem.length > 0 && (
              <Pressable onPress={handleAddChecklistItem}>
                <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Notes Section */}
        <View style={[styles.section, { marginBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="note.text" size={24} color={colors.text} />
            <ThemedText style={styles.sectionTitle}>Notizen</ThemedText>
          </View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onBlur={handleNotesBlur}
            placeholder="Füge Notizen zu deinem Plan hinzu..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.notesInput,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 100,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerDateText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  activityCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  activityImage: {
    width: 80,
    height: 80,
  },
  activityContent: {
    flex: 1,
    padding: Spacing.sm,
    gap: 4,
  },
  activityName: {
    fontSize: 15,
    fontWeight: "600",
  },
  activityLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activityAddress: {
    fontSize: 12,
    flex: 1,
  },
  activityCostBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  activityCostText: {
    fontSize: 11,
    fontWeight: "600",
  },
  activityRemove: {
    padding: Spacing.sm,
    justifyContent: "center",
  },
  mapContainer: {
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
  },
  checklistTextDone: {
    textDecorationLine: "line-through",
  },
  checklistInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  checklistTextInput: {
    flex: 1,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 120,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 14,
  },
});
