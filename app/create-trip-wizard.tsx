import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
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
    Animated,
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
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { useLanguage } from "@/contexts/language-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

const TOTAL_STEPS = 5;

export default function CreateTripWizardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const { isAdmin } = useAdmin();
    const { user, isAuthenticated } = useSupabaseAuth();
    const { t } = useLanguage();

    const [currentStep, setCurrentStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

    // Expandable sections
    const [kategorieExpanded, setKategorieExpanded] = useState(true);
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
        is_indoor: false,
        is_outdoor: false,
        is_rundtour: false,
        is_von_a_nach_b: false,
        // Admin-only fields
        popup_title: "",
        popup_message: "",
        popup_level: "deaktiviert" as "info" | "warnung" | "wichtig" | "deaktiviert",
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

    // Animate progress bar
    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: currentStep / TOTAL_STEPS,
            useNativeDriver: false,
            tension: 50,
            friction: 10,
        }).start();
    }, [currentStep]);

    // Redirect if not authenticated
    if (!isAuthenticated) {
        router.replace('/(tabs)' as any);
        return null;
    }

    const handleGeocode = async () => {
        if (!formData.adresse.trim()) return;
        if (formData.lat && formData.lng) return;

        setIsGeocoding(true);
        const result = await geocodeAddress(formData.adresse);
        setIsGeocoding(false);

        if (result) {
            setFormData(prev => ({ ...prev, lat: result.lat, lng: result.lng }));
        }
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert(t.permissionRequired, t.pleaseAllowPhotoAccess);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            allowsMultipleSelection: true,
            selectionLimit: 0,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            setSelectedImages(prev => [...prev, ...result.assets.map(asset => asset.uri)]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!formData.name.trim()) {
                    Alert.alert(t.error, t.pleaseEnterName);
                    return false;
                }
                if (formData.kategorie_alt.length === 0) {
                    Alert.alert(t.error, 'Bitte wähle mindestens eine Kategorie aus.');
                    return false;
                }
                if (!formData.is_indoor && !formData.is_outdoor) {
                    Alert.alert(t.error, 'Bitte wähle Indoor, Outdoor oder beides aus.');
                    return false;
                }
                return true;
            case 2:
                if (!formData.adresse.trim()) {
                    Alert.alert(t.error, t.pleaseEnterAddress);
                    return false;
                }
                if (!formData.land.trim()) {
                    Alert.alert(t.error, 'Bitte gib ein Land ein.');
                    return false;
                }
                if (!formData.region.trim()) {
                    Alert.alert(t.error, 'Bitte gib eine Region ein.');
                    return false;
                }
                if (!formData.beschreibung.trim()) {
                    Alert.alert(t.error, 'Bitte gib eine Beschreibung ein.');
                    return false;
                }
                return true;
            case 3:
                return true;
            case 4:
                if (selectedImages.length === 0) {
                    Alert.alert(t.error, 'Bitte füge mindestens ein Foto hinzu.');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const goNext = async () => {
        if (!validateStep(currentStep)) return;

        // Auto-geocode when leaving step 2
        if (currentStep === 2 && !formData.lat && !formData.lng && formData.adresse.trim()) {
            await handleGeocode();
        }

        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        } else {
            router.back();
        }
    };

    const handleCreate = async () => {
        setIsCreating(true);

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
                }
            } catch (e) {
                console.error("[Wizard] Auto-geocoding failed:", e);
            } finally {
                setIsGeocoding(false);
            }
        }

        // Strip is_outdoor (UI-only, not in DB) before sending
        const { is_outdoor, ...dbFormData } = formData;
        const result = await createAusflug({
            ...dbFormData,
            kosten_stufe: formData.kosten_stufe,
            lat: validLat || undefined,
            lng: validLng || undefined,
            nice_to_know: formData.nice_to_know.join(", "),
            kategorie_alt: formData.kategorie_alt.join(", "),
            // Only send popup fields for admins
            ...(isAdmin ? {
                popup_title: formData.popup_title || undefined,
                popup_message: formData.popup_message || undefined,
                popup_level: formData.popup_level !== "deaktiviert" ? formData.popup_level : undefined,
            } : {}),
        } as any);

        if (result.success && result.id) {
            const tripId = result.id;

            // Upload all selected images
            if (selectedImages.length > 0) {
                for (let i = 0; i < selectedImages.length; i++) {
                    const uri = selectedImages[i];
                    const isPrimary = i === 0;
                    const fileName = `trip_${tripId}_${Date.now()}_${i}.jpg`;
                    await uploadAusflugPhoto(tripId, uri, fileName, isPrimary);
                }
            }

            setIsCreating(false);
            router.replace(`/trip/${result.id}` as any);
        } else {
            setIsCreating(false);
            Alert.alert(t.error, result.error || t.errorOccurred);
        }
    };

    // =============================================
    // STEP RENDERERS
    // =============================================

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <ThemedText style={styles.stepEmoji}>📝</ThemedText>
                <ThemedText style={styles.stepTitle}>{t.wizardStep1Title}</ThemedText>
                <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                    {t.wizardStep1Desc}
                </ThemedText>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.tripName} *</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="z.B. Rheinfall Schaffhausen"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            {/* Kategorie */}
            <View style={styles.inputGroup}>
                <Pressable
                    onPress={() => setKategorieExpanded(!kategorieExpanded)}
                    style={[styles.collapsibleHeader, { borderColor: colors.border }]}
                >
                    <ThemedText style={styles.label}>{t.category} *</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {formData.kategorie_alt.length > 0 && (
                            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                <ThemedText style={styles.badgeText}>{formData.kategorie_alt.length}</ThemedText>
                            </View>
                        )}
                        <IconSymbol
                            name={kategorieExpanded ? "chevron.up" : "chevron.down"}
                            size={20}
                            color={colors.textSecondary}
                        />
                    </View>
                </Pressable>
                {kategorieExpanded && (
                    <View style={styles.chipContainer}>
                        {KATEGORIE_OPTIONS.map((kat) => {
                            const isSelected = formData.kategorie_alt.includes(kat);
                            return (
                                <Pressable
                                    key={kat}
                                    onPress={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            kategorie_alt: isSelected
                                                ? prev.kategorie_alt.filter(v => v !== kat)
                                                : [...prev.kategorie_alt, kat]
                                        }));
                                    }}
                                    style={[styles.chip, {
                                        backgroundColor: isSelected ? colors.primary : colors.surface,
                                        borderColor: isSelected ? colors.primary : colors.border,
                                    }]}
                                >
                                    <ThemedText style={[styles.chipText, { color: isSelected ? "#FFFFFF" : colors.text }]}>
                                        {kat}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Indoor/Outdoor */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Indoor / Outdoor *</ThemedText>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <Pressable
                        onPress={() => setFormData(prev => ({ ...prev, is_outdoor: !prev.is_outdoor }))}
                        style={[styles.toggleButton, {
                            borderColor: formData.is_outdoor ? colors.primary : colors.border,
                            backgroundColor: formData.is_outdoor ? colors.primary + '15' : colors.surface,
                        }]}
                    >
                        <ThemedText style={[styles.toggleText, { color: formData.is_outdoor ? colors.primary : colors.text }]}>
                            🌳 Outdoor
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={() => setFormData(prev => ({ ...prev, is_indoor: !prev.is_indoor }))}
                        style={[styles.toggleButton, {
                            borderColor: formData.is_indoor ? colors.primary : colors.border,
                            backgroundColor: formData.is_indoor ? colors.primary + '15' : colors.surface,
                        }]}
                    >
                        <ThemedText style={[styles.toggleText, { color: formData.is_indoor ? colors.primary : colors.text }]}>
                            🏠 Indoor
                        </ThemedText>
                    </Pressable>
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <ThemedText style={styles.stepEmoji}>📍</ThemedText>
                <ThemedText style={styles.stepTitle}>{t.wizardStep2Title}</ThemedText>
                <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                    {t.wizardStep2Desc}
                </ThemedText>
            </View>

            {/* Adresse */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.address} *</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.adresse}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, adresse: text }))}
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

            {/* Land */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.country} *</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.land}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, land: text }))}
                    placeholder="z.B. Schweiz"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            {/* Region */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.region} *</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.region}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, region: text }))}
                    placeholder="z.B. Schaffhausen"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            {/* Beschreibung */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.tripDescription} *</ThemedText>
                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.beschreibung}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, beschreibung: text }))}
                    placeholder="Beschreibe den Ausflug..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <ThemedText style={styles.stepEmoji}>⚙️</ThemedText>
                <ThemedText style={styles.stepTitle}>{t.wizardStep3Title}</ThemedText>
                <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                    {t.wizardStep3Desc}
                </ThemedText>
            </View>

            {/* Kosten-Stufe */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.costLevel}: {formData.kosten_stufe}</ThemedText>
                <View style={styles.costButtons}>
                    {[0, 1, 2, 3, 4].map((level) => (
                        <Pressable
                            key={level}
                            onPress={() => setFormData(prev => ({ ...prev, kosten_stufe: level }))}
                            style={[styles.costButton, {
                                backgroundColor: formData.kosten_stufe === level ? colors.primary : colors.surface,
                                borderColor: colors.border,
                            }]}
                        >
                            <ThemedText style={[styles.costButtonText, { color: formData.kosten_stufe === level ? "#FFFFFF" : colors.text }]}>
                                {level === 0 ? "🆓" : "🪙".repeat(level)}
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Jahreszeiten */}
            <View style={styles.inputGroup}>
                <Pressable
                    onPress={() => setJahreszeitenExpanded(!jahreszeitenExpanded)}
                    style={[styles.collapsibleHeader, { borderColor: colors.border }]}
                >
                    <ThemedText style={styles.label}>{t.seasons}</ThemedText>
                    <IconSymbol
                        name={jahreszeitenExpanded ? "chevron.up" : "chevron.down"}
                        size={20}
                        color={colors.textSecondary}
                    />
                </Pressable>
                {jahreszeitenExpanded && (
                    <View style={styles.chipContainer}>
                        {[
                            { label: `🌸 ${t.spring}`, value: 'Frühling' },
                            { label: `☀️ ${t.summer}`, value: 'Sommer' },
                            { label: `🍂 ${t.autumn}`, value: 'Herbst' },
                            { label: `❄️ ${t.winter}`, value: 'Winter' },
                            { label: '📅 Ganzes Jahr', value: 'Ganzes Jahr' },
                        ].map(({ label, value }) => {
                            const currentSeasons = formData.jahreszeiten ? formData.jahreszeiten.split(',').map(s => s.trim()) : [];
                            const isSelected = currentSeasons.includes(value);
                            return (
                                <Pressable
                                    key={value}
                                    onPress={() => {
                                        const newSeasons = isSelected
                                            ? currentSeasons.filter(s => s !== value)
                                            : [...currentSeasons, value];
                                        setFormData(prev => ({ ...prev, jahreszeiten: newSeasons.join(', ') }));
                                    }}
                                    style={[styles.chip, {
                                        backgroundColor: isSelected ? colors.primary : colors.surface,
                                        borderColor: isSelected ? colors.primary : colors.border,
                                    }]}
                                >
                                    <ThemedText style={[styles.chipText, { color: isSelected ? "#FFFFFF" : colors.text }]}>
                                        {label}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Altersempfehlung */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.ageRecommendation}</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.altersempfehlung}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, altersempfehlung: text }))}
                    placeholder="z.B. Ab 6 Jahren"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            {/* Nice to Know */}
            <View style={styles.inputGroup}>
                <Pressable
                    onPress={() => setNiceToKnowExpanded(!niceToKnowExpanded)}
                    style={[styles.collapsibleHeader, { borderColor: colors.border }]}
                >
                    <ThemedText style={styles.label}>{t.goodToKnow}</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {formData.nice_to_know.length > 0 && (
                            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                <ThemedText style={styles.badgeText}>{formData.nice_to_know.length}</ThemedText>
                            </View>
                        )}
                        <IconSymbol
                            name={niceToKnowExpanded ? "chevron.up" : "chevron.down"}
                            size={20}
                            color={colors.textSecondary}
                        />
                    </View>
                </Pressable>
                {niceToKnowExpanded && (
                    formData.kategorie_alt.length === 0 ? (
                        <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
                            Bitte zuerst eine Kategorie auswählen (Schritt 1)
                        </ThemedText>
                    ) : niceToKnowOptions.length > 0 ? (
                        <View style={{ gap: 12, marginTop: 8 }}>
                            {niceToKnowOptions.map(({ category, options }) => (
                                <View key={category}>
                                    <ThemedText style={[styles.subCategoryTitle, { color: colors.textSecondary }]}>
                                        {category}
                                    </ThemedText>
                                    <View style={styles.chipContainer}>
                                        {options.map((option) => {
                                            const isSelected = formData.nice_to_know.includes(option);
                                            return (
                                                <Pressable
                                                    key={option}
                                                    onPress={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            nice_to_know: isSelected
                                                                ? prev.nice_to_know.filter(v => v !== option)
                                                                : [...prev.nice_to_know, option]
                                                        }));
                                                    }}
                                                    style={[styles.chip, {
                                                        backgroundColor: isSelected ? colors.primary : colors.surface,
                                                        borderColor: isSelected ? colors.primary : colors.border,
                                                    }]}
                                                >
                                                    <ThemedText style={[styles.chipText, { color: isSelected ? "#FFFFFF" : colors.text }]}>
                                                        {option}
                                                    </ThemedText>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : null
                )}
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <ThemedText style={styles.stepEmoji}>📸</ThemedText>
                <ThemedText style={styles.stepTitle}>{t.wizardStep4Title}</ThemedText>
                <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                    {t.wizardStep4Desc}
                </ThemedText>
            </View>

            {/* Website */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.websiteUrl}</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.website_url}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, website_url: text }))}
                    placeholder="https://..."
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="url"
                    autoCapitalize="none"
                />
            </View>

            {/* Parkplatz */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t.parkingLocation}</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.parkplatz}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, parkplatz: text }))}
                    placeholder="Parkplatz-Infos"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            {/* Streckentyp - conditional */}
            {(formData.kategorie_alt.includes('Abenteuerweg') ||
                formData.kategorie_alt.includes('Schnitzeljagd') ||
                formData.kategorie_alt.includes('Wandern')) && (
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Streckentyp</ThemedText>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                            <Pressable
                                onPress={() => setFormData(prev => ({ ...prev, is_rundtour: true, is_von_a_nach_b: false }))}
                                style={[styles.toggleButton, {
                                    borderColor: formData.is_rundtour ? colors.primary : colors.border,
                                    backgroundColor: formData.is_rundtour ? colors.primary + '15' : colors.surface,
                                }]}
                            >
                                <ThemedText style={[styles.toggleText, { color: formData.is_rundtour ? colors.primary : colors.text }]}>
                                    🔄 Rundtour
                                </ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={() => setFormData(prev => ({ ...prev, is_rundtour: false, is_von_a_nach_b: true }))}
                                style={[styles.toggleButton, {
                                    borderColor: formData.is_von_a_nach_b ? colors.primary : colors.border,
                                    backgroundColor: formData.is_von_a_nach_b ? colors.primary + '15' : colors.surface,
                                }]}
                            >
                                <ThemedText style={[styles.toggleText, { color: formData.is_von_a_nach_b ? colors.primary : colors.text }]}>
                                    ➡️ Von A nach B
                                </ThemedText>
                            </Pressable>
                        </View>
                    </View>
                )}

            {/* Fotos */}
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Fotos *</ThemedText>
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
                            {index === 0 && (
                                <View style={[styles.primaryBadge, { backgroundColor: colors.primary }]}>
                                    <ThemedText style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>Hauptbild</ThemedText>
                                </View>
                            )}
                        </View>
                    ))}
                    <Pressable
                        style={[styles.addImageButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                        onPress={handlePickImage}
                    >
                        <IconSymbol name="plus" size={30} color={colors.textSecondary} />
                        <ThemedText style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>
                            {t.chooseImage}
                        </ThemedText>
                    </Pressable>
                </ScrollView>
            </View>

            {/* Admin-only: Popup-Hinweis */}
            {isAdmin && (
                <View style={[styles.inputGroup, styles.adminSection]}>
                    <ThemedText style={[styles.label, { color: '#F59E0B' }]}>⚡ Popup-Hinweis (Admin)</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        {(['deaktiviert', 'info', 'warnung', 'wichtig'] as const).map((level) => (
                            <Pressable
                                key={level}
                                onPress={() => setFormData(prev => ({ ...prev, popup_level: level }))}
                                style={[styles.chip, {
                                    borderColor: formData.popup_level === level
                                        ? (level === 'info' ? '#3B82F6' : level === 'warnung' ? '#F59E0B' : level === 'wichtig' ? '#EF4444' : colors.primary)
                                        : colors.border,
                                    backgroundColor: formData.popup_level === level
                                        ? (level === 'info' ? '#3B82F615' : level === 'warnung' ? '#F59E0B15' : level === 'wichtig' ? '#EF444415' : colors.surface)
                                        : colors.surface,
                                }]}
                            >
                                <ThemedText style={[styles.chipText, {
                                    color: formData.popup_level === level
                                        ? (level === 'info' ? '#3B82F6' : level === 'warnung' ? '#F59E0B' : level === 'wichtig' ? '#EF4444' : colors.text)
                                        : colors.text
                                }]}>
                                    {level === 'deaktiviert' ? '⛔ Aus' : level === 'info' ? 'ℹ️ Info' : level === 'warnung' ? '⚠️ Warnung' : '🚨 Wichtig'}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                    {formData.popup_level !== 'deaktiviert' && (
                        <>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, marginTop: 8 }]}
                                value={formData.popup_title}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, popup_title: text }))}
                                placeholder="Popup Titel"
                                placeholderTextColor={colors.textDisabled}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, marginTop: 8, minHeight: 80, textAlignVertical: 'top' }]}
                                value={formData.popup_message}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, popup_message: text }))}
                                placeholder="Popup Nachricht"
                                placeholderTextColor={colors.textDisabled}
                                multiline
                                numberOfLines={3}
                            />
                        </>
                    )}
                </View>
            )}
        </View>
    );

    const renderStep5 = () => {
        const getCostLabel = (level: number) => {
            const labels = [t.costFree, t.costCheap, t.costMedium, t.costExpensive, t.costVeryExpensive];
            return labels[level] || `${level}`;
        };

        return (
            <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                    <ThemedText style={styles.stepEmoji}>✅</ThemedText>
                    <ThemedText style={styles.stepTitle}>{t.wizardStep5Title}</ThemedText>
                    <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                        {t.wizardStep5Desc}
                    </ThemedText>
                </View>

                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {/* Name */}
                    <View style={styles.summaryRow}>
                        <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.tripName}</ThemedText>
                        <ThemedText style={styles.summaryValue}>{formData.name}</ThemedText>
                    </View>

                    {/* Kategorie */}
                    {formData.kategorie_alt.length > 0 && (
                        <View style={styles.summaryRow}>
                            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.category}</ThemedText>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                                {formData.kategorie_alt.map(k => (
                                    <View key={k} style={[styles.summaryChip, { backgroundColor: colors.primary + '20' }]}>
                                        <ThemedText style={{ fontSize: 12, color: colors.primary }}>{k}</ThemedText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Indoor/Outdoor */}
                    <View style={styles.summaryRow}>
                        <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Typ</ThemedText>
                        <ThemedText style={styles.summaryValue}>
                            {[formData.is_outdoor && '🌳 Outdoor', formData.is_indoor && '🏠 Indoor'].filter(Boolean).join(' + ') || '—'}
                        </ThemedText>
                    </View>

                    {/* Adresse */}
                    <View style={styles.summaryRow}>
                        <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.address}</ThemedText>
                        <ThemedText style={styles.summaryValue}>{formData.adresse}</ThemedText>
                    </View>

                    {/* Region */}
                    {formData.region ? (
                        <View style={styles.summaryRow}>
                            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.region}</ThemedText>
                            <ThemedText style={styles.summaryValue}>{formData.region}</ThemedText>
                        </View>
                    ) : null}

                    {/* Kosten */}
                    <View style={styles.summaryRow}>
                        <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.costLevel}</ThemedText>
                        <ThemedText style={styles.summaryValue}>{getCostLabel(formData.kosten_stufe)}</ThemedText>
                    </View>

                    {/* Beschreibung */}
                    {formData.beschreibung ? (
                        <View style={styles.summaryRow}>
                            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.tripDescription}</ThemedText>
                            <ThemedText style={[styles.summaryValue, { fontSize: 13 }]} numberOfLines={3}>
                                {formData.beschreibung}
                            </ThemedText>
                        </View>
                    ) : null}

                    {/* Fotos */}
                    {selectedImages.length > 0 && (
                        <View style={styles.summaryRow}>
                            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Fotos</ThemedText>
                            <ThemedText style={styles.summaryValue}>{selectedImages.length} Bild{selectedImages.length > 1 ? 'er' : ''}</ThemedText>
                        </View>
                    )}

                    {/* Website */}
                    {formData.website_url ? (
                        <View style={styles.summaryRow}>
                            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.website}</ThemedText>
                            <ThemedText style={[styles.summaryValue, { fontSize: 13 }]} numberOfLines={1}>{formData.website_url}</ThemedText>
                        </View>
                    ) : null}
                </View>

                {/* Image previews */}
                {selectedImages.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                        {selectedImages.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.summaryImage} contentFit="cover" />
                        ))}
                    </ScrollView>
                )}
            </View>
        );
    };

    // =============================================
    // MAIN RENDER
    // =============================================

    const stepLabels = [
        t.wizardStep1Short,
        t.wizardStep2Short,
        t.wizardStep3Short,
        t.wizardStep4Short,
        t.wizardStep5Short,
    ];

    return (
        <>
            <Stack.Screen
                options={{
                    title: t.wizardTitle,
                    headerShown: true,
                    headerBackTitle: t.back,
                }}
            />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                            <Animated.View style={[styles.progressFill, {
                                backgroundColor: colors.primary,
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            }]} />
                        </View>
                        <View style={styles.stepIndicators}>
                            {stepLabels.map((label, index) => (
                                <View key={index} style={styles.stepIndicator}>
                                    <View style={[styles.stepDot, {
                                        backgroundColor: index + 1 <= currentStep ? colors.primary : colors.border,
                                    }]}>
                                        {index + 1 < currentStep ? (
                                            <IconSymbol name="checkmark" size={10} color="#FFFFFF" />
                                        ) : (
                                            <ThemedText style={[styles.stepDotText, {
                                                color: index + 1 <= currentStep ? '#FFFFFF' : colors.textSecondary
                                            }]}>
                                                {index + 1}
                                            </ThemedText>
                                        )}
                                    </View>
                                    <ThemedText style={[styles.stepLabel, {
                                        color: index + 1 === currentStep ? colors.primary : colors.textSecondary,
                                        fontWeight: index + 1 === currentStep ? '600' : '400',
                                    }]}>
                                        {label}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Step Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
                        showsVerticalScrollIndicator={false}
                    >
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                        {currentStep === 4 && renderStep4()}
                        {currentStep === 5 && renderStep5()}
                    </ScrollView>

                    {/* Bottom Navigation */}
                    <View style={[styles.bottomBar, {
                        backgroundColor: colors.background,
                        borderTopColor: colors.border,
                        paddingBottom: insets.bottom + 8,
                    }]}>
                        <Pressable
                            onPress={goBack}
                            style={({ pressed }) => [styles.navButton, styles.backButton, {
                                borderColor: colors.border,
                                opacity: pressed ? 0.7 : 1,
                            }]}
                        >
                            <IconSymbol name="chevron.left" size={18} color={colors.text} />
                            <ThemedText style={[styles.navButtonText, { color: colors.text }]}>{t.back}</ThemedText>
                        </Pressable>

                        {currentStep < TOTAL_STEPS ? (
                            <Pressable
                                onPress={goNext}
                                style={({ pressed }) => [styles.navButton, styles.nextButton, {
                                    backgroundColor: colors.primary,
                                    opacity: pressed ? 0.8 : 1,
                                }]}
                            >
                                <ThemedText style={styles.nextButtonText}>{t.wizardNextButton}</ThemedText>
                                <IconSymbol name="chevron.right" size={18} color="#FFFFFF" />
                            </Pressable>
                        ) : (
                            <Pressable
                                onPress={handleCreate}
                                disabled={isCreating}
                                style={({ pressed }) => [styles.navButton, styles.submitButton, {
                                    backgroundColor: colors.primary,
                                    opacity: pressed || isCreating ? 0.7 : 1,
                                }]}
                            >
                                {isCreating ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <>
                                        <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                                        <ThemedText style={styles.nextButtonText}>{t.wizardSubmitButton}</ThemedText>
                                    </>
                                )}
                            </Pressable>
                        )}
                    </View>
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
    // Progress Bar
    progressContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    stepIndicators: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    stepIndicator: {
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepDotText: {
        fontSize: 11,
        fontWeight: '600',
    },
    stepLabel: {
        fontSize: 10,
        marginTop: 2,
        textAlign: 'center',
    },
    // Step Content
    stepContainer: {
        gap: Spacing.md,
    },
    stepHeader: {
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    stepEmoji: {
        fontSize: 40,
        marginBottom: Spacing.xs,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
    // Form Elements
    inputGroup: {
        marginBottom: Spacing.sm,
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
        minHeight: 100,
    },
    collapsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    badge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
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
        fontSize: 14,
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
    hintText: {
        fontStyle: 'italic',
        marginTop: 8,
        fontSize: 13,
    },
    subCategoryTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    // Images
    imageScroll: {
        marginTop: 8,
    },
    imagePreviewWrapper: {
        position: "relative",
        marginRight: 12,
    },
    imagePreview: {
        width: 120,
        height: 90,
        borderRadius: BorderRadius.md,
    },
    removeImageButton: {
        position: "absolute",
        top: -6,
        right: -6,
    },
    primaryBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    addImageButton: {
        width: 120,
        height: 90,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
    },
    adminSection: {
        borderTopWidth: 1,
        borderTopColor: '#F59E0B30',
        paddingTop: Spacing.md,
        marginTop: Spacing.md,
    },
    // Summary
    summaryCard: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.lg,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '500',
        width: 90,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    summaryChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    summaryImage: {
        width: 80,
        height: 60,
        borderRadius: 8,
        marginRight: 8,
    },
    // Bottom Navigation
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        gap: Spacing.md,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: 14,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
    },
    backButton: {
        borderWidth: 1,
        flex: 1,
    },
    nextButton: {
        flex: 2,
    },
    submitButton: {
        flex: 2,
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
