import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { PlanStatus } from "@/lib/planning-api";

const STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; icon: string }> = {
    idea: { label: "Idee", color: "#6B7280", icon: "lightbulb" },
    planning: { label: "In Planung", color: "#F59E0B", icon: "clock" },
    confirmed: { label: "Fix", color: "#10B981", icon: "checkmark.circle" },
    completed: { label: "Erledigt", color: "#8B5CF6", icon: "checkmark.circle.fill" },
    cancelled: { label: "Abgesagt", color: "#EF4444", icon: "xmark.circle" },
};

export function StatusBadge({ status }: { status: PlanStatus }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const config = STATUS_CONFIG[status];

    return (
        <View style={[styles.badge, { backgroundColor: config.color + "20" }]}>
            <IconSymbol name={config.icon} size={14} color={config.color} />
            <ThemedText style={[styles.text, { color: config.color }]}>
                {config.label}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    text: {
        fontSize: 12,
        fontWeight: "600",
    },
});
