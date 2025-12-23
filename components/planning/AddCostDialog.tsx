import { useState } from "react";
import {
    View,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { CostCategory } from "@/lib/planning-api";

interface AddCostDialogProps {
    visible: boolean;
    planId: string;
    onClose: () => void;
    onAdd: (cost: {
        category: CostCategory;
        description: string;
        amount: number;
        per_person?: boolean;
    }) => Promise<void>;
}

export function AddCostDialog({ visible, planId, onClose, onAdd }: AddCostDialogProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<CostCategory>("other");
    const [perPerson, setPerPerson] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const categories: { key: CostCategory; label: string; icon: string }[] = [
        { key: "entrance", label: "Eintritt", icon: "ticket" },
        { key: "parking", label: "Parkplatz", icon: "parkingsign" },
        { key: "transport", label: "Transport", icon: "car" },
        { key: "food", label: "Verpflegung", icon: "fork.knife" },
        { key: "other", label: "Sonstiges", icon: "ellipsis.circle" },
    ];

    const handleAdd = async () => {
        if (!description.trim()) {
            Alert.alert("Fehler", "Bitte gib eine Beschreibung ein");
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert("Fehler", "Bitte gib einen gültigen Betrag ein");
            return;
        }

        setIsLoading(true);
        try {
            await onAdd({
                category,
                description: description.trim(),
                amount: parsedAmount,
                per_person: perPerson,
            });

            // Reset form
            setDescription("");
            setAmount("");
            setCategory("other");
            setPerPerson(false);
            onClose();
        } catch (error) {
            Alert.alert("Fehler", "Kosten konnten nicht hinzugefügt werden");
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
                        <ThemedText style={styles.title}>Kosten hinzufügen</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <IconSymbol name="xmark.circle.fill" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Beschreibung *</ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="z.B. Zoo-Eintritt"
                            placeholderTextColor={colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Amount */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Betrag (CHF) *</ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Category */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Kategorie</ThemedText>
                        <View style={styles.categoryGrid}>
                            {categories.map((cat) => (
                                <Pressable
                                    key={cat.key}
                                    onPress={() => setCategory(cat.key)}
                                    style={[
                                        styles.categoryButton,
                                        {
                                            backgroundColor: category === cat.key ? colors.primary : colors.surface,
                                            borderColor: category === cat.key ? colors.primary : colors.border,
                                        },
                                    ]}
                                >
                                    <IconSymbol
                                        name={cat.icon as any}
                                        size={20}
                                        color={category === cat.key ? "#FFFFFF" : colors.text}
                                    />
                                    <ThemedText
                                        style={[
                                            styles.categoryText,
                                            { color: category === cat.key ? "#FFFFFF" : colors.text },
                                        ]}
                                    >
                                        {cat.label}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Per Person Toggle */}
                    <Pressable
                        onPress={() => setPerPerson(!perPerson)}
                        style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <View style={styles.toggleInfo}>
                            <ThemedText style={styles.toggleLabel}>Pro Person</ThemedText>
                            <ThemedText style={[styles.toggleHint, { color: colors.textSecondary }]}>
                                Kosten pro Teilnehmer
                            </ThemedText>
                        </View>
                        <View
                            style={[
                                styles.toggle,
                                {
                                    backgroundColor: perPerson ? colors.primary : colors.border,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.toggleThumb,
                                    { transform: [{ translateX: perPerson ? 20 : 2 }] },
                                ]}
                            />
                        </View>
                    </Pressable>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <Pressable
                            onPress={onClose}
                            style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
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
    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    categoryButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: "500",
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    toggleHint: {
        fontSize: 12,
        marginTop: 2,
    },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
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
