import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
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
import { createAusflug, uploadAusflugPhoto, getNiceToKnowOptions, getKategorieOptions } from "@/lib/supabase-api";
import { geocodeAddress } from "@/lib/geocoding";
import { useAdmin } from "@/contexts/admin-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

export default function CreateTripScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const { canEdit } = useAdmin();

    const [isCreating, setIsCreating] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ uri: string; fileName: string } | null>(null);
    const [niceToKnowOptions, setNiceToKnowOptions] = useState<{ category: string; options: string[] }[]>([]);
    const [kategorieOptions, setKategorieOptions] = useState<string[]>([]);
    const [kategorieExpanded, setKategorieExpanded] = useState(false);
    const [niceToKnowExpanded, setNiceToKnowExpanded] = useState(false);
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
        nice_to_know: [] as string[],
        altersempfehlung: "",
        parkplatz: "",
        kategorie_alt: [] as string[],
    });

    // Load nice to know options
    useEffect(() => {
        async function loadOptions() {
            const options = await getNiceToKnowOptions();
            setNiceToKnowOptions(options);

            const categories = await getKategorieOptions();
            setKategorieOptions(categories);
        }
        loadOptions();
    }, []);

    // Redirect if not admin
    if (!canEdit) {
        router.back();
        return null;
    }

    const handleGeocode = async () => {
        if (!formData.adresse.trim()) {
            return; // Silently skip if no address
        }

        // Skip if coordinates already exist (user manually entered them)
        if (formData.lat && formData.lng) {
            return;
        }

        setIsGeocoding(true);
        const result = await geocodeAddress(formData.adresse);
        setIsGeocoding(false);

        if (result) {
            setFormData({
                ...formData,
                lat: result.lat,
                lng: result.lng,
            });
            // No alert needed for automatic geocoding
        }
        // Silently fail if geocoding doesn't work - user can enter manually
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Berechtigung erforderlich", "Bitte erlaube den Zugriff auf deine Fotos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setSelectedImage({
                uri: asset.uri,
                fileName: asset.fileName || `cover_${Date.now()}.jpg`,
            });
        }
    };

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
            nice_to_know: formData.nice_to_know.join(", "), // Join array to string
            kategorie_alt: formData.kategorie_alt.join(", "), // Join array to string
        });

        // Upload image if selected
        if (result.success && result.id && selectedImage) {
            await uploadAusflugPhoto(
                result.id,
                selectedImage.uri,
                selectedImage.fileName,
                true // First photo is primary (title image)
            );
        }

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
                    headerBackTitle: "Zurück",
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
                                <Pressable
                                    onPress={() => setKategorieExpanded(!kategorieExpanded)}
                                    style={[styles.collapsibleHeader, { borderColor: colors.border }]}
                                >
                                    <ThemedText style={styles.label}>Kategorie</ThemedText>
                                    <IconSymbol
                                        name={kategorieExpanded ? "chevron.up" : "chevron.down"}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                                {kategorieExpanded && (
                                    kategorieOptions.length > 0 ? (
                                        <View style={styles.checkboxContainer}>
                                            {kategorieOptions.map((kategorie) => (
                                                <Pressable
                                                    key={kategorie}
                                                    onPress={() => {
                                                        const isSelected = formData.kategorie_alt.includes(kategorie);
                                                        setFormData({
                                                            ...formData,
                                                            kategorie_alt: isSelected
                                                                ? formData.kategorie_alt.filter(v => v !== kategorie)
                                                                : [...formData.kategorie_alt, kategorie]
                                                        });
                                                    }}
                                                    style={[styles.checkboxItem, { borderColor: colors.border }]}
                                                >
                                                    <View style={[
                                                        styles.checkbox,
                                                        {
                                                            backgroundColor: formData.kategorie_alt.includes(kategorie) ? colors.primary : colors.surface,
                                                            borderColor: formData.kategorie_alt.includes(kategorie) ? colors.primary : colors.border,
                                                        }
                                                    ]}>
                                                        {formData.kategorie_alt.includes(kategorie) && (
                                                            <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                                                        )}
                                                    </View>
                                                    <ThemedText style={styles.checkboxLabel}>{kategorie}</ThemedText>
                                                </Pressable>
                                            ))}
                                        </View>
                                    ) : (
                                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                            Keine Kategorien verfügbar
                                        </ThemedText>
                                    )
                                )}
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
                                    onBlur={handleGeocode}
                                    placeholder="Straße, PLZ Ort"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                {isGeocoding && (
                                    <View style={styles.geocodingIndicator}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <ThemedText style={[styles.geocodingText, { color: colors.textSecondary }]}>
                                            Koordinaten werden ermittelt...
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Titelbild */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Titelbild (Optional)</ThemedText>

                            {selectedImage ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image
                                        source={{ uri: selectedImage.uri }}
                                        style={styles.imagePreview}
                                        contentFit="cover"
                                    />
                                    <Pressable
                                        onPress={() => setSelectedImage(null)}
                                        style={[styles.removeImageButton, { backgroundColor: "#EF4444" }]}
                                    >
                                        <IconSymbol name="xmark" size={16} color="#FFFFFF" />
                                    </Pressable>
                                    <Pressable
                                        onPress={handlePickImage}
                                        style={[styles.changeImageButton, { backgroundColor: colors.primary }]}
                                    >
                                        <IconSymbol name="photo" size={14} color="#FFFFFF" />
                                        <ThemedText style={styles.changeImageText}>Ändern</ThemedText>
                                    </Pressable>
                                </View>
                            ) : (
                                <Pressable
                                    onPress={handlePickImage}
                                    style={[styles.pickImageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                >
                                    <IconSymbol name="photo" size={32} color={colors.textSecondary} />
                                    <ThemedText style={[styles.pickImageText, { color: colors.textSecondary }]}>
                                        Titelbild auswählen
                                    </ThemedText>
                                </Pressable>
                            )}
                        </View>

                        {/* Standort */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Standort</ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Land *</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formData.land}
                                    onChangeText={(text) => setFormData({ ...formData, land: text })}
                                    placeholder="z.B. Schweiz"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

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
                                <Pressable
                                    onPress={() => setNiceToKnowExpanded(!niceToKnowExpanded)}
                                    style={[styles.collapsibleHeader, { borderColor: colors.border }]}
                                >
                                    <ThemedText style={styles.label}>Nice to Know</ThemedText>
                                    <IconSymbol
                                        name={niceToKnowExpanded ? "chevron.up" : "chevron.down"}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                                {niceToKnowExpanded && (
                                    niceToKnowOptions && niceToKnowOptions.length > 0 ? (
                                        <View style={styles.checkboxContainer}>
                                            {niceToKnowOptions.map(({ category, options }) => (
                                                <View key={category} style={styles.categorySection}>
                                                    <ThemedText style={[styles.categoryTitle, { color: colors.textSecondary }]}>
                                                        {category}
                                                    </ThemedText>
                                                    <View style={styles.categoryOptions}>
                                                        {options.map((option) => (
                                                            <Pressable
                                                                key={option}
                                                                onPress={() => {
                                                                    const isSelected = formData.nice_to_know.includes(option);
                                                                    setFormData({
                                                                        ...formData,
                                                                        nice_to_know: isSelected
                                                                            ? formData.nice_to_know.filter(v => v !== option)
                                                                            : [...formData.nice_to_know, option]
                                                                    });
                                                                }}
                                                                style={[styles.checkboxItem, { borderColor: colors.border }]}
                                                            >
                                                                <View style={[
                                                                    styles.checkbox,
                                                                    {
                                                                        backgroundColor: formData.nice_to_know.includes(option) ? colors.primary : colors.surface,
                                                                        borderColor: formData.nice_to_know.includes(option) ? colors.primary : colors.border,
                                                                    }
                                                                ]}>
                                                                    {formData.nice_to_know.includes(option) && (
                                                                        <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                                                                    )}
                                                                </View>
                                                                <ThemedText style={styles.checkboxLabel}>{option}</ThemedText>
                                                            </Pressable>
                                                        ))}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                            Keine Optionen verfügbar
                                        </ThemedText>
                                    )
                                )}
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
    geocodingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    geocodingText: {
        fontSize: 12,
    },
    pickImageButton: {
        height: 160,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        gap: Spacing.sm,
    },
    pickImageText: {
        fontSize: 14,
        fontWeight: "500",
    },
    imagePreviewContainer: {
        position: "relative",
        height: 200,
        borderRadius: BorderRadius.lg,
        overflow: "hidden",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    removeImageButton: {
        position: "absolute",
        top: Spacing.sm,
        right: Spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    changeImageButton: {
        position: "absolute",
        bottom: Spacing.sm,
        right: Spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    changeImageText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
    },
    checkboxContainer: {
        gap: Spacing.sm,
    },
    checkboxItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 15,
    },
    categoryButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    categoryButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        minWidth: 80,
        alignItems: "center",
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: "500",
    },
    collapsibleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    categorySection: {
        marginBottom: Spacing.lg,
    },
    categoryTitle: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: Spacing.sm,
        textTransform: "uppercase",
    },
    categoryOptions: {
        gap: Spacing.sm,
    },
});
