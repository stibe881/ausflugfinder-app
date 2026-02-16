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
import { createAusflug, uploadAusflugPhoto } from "@/lib/supabase-api";
import { KATEGORIE_OPTIONS, getNiceToKnowForCategories } from "@/lib/category-nice-to-know";
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
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    const [kategorieExpanded, setKategorieExpanded] = useState(false);
    const [niceToKnowExpanded, setNiceToKnowExpanded] = useState(false);
    const [jahreszeitenExpanded, setJahreszeitenExpanded] = useState(false);
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

    // Derive nice-to-know options from selected categories
    const niceToKnowOptions = getNiceToKnowForCategories(formData.kategorie_alt);

    // When categories change, remove any nice-to-know values that are no longer valid
    useEffect(() => {
        const validOptions = new Set<string>();
        niceToKnowOptions.forEach(g => g.options.forEach(o => validOptions.add(o)));
        const filtered = formData.nice_to_know.filter(v => validOptions.has(v));
        if (filtered.length !== formData.nice_to_know.length) {
            setFormData(prev => ({ ...prev, nice_to_know: filtered }));
        }
    }, [formData.kategorie_alt.join(',')]);

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
            alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Must be false for multiple selection usually, or one by one
            allowsMultipleSelection: true, // Enable multiple
            selectionLimit: 0, // Unlimited
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            // Append new images to existing list
            setSelectedImages(prev => [...prev, ...result.assets.map(asset => asset.uri)]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
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

        // Auto-geocode if coordinates are missing
        let validLat = formData.lat;
        let validLng = formData.lng;

        if ((!validLat || !validLng) && formData.adresse) {
            setIsGeocoding(true);
            try {
                const geoResult = await geocodeAddress(formData.adresse);
                if (geoResult) {
                    validLat = geoResult.lat;
                    validLng = geoResult.lng;
                    console.log(`[CreateTrip] Auto-geocoded '${formData.adresse}' to ${validLat}, ${validLng}`);
                }
            } catch (e) {
                console.error("[CreateTrip] Auto-geocoding failed:", e);
            } finally {
                setIsGeocoding(false);
            }
        }

        setIsCreating(true);
        const result = await createAusflug({
            ...formData,
            kosten_stufe: formData.kosten_stufe,
            lat: validLat || undefined,
            lng: validLng || undefined,
            nice_to_know: formData.nice_to_know.join(", "), // Join array to string
            kategorie_alt: formData.kategorie_alt.join(", "), // Join array to string
        });

        if (result.success && result.id) {
            const tripId = result.id;

            // Upload all selected images
            if (selectedImages.length > 0) {
                for (let i = 0; i < selectedImages.length; i++) {
                    const uri = selectedImages[i];
                    const isPrimary = i === 0; // First image is primary
                    const fileName = `trip_${tripId}_${Date.now()}_${i}.jpg`;

                    console.log(`[CreateTrip] Uploading image ${i + 1}/${selectedImages.length}`);
                    await uploadAusflugPhoto(tripId, uri, fileName, isPrimary);
                }
            }

            setIsCreating(false);
            router.replace(`/trip/${result.id}` as any);
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
                                    <View style={styles.checkboxContainer}>
                                        {KATEGORIE_OPTIONS.map((kat) => (
                                            <Pressable
                                                key={kat}
                                                onPress={() => {
                                                    const isSelected = formData.kategorie_alt.includes(kat);
                                                    setFormData({
                                                        ...formData,
                                                        kategorie_alt: isSelected
                                                            ? formData.kategorie_alt.filter(v => v !== kat)
                                                            : [...formData.kategorie_alt, kat]
                                                    });
                                                }}
                                                style={[styles.checkboxItem, { borderColor: colors.border }]}
                                            >
                                                <View style={[
                                                    styles.checkbox,
                                                    {
                                                        backgroundColor: formData.kategorie_alt.includes(kat) ? colors.primary : colors.surface,
                                                        borderColor: formData.kategorie_alt.includes(kat) ? colors.primary : colors.border,
                                                    }
                                                ]}>
                                                    {formData.kategorie_alt.includes(kat) && (
                                                        <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                                                    )}
                                                </View>
                                                <ThemedText style={styles.checkboxLabel}>{kat}</ThemedText>
                                            </Pressable>
                                        ))}
                                    </View>
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
                                <Pressable
                                    onPress={() => setJahreszeitenExpanded(!jahreszeitenExpanded)}
                                    style={[styles.collapsibleHeader, { borderColor: colors.border }]}
                                >
                                    <ThemedText style={styles.label}>Jahreszeiten</ThemedText>
                                    <IconSymbol
                                        name={jahreszeitenExpanded ? "chevron.up" : "chevron.down"}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                                {jahreszeitenExpanded && (
                                    <View style={styles.checkboxContainer}>
                                        {['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzes Jahr'].map((season) => (
                                            <Pressable
                                                key={season}
                                                onPress={() => {
                                                    const currentSeasons = formData.jahreszeiten ? formData.jahreszeiten.split(',').map(s => s.trim()) : [];
                                                    const isSelected = currentSeasons.includes(season);
                                                    let newSeasons: string[];

                                                    if (season === 'Ganzes Jahr') {
                                                        // If selecting 'Ganzes Jahr', clear others or just set it? 
                                                        // Use case: usually exclusive or inclusive. treating as just another tag is safest.
                                                        newSeasons = isSelected
                                                            ? currentSeasons.filter(s => s !== season)
                                                            : [...currentSeasons, season];
                                                    } else {
                                                        newSeasons = isSelected
                                                            ? currentSeasons.filter(s => s !== season)
                                                            : [...currentSeasons, season];
                                                    }

                                                    setFormData({ ...formData, jahreszeiten: newSeasons.join(', ') });
                                                }}
                                                style={[styles.checkboxItem, { borderColor: colors.border }]}
                                            >
                                                <View style={[
                                                    styles.checkbox,
                                                    {
                                                        backgroundColor: formData.jahreszeiten?.includes(season) ? colors.primary : colors.surface,
                                                        borderColor: formData.jahreszeiten?.includes(season) ? colors.primary : colors.border,
                                                    }
                                                ]}>
                                                    {formData.jahreszeiten?.includes(season) && (
                                                        <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                                                    )}
                                                </View>
                                                <ThemedText style={styles.checkboxLabel}>{season}</ThemedText>
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
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
                                    formData.kategorie_alt.length === 0 ? (
                                        <ThemedText style={[styles.label, { color: colors.textSecondary, fontStyle: 'italic', marginTop: 8 }]}>
                                            Bitte zuerst eine Kategorie auswählen
                                        </ThemedText>
                                    ) : niceToKnowOptions.length > 0 ? (
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
                                    ) : null
                                )}
                            </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                            {selectedImages.map((uri, index) => (
                                <View key={index} style={styles.imagePreviewWrapper}>
                                    <Image source={{ uri }} style={styles.imagePreview} contentFit="cover" />
                                    <Pressable
                                        style={styles.removeImageButton}
                                        onPress={() => removeImage(index)}
                                    >
                                        <IconSymbol name="xmark.circle.fill" size={24} color="#EF4444" />
                                    </Pressable>
                                </View>
                            ))}
                            <Pressable style={styles.addImageButton} onPress={handlePickImage}>
                                <IconSymbol name="plus" size={30} color={colors.textSecondary} />
                                <ThemedText style={{ color: colors.textSecondary, marginTop: 4 }}>Foto hinzufügen</ThemedText>
                            </Pressable>
                        </ScrollView>

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
    imageScroll: {
        marginBottom: Spacing.md,
    },
    imagePreviewWrapper: {
        width: 200,
        height: 150,
        marginRight: Spacing.md,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
    },
    addImageButton: {
        width: 150,
        height: 150,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderColor: '#E5E7EB', // Gray-200
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
    },
    imagePreviewContainer: {
        position: "relative",
        height: 200,
        borderRadius: BorderRadius.lg,
        overflow: "hidden",
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
