import { useRouter, Stack } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import {
    View,
    FlatList,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PlanCard } from "@/components/planning/PlanCard";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { getPlans, type Plan } from "@/lib/planning-api";

type FilterType = "all" | "upcoming" | "past";

export default function PlanningIndexScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const { isAuthenticated } = useAuth();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [filter, setFilter] = useState<FilterType>("upcoming");
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPlans = useCallback(async () => {
        setIsLoading(true);
        const data = await getPlans();
        setPlans(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadPlans();
        }
    }, [isAuthenticated, loadPlans]);

    const handlePlanPress = (planId: string) => {
        router.push(`/planning/${planId}` as any);
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPlans();
        setRefreshing(false);
    }, [loadPlans]);

    const filteredPlans = plans.filter((plan) => {
        if (filter === "upcoming") {
            return plan.status !== "completed" && plan.status !== "cancelled";
        } else if (filter === "past") {
            return plan.status === "completed" || plan.status === "cancelled";
        }
        return true;
    });

    if (!isAuthenticated) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                    <View style={styles.header}>
                        <ThemedText style={styles.headerTitle}>Planung</ThemedText>
                    </View>
                    <View style={styles.emptyContainer}>
                        <IconSymbol name="calendar" size={64} color={colors.textSecondary} />
                        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                            Anmeldung erforderlich
                        </ThemedText>
                        <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Melde dich an, um Ausflüge zu planen
                        </ThemedText>
                        <Pressable
                            onPress={() => router.push("/login" as any)}
                            style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        >
                            <ThemedText style={styles.loginButtonText}>Anmelden</ThemedText>
                        </Pressable>
                    </View>
                </ThemedView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.push("/(tabs)")}
                        style={styles.backButton}
                    >
                        <IconSymbol name="chevron.left" size={24} color={colors.text} />
                    </Pressable>
                    <ThemedText style={styles.headerTitle}>Planung</ThemedText>
                    <Pressable
                        onPress={() => router.push("/planning/create" as any)}
                        style={styles.addButton}
                    >
                        <IconSymbol name="plus" size={24} color={colors.text} />
                    </Pressable>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {[
                        { key: "upcoming" as const, label: "Geplant" },
                        { key: "past" as const, label: "Vergangen" },
                        { key: "all" as const, label: "Alle" },
                    ].map((option) => (
                        <Pressable
                            key={option.key}
                            onPress={() => setFilter(option.key)}
                            style={[
                                styles.filterTab,
                                {
                                    backgroundColor: filter === option.key ? colors.primary : colors.surface,
                                    borderColor: filter === option.key ? colors.primary : colors.border,
                                },
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.filterTabText,
                                    { color: filter === option.key ? "#FFFFFF" : colors.text },
                                ]}
                            >
                                {option.label}
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>

                {/* Plans List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : filteredPlans.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <IconSymbol name="calendar" size={64} color={colors.textSecondary} />
                        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                            Keine Pläne vorhanden
                        </ThemedText>
                        <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Erstelle deinen ersten Plan
                        </ThemedText>
                    </View>
                ) : (
                    <FlatList
                        data={filteredPlans}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <PlanCard plan={item} onPress={() => handlePlanPress(item.id)} />
                        )}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={colors.primary}
                            />
                        }
                    />
                )}
            </ThemedView>
        </>
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
    addButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    filterTabs: {
        flexDirection: "row",
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    filterTab: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: "center",
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: "600",
    },
    list: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
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
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: "center",
    },
    loginButton: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
