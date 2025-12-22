import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { createAusflug } from "@/lib/supabase-api";
import { useAdmin } from "@/contexts/admin-context";

export default function CreateTripScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const { canEdit } = useAdmin();

    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        beschreibung: "",
        adresse: "",
        land: "Schweiz",
        region: "",
        kosten_stufe: 0,
        jahreszeiten: "",
        website_url: "",
        lat: "",
        lng: "",
        nice_to_know: "",
        altersempfehlung: "",
        parkplatz: "",
    });

    // Redirect if not admin
    if (!canEdit) {
        router.back();
        return null;
    }

    const handleCreate = async () => {
        // Validation
        if (!formData.name.trim()) {
            Alert.alert("Fehler", "Bitte Name eingeben");
            return;
        }
        if (!formData.adresse.trim()) {
            Alert.alert("Fehler", "Bitte Adresse eingeben");
            return;
        }

        setIsCreating(true);
        const result = await createAusflug({
            ...formData,
            kosten_stufe: formData.kosten_stufe,
            lat: formData.lat || undefined,
            lng: formData.lng || undefined,
        });
        setIsCreating(false);

        if (result.success) {
            Alert.alert(
                "Erfolg",
                "Ausflug erfolgreich erstellt!",
                [
                    {
                        text: "OK",
                        onPress: () => router.push(`/trip/${result.id}` as any),
                    },
                ]
            );
        } else {
            Alert.alert("Fehler", result.error || "Unbekannter Fehler");
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Neuer Ausflug",
                    headerShown: true,
                }}
            />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                    >
                        {/* Basis Info */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Basis-Informationen</ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Name *</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    placeholder="z.B. Rheinfall Schaffhausen"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Beschreibung</ThemedText>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                        { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                                    ]}
                                    value={formData.beschreibung}
                                    onChangeText={(text) => setFormData({ ...formData, beschreibung: text })}
                                    placeholder="Beschreibe den Ausflug..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Adresse *</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formData.adresse}
                                    onChangeText={(text) => setFormData({ ...formData, adresse: text })}
                                    placeholder="Straße, PLZ Ort"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>

                        {/* Standort */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Standort</ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Region</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formData.region}
                                    onChangeText={(text) => setFormData({ ...formData, region: text })}
                                    placeholder="z.B. Schaffhausen"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <ThemedText style={styles.label}>Latitude</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        value={formData.lat}
                                        onChangeText={(text) => setFormData({ ...formData, lat: text })}
                                        placeholder="47.xxxx"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <ThemedText style={styles.label}>Longitude</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        value={formData.lng}
                                        onChangeText={(text) => setFormData({ ...formData, lng: text })}
                                        placeholder="8.xxxx"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Details */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Details</ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Kosten-Stufe: {formData.kosten_stufe}</ThemedText>
                                <View style={styles.costButtons}>
                                    {[0, 1, 2, 3, 4].map((level) => (
                                        <Pressable
                                            key={level}
                                            onPress={() => setFormData({ ...formData, kosten_stufe: level })}
                                            style={[
                                                styles.costButton,
                                                {
                                                    backgroundColor: formData.kosten_stufe === level ? colors.primary : colors.surface,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.costButtonText,
                                                    { color: formData.kosten_stufe === level ? "#FFFFFF" : colors.text },
                                                ]}
                                            >
                                                {level}
                                            </ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Jahreszeiten</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formData.jahreszeiten}
                                    onChangeText={(text) => setFormData({ ...formData, jahreszeiten: text })}
                                    placeholder="z.B. Frühling, Sommer, Herbst, Winter"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Altersempfehlung</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formData.altersempfehlung}
                                    onChangeText={(text) => setFormData({ ...formData, altersempfehlung: text })}
                                    placeholder="z.B. Ab 6 Jahren"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>

                        {/* Zusatz */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Zusatzinfos</ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Website URL</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formData.website_url}
                                    onChangeText={(text) => setFormData({ ...formData, website_url: text })}
                                    placeholder="https://..."
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Parkplatz</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formData.parkplatz}
                                    onChangeText={(text) => setFormData({ ...formData, parkplatz: text })}
                                    placeholder="Parkplatz-Infos"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Nice to Know</ThemedText>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                        { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                                    ]}
                                    value={formData.nice_to_know}
                                    onChangeText={(text) => setFormData({ ...formData, nice_to_know: text })}
                                    placeholder="Zusätzliche Tipps..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        {/* Create Button */}
                        <Pressable
                            onPress={handleCreate}
                            disabled={isCreating}
                            style={({ pressed }) => [
                                styles.createButton,
                                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                            ]}
                        >
                            {isCreating ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                                    <ThemedText style={styles.createButtonText}>Ausflug erstellen</ThemedText>
                                </>
                            )}
                        </Pressable>
                    </ScrollView>
                </ThemedView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: Spacing.md,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: Spacing.xs,
    },
    input: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
    },
    row: {
        flexDirection: "row",
    },
    costButtons: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    costButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: "center",
    },
    costButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
