import { useRouter } from "expo-router";
import { useState } from "react";
import {
    View,
    ScrollView,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { createPlan } from "@/lib/planning-api";

export default function CreatePlanScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [startDate, setStartDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Titel ein");
            return;
        }

        if (!startDate.trim()) {
            Alert.alert("Fehler", "Bitte gib ein Datum ein");
            return;
        }

        // Simple date parsing for MVP - format: DD.MM.YYYY
        const dateParts = startDate.split(".");
        if (dateParts.length !== 3) {
            Alert.alert("Fehler", "Datum muss im Format TT.MM.JJJJ sein (z.B. 25.12.2024)");
            return;
        }

        const date = new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[0])
        );

        if (isNaN(date.getTime())) {
            Alert.alert("Fehler", "Ungültiges Datum");
            return;
        }

        setIsLoading(true);
        const result = await createPlan({
            title: title.trim(),
            description: description.trim() || undefined,
            location: location.trim() || undefined,
            start_date: date.toISOString(),
        });
        setIsLoading(false);

        if (result.success && result.plan) {
            router.back();
            // TODO: Navigate to plan detail
            // router.push(`/planning/${result.plan.id}` as any);
        } else {
            Alert.alert("Fehler", result.error || "Plan konnte nicht erstellt werden");
        }
    };

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </Pressable>
                <ThemedText style={styles.headerTitle}>Neuer Plan</ThemedText>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
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
                        placeholder="z.B. Wochenendausflug ins Emmental"
                        placeholderTextColor={colors.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Date */}
                <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>Datum *</ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder="TT.MM.JJJJ (z.B. 25.12.2024)"
                        placeholderTextColor={colors.textSecondary}
                        value={startDate}
                        onChangeText={setStartDate}
                        keyboardType="numeric"
                    />
                    <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
                        Format: TT.MM.JJJJ
                    </ThemedText>
                </View>

                {/* Location */}
                <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>Ort (optional)</ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder="z.B. Emmental, BE"
                        placeholderTextColor={colors.textSecondary}
                        value={location}
                        onChangeText={setLocation}
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
                        placeholder="Beschreibe deinen Ausflug..."
                        placeholderTextColor={colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Create Button */}
                <Pressable
                    onPress={handleCreate}
                    disabled={isLoading}
                    style={[
                        styles.createButton,
                        { backgroundColor: isLoading ? colors.border : colors.primary },
                    ]}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                            <ThemedText style={styles.createButtonText}>
                                Plan erstellen
                            </ThemedText>
                        </>
                    )}
                </Pressable>
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
    placeholder: {
        width: 44,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        paddingTop: Spacing.md,
    },
    hint: {
        fontSize: 12,
        marginTop: Spacing.xs,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.lg,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
