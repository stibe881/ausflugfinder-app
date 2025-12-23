import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface BudgetSummaryProps {
    total: number;
    perPerson: number;
    participantCount: number;
}

export function BudgetSummary({ total, perPerson, participantCount }: BudgetSummaryProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    return (
        <View style={[styles.container, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
            <View style={styles.row}>
                <View style={styles.stat}>
                    <IconSymbol name="dollarsign.circle" size={24} color={colors.primary} />
                    <View style={styles.statText}>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                            Total
                        </ThemedText>
                        <ThemedText style={styles.statValue}>CHF {total.toFixed(2)}</ThemedText>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.stat}>
                    <IconSymbol name="person.circle" size={24} color={colors.primary} />
                    <View style={styles.statText}>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                            Pro Person
                        </ThemedText>
                        <ThemedText style={styles.statValue}>CHF {perPerson.toFixed(2)}</ThemedText>
                    </View>
                </View>
            </View>

            {participantCount > 0 && (
                <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
                    Basierend auf {participantCount} {participantCount === 1 ? "Teilnehmer" : "Teilnehmern"}
                </ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    stat: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        flex: 1,
    },
    statText: {
        gap: 2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: "500",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
    },
    divider: {
        width: 1,
        backgroundColor: "#00000010",
        marginHorizontal: Spacing.md,
    },
    hint: {
        fontSize: 11,
        textAlign: "center",
    },
});
