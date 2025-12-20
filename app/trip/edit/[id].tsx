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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    getAusflugById,
    updateAusflug,
    getAusflugPhotos,
    uploadAusflugPhoto,
    deleteAusflugPhoto,
    setPhotoPrimary,
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
    const [niceToKnow, setNiceToKnow] = useState("");

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
                setNiceToKnow(tripData.nice_to_know || "");
            }

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
            nice_to_know: niceToKnow,
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
                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Gut zu wissen</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            value={niceToKnow}
                            onChangeText={setNiceToKnow}
                            placeholder="Tipps und Hinweise"
                            placeholderTextColor={colors.textDisabled}
                            multiline
                            numberOfLines={3}
                        />
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
});
