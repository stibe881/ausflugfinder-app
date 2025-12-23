import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
    View,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StatusBadge } from "@/components/planning/StatusBadge";
import { ParticipantInvite } from "@/components/planning/ParticipantInvite";
import { getPlan, type Plan } from "@/lib/planning-api";
import { supabase } from "@/lib/supabase";

interface PlanTrip {
    id: string;
    trip_id?: number;
    custom_location?: string;
    planned_date: string;
    trip?: {
        id: number;
        title: string;
        kurzbeschrieb?: string;
    };
}

export default function PlanDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const [plan, setPlan] = useState<Plan | null>(null);
    const [planTrips, setPlanTrips] = useState<PlanTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPlan();
    }, [id]);

    const loadPlan = async () => {
        if (!id) return;

        setIsLoading(true);

        // Load plan
        const result = await getPlan(id);
        if (result.success && result.plan) {
            setPlan(result.plan);
        }

        // Load plan trips
        const { data: trips } = await supabase
            .from("plan_trips")
            .select(`
        *,
        trip:ausfluege(id, title, kurzbeschrieb)
      `)
            .eq("plan_id", id)
            .order("sequence");

        if (trips) {
            setPlanTrips(trips as any);
        }

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </ThemedView>
        );
    }

    if (!plan) {
        return (
            <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.emptyContainer}>
                    <ThemedText>Plan nicht gefunden</ThemedText>
                    <Pressable
                        onPress={() => router.back()}
                        style={[styles.button, { backgroundColor: colors.primary }]}
                    >
                        <ThemedText style={styles.buttonText}>Zurück</ThemedText>
                    </Pressable>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </Pressable>
                <ThemedText style={styles.headerTitle}>Plan Details</ThemedText>
                <Pressable style={styles.menuButton}>
                    <IconSymbol name="ellipsis.circle" size={24} color={colors.text} />
                </Pressable>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Plan Info */}
                <View style={styles.section}>
                    <ThemedText style={styles.planTitle}>{plan.title}</ThemedText>
                    <View style={styles.statusRow}>
                        <StatusBadge status={plan.status} />
                        <ThemedText style={[styles.createdDate, { color: colors.textSecondary }]}>
                            Erstellt am {new Date(plan.created_at).toLocaleDateString("de-DE")}
                        </ThemedText>
                    </View>
                    {plan.description && (
                        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                            {plan.description}
                        </ThemedText>
                    )}
                </View>

                {/* Trips */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Ausflüge ({planTrips.length})</ThemedText>
                    </View>
                    {planTrips.map((trip) => (
                        <View
                            key={trip.id}
                            style={[
                                styles.tripCard,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                        >
                            <View style={styles.tripHeader}>
                                <IconSymbol
                                    name={trip.trip_id ? "mappin.circle.fill" : "location.fill"}
                                    size={20}
                                    color={colors.primary}
                                />
                                <ThemedText style={styles.tripTitle}>
                                    {trip.trip?.title || trip.custom_location}
                                </ThemedText>
                            </View>
                            <View style={styles.tripMeta}>
                                <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                                <ThemedText style={[styles.tripDate, { color: colors.textSecondary }]}>
                                    {new Date(trip.planned_date).toLocaleDateString("de-DE", {
                                        weekday: "short",
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </ThemedText>
                            </View>
                            {trip.trip?.kurzbeschrieb && (
                                <ThemedText
                                    style={[styles.tripDescription, { color: colors.textSecondary }]}
                                    numberOfLines={2}
                                >
                                    {trip.trip.kurzbeschrieb}
                                </ThemedText>
                            )}
                        </View>
                    ))}
                </View>

                {/* Participants */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Teilnehmer</ThemedText>
                    <ParticipantInvite planId={id!} onInvited={loadPlan} />
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Schnellzugriff</ThemedText>
                    <View style={styles.quickActions}>
                        <Pressable
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => Alert.alert("Coming Soon", "Teilnehmerverwaltung wird noch implementiert")}
                        >
                            <IconSymbol name="person.2.fill" size={32} color={colors.primary} />
                            <ThemedText style={styles.actionLabel}>Teilnehmer</ThemedText>
                            <ThemedText style={[styles.actionCount, { color: colors.textSecondary }]}>
                                Bald verfügbar
                            </ThemedText>
                        </Pressable>

                        <Pressable
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => Alert.alert("Coming Soon", "Aufgabenverwaltung wird noch implementiert")}
                        >
                            <IconSymbol name="checklist" size={32} color={colors.primary} />
                            <ThemedText style={styles.actionLabel}>Aufgaben</ThemedText>
                            <ThemedText style={[styles.actionCount, { color: colors.textSecondary }]}>
                                Bald verfügbar
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    menuButton: {
        width: 44,
        height: 44,
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
        gap: Spacing.lg,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    planTitle: {
        fontSize: 28,
        fontWeight: "bold",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    createdDate: {
        fontSize: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: Spacing.sm,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    tripCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    tripHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    tripTitle: {
        fontSize: 16,
        fontWeight: "600",
        flex: 1,
    },
    tripMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    tripDate: {
        fontSize: 12,
    },
    tripDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    quickActions: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    actionCard: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: "center",
        gap: Spacing.sm,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    actionCount: {
        fontSize: 12,
    },
    button: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
