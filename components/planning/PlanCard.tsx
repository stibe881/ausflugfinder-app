import { Pressable, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBadge } from "./StatusBadge";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Plan } from "@/lib/planning-api";

interface PlanCardProps {
    plan: Plan;
    participantCount?: number;
    onPress: () => void;
}

export function PlanCard({ plan, participantCount = 0, onPress }: PlanCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const startDate = new Date(plan.start_date);
    const formattedDate = startDate.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const daysUntil = Math.ceil(
        (startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                },
            ]}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <ThemedText style={styles.title} numberOfLines={1}>
                        {plan.title}
                    </ThemedText>
                    {plan.location && (
                        <View style={styles.locationRow}>
                            <IconSymbol name="mappin" size={12} color={colors.textSecondary} />
                            <ThemedText style={[styles.location, { color: colors.textSecondary }]}>
                                {plan.location}
                            </ThemedText>
                        </View>
                    )}
                </View>
                <StatusBadge status={plan.status} />
            </View>

            <View style={styles.footer}>
                <View style={styles.dateContainer}>
                    <IconSymbol name="calendar" size={16} color={colors.primary} />
                    <ThemedText style={[styles.date, { color: colors.text }]}>
                        {formattedDate}
                    </ThemedText>
                    {daysUntil > 0 && daysUntil < 30 && (
                        <ThemedText style={[styles.daysUntil, { color: colors.textSecondary }]}>
                            in {daysUntil} Tag{daysUntil !== 1 ? "en" : ""}
                        </ThemedText>
                    )}
                </View>

                <View style={styles.participants}>
                    <IconSymbol name="person.2.fill" size={16} color={colors.textSecondary} />
                    <ThemedText style={[styles.participantCount, { color: colors.textSecondary }]}>
                        {participantCount}
                    </ThemedText>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    location: {
        fontSize: 14,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dateContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    date: {
        fontSize: 14,
        fontWeight: "500",
    },
    daysUntil: {
        fontSize: 12,
    },
    participants: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    participantCount: {
        fontSize: 14,
        fontWeight: "500",
    },
});
