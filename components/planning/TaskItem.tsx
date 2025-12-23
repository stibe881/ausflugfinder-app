import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { PlanTask } from "@/lib/planning-api";

interface TaskItemProps {
    task: PlanTask;
    onToggle: (taskId: string) => void;
    onPress?: (taskId: string) => void;
}

export function TaskItem({ task, onToggle, onPress }: TaskItemProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const priorityColors = {
        low: "#10B981",
        medium: "#F59E0B",
        high: "#EF4444",
    };

    return (
        <Pressable
            onPress={() => onPress?.(task.id)}
            style={[
                styles.container,
                { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
        >
            {/* Checkbox */}
            <Pressable
                onPress={() => onToggle(task.id)}
                style={[
                    styles.checkbox,
                    {
                        borderColor: task.is_completed ? colors.primary : colors.border,
                        backgroundColor: task.is_completed ? colors.primary : "transparent",
                    },
                ]}
            >
                {task.is_completed && (
                    <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                )}
            </Pressable>

            {/* Content */}
            <View style={styles.content}>
                <ThemedText
                    style={[
                        styles.title,
                        task.is_completed && { textDecorationLine: "line-through", opacity: 0.6 },
                    ]}
                >
                    {task.title}
                </ThemedText>

                {task.description && (
                    <ThemedText
                        style={[styles.description, { color: colors.textSecondary }]}
                        numberOfLines={1}
                    >
                        {task.description}
                    </ThemedText>
                )}

                {/* Meta */}
                <View style={styles.meta}>
                    {/* Priority */}
                    <View
                        style={[
                            styles.priorityBadge,
                            { backgroundColor: priorityColors[task.priority] + "20" },
                        ]}
                    >
                        <ThemedText
                            style={[styles.priorityText, { color: priorityColors[task.priority] }]}
                        >
                            {task.priority === "low" ? "Niedrig" : task.priority === "medium" ? "Mittel" : "Hoch"}
                        </ThemedText>
                    </View>

                    {/* Type */}
                    <View style={[styles.typeBadge, { backgroundColor: colors.border }]}>
                        <ThemedText style={[styles.typeText, { color: colors.text }]}>
                            {task.task_type === "packing"
                                ? "Packen"
                                : task.task_type === "booking"
                                    ? "Buchung"
                                    : "Allgemein"}
                        </ThemedText>
                    </View>

                    {/* Due Date */}
                    {task.due_date && (
                        <View style={styles.dateContainer}>
                            <IconSymbol name="calendar" size={12} color={colors.textSecondary} />
                            <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                                {new Date(task.due_date).toLocaleDateString("de-DE", {
                                    day: "2-digit",
                                    month: "short",
                                })}
                            </ThemedText>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: BorderRadius.sm,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
        gap: Spacing.xs,
    },
    title: {
        fontSize: 15,
        fontWeight: "600",
    },
    description: {
        fontSize: 13,
    },
    meta: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    priorityBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: "600",
    },
    typeBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    typeText: {
        fontSize: 11,
    },
    dateContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    dateText: {
        fontSize: 11,
    },
});
