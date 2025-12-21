// Simplified plan tab components - placeholders until Supabase APIs are implemented

import { View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "@/constants/theme";

const styles = StyleSheet.create({
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
});

export function PackingListTab({ dayPlanId }: { dayPlanId: number }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    return (
        <View style={styles.tabContent}>
            <View style={styles.emptyTab}>
                <IconSymbol name="bag.fill" size={40} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                    Packliste kommt bald
                </ThemedText>
            </View>
        </View>
    );
}

export function BudgetTab({ dayPlanId }: { dayPlanId: number }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    return (
        <View style={styles.tabContent}>
            <View style={styles.emptyTab}>
                <IconSymbol name="dollarsign.circle.fill" size={40} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                    Budget kommt bald
                </ThemedText>
            </View>
        </View>
    );
}

export function ChecklistTab({ dayPlanId }: { dayPlanId: number }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    return (
        <View style={styles.tabContent}>
            <View style={styles.emptyTab}>
                <IconSymbol name="checkmark.circle.fill" size={40} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                    Checkliste kommt bald
                </ThemedText>
            </View>
        </View>
    );
}

export function ActivitiesTab({ dayPlanId }: { dayPlanId: number }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const router = useRouter();

    return (
        <View style={styles.tabContent}>
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
        </View>
    );
}
