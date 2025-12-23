import { useState } from "react";
import {
    View,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { TaskPriority, TaskType } from "@/lib/planning-api";

interface AddTaskDialogProps {
    visible: boolean;
    planId: string;
    onClose: () => void;
    onAdd: (task: {
        title: string;
        description?: string;
        priority: TaskPriority;
        task_type: TaskType;
        due_date?: string;
    }) => Promise<void>;
}

export function AddTaskDialog({ visible, planId, onClose, onAdd }: AddTaskDialogProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [taskType, setTaskType] = useState<TaskType>("general");
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async () => {
        if (!title.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Titel ein");
            return;
        }

        setIsLoading(true);
        try {
            await onAdd({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                task_type: taskType,
                due_date: dueDate?.toISOString(),
            });

            // Reset form
            setTitle("");
            setDescription("");
            setPriority("medium");
            setTaskType("general");
            setDueDate(null);
            onClose();
        } catch (error) {
            Alert.alert("Fehler", "Aufgabe konnte nicht erstellt werden");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>Neue Aufgabe</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <IconSymbol name="xmark.circle.fill" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Title */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Titel *</ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="z.B. Tickets buchen"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Beschreibung (optional)</ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Weitere Details..."
                            placeholderTextColor={colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={2}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Type */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Typ</ThemedText>
                        <View style={styles.optionRow}>
                            {(["general", "packing", "booking"] as TaskType[]).map((type) => (
                                <Pressable
                                    key={type}
                                    onPress={() => setTaskType(type)}
                                    style={[
                                        styles.option,
                                        {
                                            backgroundColor: taskType === type ? colors.primary : colors.surface,
                                            borderColor: taskType === type ? colors.primary : colors.border,
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.optionText,
                                            { color: taskType === type ? "#FFFFFF" : colors.text },
                                        ]}
                                    >
                                        {type === "packing" ? "Packen" : type === "booking" ? "Buchung" : "Allgemein"}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Priority */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Priorität</ThemedText>
                        <View style={styles.optionRow}>
                            {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                                <Pressable
                                    key={p}
                                    onPress={() => setPriority(p)}
                                    style={[
                                        styles.option,
                                        {
                                            backgroundColor: priority === p ? colors.primary : colors.surface,
                                            borderColor: priority === p ? colors.primary : colors.border,
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.optionText,
                                            { color: priority === p ? "#FFFFFF" : colors.text },
                                        ]}
                                    >
                                        {p === "low" ? "Niedrig" : p === "medium" ? "Mittel" : "Hoch"}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Due Date */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Fälligkeitsdatum (optional)</ThemedText>
                        <Pressable
                            onPress={() => setShowDatePicker(true)}
                            style={[
                                styles.dateInput,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <IconSymbol name="calendar" size={18} color={colors.text} />
                            <ThemedText style={{ color: dueDate ? colors.text : colors.textSecondary }}>
                                {dueDate
                                    ? dueDate.toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "Datum wählen"}
                            </ThemedText>
                            {dueDate && (
                                <Pressable
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setDueDate(null);
                                    }}
                                    style={styles.clearButton}
                                >
                                    <IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} />
                                </Pressable>
                            )}
                        </Pressable>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dueDate || new Date()}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                    setDueDate(selectedDate);
                                }
                            }}
                        />
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <Pressable
                            onPress={onClose}
                            style={[
                                styles.button,
                                styles.cancelButton,
                                { borderColor: colors.border },
                            ]}
                        >
                            <ThemedText style={{ color: colors.text }}>Abbrechen</ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={handleAdd}
                            disabled={isLoading}
                            style={[
                                styles.button,
                                styles.addButton,
                                { backgroundColor: isLoading ? colors.border : colors.primary },
                            ]}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                                    Hinzufügen
                                </ThemedText>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    container: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        maxHeight: "90%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    closeButton: {
        padding: Spacing.xs,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: 15,
    },
    textArea: {
        minHeight: 60,
        paddingTop: Spacing.md,
    },
    optionRow: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    option: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: "center",
    },
    optionText: {
        fontSize: 13,
        fontWeight: "500",
    },
    dateInput: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    clearButton: {
        marginLeft: "auto",
    },
    buttonRow: {
        flexDirection: "row",
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    button: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: "center",
    },
    cancelButton: {
        borderWidth: 1,
    },
    addButton: {},
});
