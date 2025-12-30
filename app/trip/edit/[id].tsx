import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DismissKeyboard } from "@/components/DismissKeyboard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    getAusflugById,
    updateAusflug,
    getAusflugPhotos,
    uploadAusflugPhoto,
    deleteAusflugPhoto,
    setPhotoPrimary,
    getNiceToKnowOptions,
    getKategorieOptions,
    type Ausflug,
    type AusflugFoto,
} from "@/lib/supabase-api";
import { useAdmin } from "@/contexts/admin-context";

export default function EditTripScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const { canEdit } = useAdmin();

    const [trip, setTrip] = useState<Ausflug | null>(null);
    const [photos, setPhotos] = useState<AusflugFoto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [beschreibung, setBeschreibung] = useState("");
    const [adresse, setAdresse] = useState("");
    const [region, setRegion] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [parkplatz, setParkplatz] = useState(""); // Corrected from parkplatzInfos
    const [kostenStufe, setKostenStufe] = useState<number | null>(null);
    const [niceToKnow, setNiceToKnow] = useState<string[]>([]);
    const [kategorie, setKategorie] = useState<string[]>([]);
    const [niceToKnowOptions, setNiceToKnowOptions] = useState<{ category: string; options: string[] }[]>([]);
    const [kategorieOptions, setKategorieOptions] = useState<string[]>([]);
    const [kategorieExpanded, setKategorieExpanded] = useState(false);
    const [niceToKnowExpanded, setNiceToKnowExpanded] = useState(false);
    const [parkplatzAnzahl, setParkplatzAnzahl] = useState<'genuegend' | 'maessig' | 'keine' | null>(null);
    const [parkplatzKostenlos, setParkplatzKostenlos] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!id) return;
            setIsLoading(true);

            const tripData = await getAusflugById(Number(id));
            if (tripData) {
                setTrip(tripData);
                setName(tripData.name || "");
                setBeschreibung(tripData.beschreibung || "");
                setAdresse(tripData.adresse || "");
                setRegion(tripData.region || "");
                setWebsiteUrl(tripData.website_url || "");
                setParkplatz(tripData.parkplatz || ""); // Corrected
                setKostenStufe(tripData.kosten_stufe);
                setParkplatzAnzahl(tripData.parkplatz_anzahl || null);
                setParkplatzKostenlos(tripData.parkplatz_kostenlos || false);

                // Parse nice_to_know and kategorie_alt from comma-separated strings to arrays
                setNiceToKnow(tripData.nice_to_know ? tripData.nice_to_know.split(',').map(v => v.trim()) : []);
                setKategorie(tripData.kategorie_alt ? tripData.kategorie_alt.split(',').map(v => v.trim()) : []);
            }

            // Load options
            const niceToKnowOpts = await getNiceToKnowOptions();
            setNiceToKnowOptions(niceToKnowOpts);

            const kategorieOpts = await getKategorieOptions();
            setKategorieOptions(kategorieOpts);

            const photosData = await getAusflugPhotos(Number(id));
            setPhotos(photosData);

            setIsLoading(false);
        }
        loadData();
    }, [id]);

    const handleSave = async () => {
        if (!trip) return;

        setIsSaving(true);
        const result = await updateAusflug(trip.id, {
            name,
            beschreibung,
            adresse,
            region,
            website_url: websiteUrl,
            parkplatz: parkplatz, // Corrected
            kosten_stufe: kostenStufe,
            parkplatz_anzahl: parkplatzAnzahl,
            parkplatz_kostenlos: parkplatzKostenlos,
            nice_to_know: niceToKnow.join(", "),
            kategorie_alt: kategorie.join(", "),
        });
        setIsSaving(false);

        if (result.success) {
            Alert.alert("Gespeichert", "Die Änderungen wurden erfolgreich gespeichert.");
            router.back();
        } else {
            Alert.alert("Fehler", result.error || "Fehler beim Speichern.");
        }
    };

    const handleAddPhoto = async () => {
        if (!trip) return;

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
            const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
            const isPrimary = photos.length === 0; // First photo is primary

            console.log('[EditScreen] Uploading photo:', fileName, 'isPrimary:', isPrimary);

            setIsSaving(true);
            const uploadResult = await uploadAusflugPhoto(
                trip.id,
                asset.uri,
                fileName,
                isPrimary
            );
            setIsSaving(false);

            console.log('[EditScreen] Upload result:', uploadResult);

            if (uploadResult.success) {
                // Reload photos
                const photosData = await getAusflugPhotos(trip.id);
                console.log('[EditScreen] Loaded photos after upload:', photosData);
                setPhotos(photosData);
                Alert.alert("Hochgeladen", "Das Foto wurde erfolgreich hochgeladen.");
            } else {
                Alert.alert("Fehler", uploadResult.error || "Fehler beim Hochladen.");
            }
        }
    };

    const handleDeletePhoto = async (photoId: number) => {
        Alert.alert(
            "Foto löschen",
            "Möchtest du dieses Foto wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        const result = await deleteAusflugPhoto(photoId);
                        if (result.success) {
                            setPhotos(photos.filter(p => p.id !== photoId));
                        } else {
                            Alert.alert("Fehler", result.error || "Fehler beim Löschen.");
                        }
                    },
                },
            ]
        );
    };

    const handleSetPrimary = async (photoId: number) => {
        if (!trip) return;

        const result = await setPhotoPrimary(photoId, trip.id);
        if (result.success) {
            // Update local state
            setPhotos(photos.map(p => ({
                ...p,
                is_primary: p.id === photoId,
            })));
        }
    };

    if (!canEdit) {
        return (
            <ThemedView style={styles.errorContainer}>
                <ThemedText>Keine Berechtigung</ThemedText>
            </ThemedView>
        );
    }

    if (isLoading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </ThemedView>
        );
    }

    if (!trip) {
        return (
            <ThemedView style={styles.errorContainer}>
                <ThemedText>Ausflug nicht gefunden</ThemedText>
            </ThemedView>
        );
    }

    return (
        <DismissKeyboard>
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: "Ausflug bearbeiten",
                        headerBackTitle: "Zurück",
                    }}
                />
                <ScrollView
                    style={[styles.container, { backgroundColor: colors.background }]}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                >
                    {/* Photos Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <ThemedText style={styles.sectionTitle}>Fotos</ThemedText>
                            <Pressable
                                onPress={handleAddPhoto}
                                style={[styles.addButton, { backgroundColor: colors.primary }]}
                            >
                                <IconSymbol name="plus" size={20} color="#FFFFFF" />
                                <ThemedText style={styles.addButtonText}>Foto hinzufügen</ThemedText>
                            </Pressable>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.photosRow}>
                                {photos.map((photo) => (
                                    <View key={photo.id} style={styles.photoItem}>
                                        <Image
                                            source={{ uri: photo.full_url }}
                                            style={styles.photoImage}
                                            contentFit="cover"
                                        />
                                        {photo.is_primary && (
                                            <View style={[styles.primaryBadge, { backgroundColor: colors.primary }]}>
                                                <ThemedText style={styles.primaryBadgeText}>Titelbild</ThemedText>
                                            </View>
                                        )}
                                        <View style={styles.photoActions}>
                                            {!photo.is_primary && (
                                                <Pressable
                                                    onPress={() => handleSetPrimary(photo.id)}
                                                    style={[styles.photoAction, { backgroundColor: colors.surface }]}
                                                >
                                                    <IconSymbol name="star.fill" size={16} color={colors.primary} />
                                                </Pressable>
                                            )}
                                            <Pressable
                                                onPress={() => handleDeletePhoto(photo.id)}
                                                style={[styles.photoAction, { backgroundColor: "#EF4444" }]}
                                            >
                                                <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
                                            </Pressable>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Details</ThemedText>

                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Name *</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Name des Ausflugs"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Beschreibung</ThemedText>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={beschreibung}
                                onChangeText={setBeschreibung}
                                placeholder="Beschreibung des Ausflugs"
                                placeholderTextColor={colors.textDisabled}
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Adresse *</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={adresse}
                                onChangeText={setAdresse}
                                placeholder="Adresse"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Region</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={region}
                                onChangeText={setRegion}
                                placeholder="z.B. Bern, Zürich"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Parkplatz Infos</ThemedText>

                            {/* Parkplatz Anzahl Dropdown (Simulated with Pressables for now, or use a picker if available/preferred) */}
                            <View style={{ marginBottom: Spacing.sm }}>
                                <ThemedText style={[styles.label, { fontSize: 13, color: colors.textSecondary }]}>Anzahl Parkplätze</ThemedText>
                                <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
                                    {[
                                        { value: 'genuegend', label: 'Genügend' },
                                        { value: 'maessig', label: 'Mässig' },
                                        { value: 'keine', label: 'Keine' }
                                    ].map((option) => (
                                        <Pressable
                                            key={option.value}
                                            onPress={() => setParkplatzAnzahl(option.value as any)}
                                            style={[
                                                styles.costOption,
                                                {
                                                    backgroundColor: parkplatzAnzahl === option.value ? colors.primary + '20' : colors.surface,
                                                    borderColor: parkplatzAnzahl === option.value ? colors.primary : colors.border,
                                                    borderWidth: 1
                                                }
                                            ]}
                                        >
                                            <ThemedText style={{ color: parkplatzAnzahl === option.value ? colors.primary : colors.text }}>
                                                {option.label}
                                            </ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Parkplatz Kostenlos Checkbox */}
                            <Pressable
                                onPress={() => setParkplatzKostenlos(!parkplatzKostenlos)}
                                style={[styles.checkboxItem, { marginBottom: Spacing.sm, borderColor: colors.border, backgroundColor: colors.surface }]}
                            >
                                <View style={[
                                    styles.checkbox,
                                    {
                                        backgroundColor: parkplatzKostenlos ? colors.primary : colors.surface,
                                        borderColor: parkplatzKostenlos ? colors.primary : colors.border,
                                    }
                                ]}>
                                    {parkplatzKostenlos && (
                                        <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                                    )}
                                </View>
                                <ThemedText style={styles.checkboxLabel}>Gratis Parkplatz</ThemedText>
                            </Pressable>

                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={parkplatz}
                                onChangeText={setParkplatz}
                                placeholder="Zusätzliche Infos zum Parken..."
                                placeholderTextColor={colors.textDisabled}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Preis-Niveau</ThemedText>
                            <View style={styles.costContainer}>
                                {[0, 1, 2, 3, 4].map((level) => (
                                    <Pressable
                                        key={level}
                                        onPress={() => setKostenStufe(level)}
                                        style={[
                                            styles.costOption,
                                            {
                                                backgroundColor: kostenStufe === level ? CostColors[level] + "20" : colors.surface,
                                                borderWidth: kostenStufe === level ? 2 : 1,
                                                borderColor: kostenStufe === level ? CostColors[level] : colors.border
                                            }
                                        ]}
                                    >
                                        <ThemedText style={[
                                            styles.costOptionText,
                                            { color: kostenStufe === level ? CostColors[level] : colors.textSecondary }
                                        ]}>
                                            {level === 0 ? "Kostenlos" : "CHF " + "🪙".repeat(level)}
                                        </ThemedText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Website</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={websiteUrl}
                                onChangeText={setWebsiteUrl}
                                placeholder="https://..."
                                placeholderTextColor={colors.textDisabled}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.field}>
                            <Pressable
                                onPress={() => setKategorieExpanded(!kategorieExpanded)}
                                style={[styles.collapsibleHeader, { borderColor: colors.border }]}
                            >
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Kategorie</ThemedText>
                                <IconSymbol
                                    name={kategorieExpanded ? "chevron.up" : "chevron.down"}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                            {kategorieExpanded && (kategorieOptions && kategorieOptions.length > 0 ? (
                                <View style={styles.checkboxContainer}>
                                    {kategorieOptions.map((kat) => (
                                        <Pressable
                                            key={kat}
                                            onPress={() => {
                                                const isSelected = kategorie.includes(kat);
                                                setKategorie(isSelected
                                                    ? kategorie.filter(v => v !== kat)
                                                    : [...kategorie, kat]
                                                );
                                            }}
                                            style={[styles.checkboxItem, { borderColor: colors.border }]}
                                        >
                                            <View style={[
                                                styles.checkbox,
                                                {
                                                    backgroundColor: kategorie.includes(kat) ? colors.primary : colors.surface,
                                                    borderColor: kategorie.includes(kat) ? colors.primary : colors.border,
                                                }
                                            ]}>
                                                {kategorie.includes(kat) && (
                                                    <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                                                )}
                                            </View>
                                            <ThemedText style={styles.checkboxLabel}>{kat}</ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            ) : (
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Keine Kategorien verfügbar
                                </ThemedText>
                            ))}
                        </View>

                        <View style={styles.field}>
                            <Pressable
                                onPress={() => setNiceToKnowExpanded(!niceToKnowExpanded)}
                                style={[styles.collapsibleHeader, { borderColor: colors.border }]}
                            >
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Gut zu wissen</ThemedText>
                                <IconSymbol
                                    name={niceToKnowExpanded ? "chevron.up" : "chevron.down"}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                            {niceToKnowExpanded && (niceToKnowOptions && niceToKnowOptions.length > 0 ? (
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
                                                            const isSelected = niceToKnow.includes(option);
                                                            setNiceToKnow(isSelected
                                                                ? niceToKnow.filter(v => v !== option)
                                                                : [...niceToKnow, option]
                                                            );
                                                        }}
                                                        style={[styles.checkboxItem, { borderColor: colors.border }]}
                                                    >
                                                        <View style={[
                                                            styles.checkbox,
                                                            {
                                                                backgroundColor: niceToKnow.includes(option) ? colors.primary : colors.surface,
                                                                borderColor: niceToKnow.includes(option) ? colors.primary : colors.border,
                                                            }
                                                        ]}>
                                                            {niceToKnow.includes(option) && (
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
                            ))}
                        </View>

                    </View>
                </ScrollView>

                {/* Save Button */}
                <View style={[styles.saveContainer, { backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.md }]}>
                    <Pressable
                        onPress={handleSave}
                        disabled={isSaving}
                        style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 }]}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                                <ThemedText style={styles.saveButtonText}>Speichern</ThemedText>
                            </>
                        )}
                    </Pressable>
                </View>
            </>
        </DismissKeyboard>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    section: {
        padding: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontWeight: "500",
    },
    photosRow: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    photoItem: {
        position: "relative",
        width: 160,
        height: 120,
        borderRadius: BorderRadius.md,
        overflow: "hidden",
    },
    photoImage: {
        width: "100%",
        height: "100%",
    },
    primaryBadge: {
        position: "absolute",
        top: Spacing.xs,
        left: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    primaryBadgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "600",
    },
    photoActions: {
        position: "absolute",
        bottom: Spacing.xs,
        right: Spacing.xs,
        flexDirection: "row",
        gap: Spacing.xs,
    },
    photoAction: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    field: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 14,
        marginBottom: Spacing.xs,
    },
    input: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
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
    saveContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.1)",
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    costContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    costOption: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    costOptionText: {
        fontSize: 14,
        fontWeight: "500",
    },
});
