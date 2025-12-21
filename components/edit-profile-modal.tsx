import { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
    ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { IconSymbol } from "./ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

type EditProfileModalProps = {
    visible: boolean;
    onClose: () => void;
    currentEmail: string;
    currentPhotoUrl?: string | null;
    onSuccess: () => void;
};

export function EditProfileModal({
    visible,
    onClose,
    currentEmail,
    currentPhotoUrl,
    onSuccess,
}: EditProfileModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const [email, setEmail] = useState(currentEmail);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [photoUri, setPhotoUri] = useState<string | null>(currentPhotoUrl || null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert("Berechtigung erforderlich", "Bitte erlaube Zugriff auf deine Fotos");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!email.trim()) {
            Alert.alert("Fehler", "E-Mail darf nicht leer sein");
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            Alert.alert("Fehler", "Passwörter stimmen nicht überein");
            return;
        }

        if (newPassword && newPassword.length < 6) {
            Alert.alert("Fehler", "Passwort muss mindestens 6 Zeichen lang sein");
            return;
        }

        setIsLoading(true);

        try {
            // Update email if changed
            if (email !== currentEmail) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email,
                });

                if (emailError) {
                    throw new Error(`E-Mail Aktualisierung fehlgeschlagen: ${emailError.message}`);
                }
            }

            // Update password if provided
            if (newPassword) {
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: newPassword,
                });

                if (passwordError) {
                    throw new Error(`Passwort Aktualisierung fehlgeschlagen: ${passwordError.message}`);
                }
            }

            // TODO: Upload profile photo to storage
            // This requires setting up Supabase Storage bucket
            if (photoUri && photoUri !== currentPhotoUrl) {
                console.log("[EditProfile] Photo upload not yet implemented:", photoUri);
                // const { error: photoError } = await uploadProfilePhoto(photoUri);
                // if (photoError) throw photoError;
            }

            Alert.alert("Erfolg", "Profil wurde aktualisiert");
            onSuccess();
            onClose();
        } catch (error: any) {
            Alert.alert("Fehler", error.message || "Profil konnte nicht aktualisiert werden");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={onClose} disabled={isLoading}>
                        <ThemedText style={[styles.headerButton, { color: colors.textSecondary }]}>
                            Abbrechen
                        </ThemedText>
                    </Pressable>
                    <ThemedText style={styles.headerTitle}>Profil bearbeiten</ThemedText>
                    <Pressable onPress={handleSubmit} disabled={isLoading}>
                        <ThemedText style={[styles.headerButton, { color: colors.primary }]}>
                            {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : "Speichern"}
                        </ThemedText>
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Photo */}
                    <View style={styles.photoSection}>
                        <Pressable onPress={handlePickImage} disabled={isLoading}>
                            <View style={styles.photoContainer}>
                                {photoUri ? (
                                    <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
                                ) : (
                                    <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + "20" }]}>
                                        <IconSymbol name="person.fill" size={48} color={colors.primary} />
                                    </View>
                                )}
                                <View style={[styles.photoEditBadge, { backgroundColor: colors.primary }]}>
                                    <IconSymbol name="camera.fill" size={16} color="#FFFFFF" />
                                </View>
                            </View>
                        </Pressable>
                        <ThemedText style={[styles.photoHint, { color: colors.textSecondary }]}>
                            Tippe um ein Foto auszuwählen
                        </ThemedText>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>E-Mail Adresse</ThemedText>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="deine@email.com"
                            placeholderTextColor={colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Neues Passwort (optional)</ThemedText>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    styles.passwordInput,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="Min. 6 Zeichen"
                                placeholderTextColor={colors.textSecondary}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.passwordToggle}
                            >
                                <IconSymbol
                                    name={showPassword ? "eye.slash.fill" : "eye.fill"}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    {newPassword.length > 0 && (
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Passwort bestätigen</ThemedText>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="Passwort wiederholen"
                                placeholderTextColor={colors.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>
                    )}

                    {/* Info Note */}
                    <View style={[styles.infoBox, { backgroundColor: colors.primary + "10" }]}>
                        <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
                        <ThemedText style={[styles.infoText, { color: colors.text }]}>
                            Wenn du deine E-Mail änderst, musst du die neue Adresse bestätigen.
                        </ThemedText>
                    </View>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    headerButton: {
        fontSize: 16,
        fontWeight: "500",
        minWidth: 80,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
    },
    photoSection: {
        alignItems: "center",
        marginBottom: Spacing.xxl,
    },
    photoContainer: {
        position: "relative",
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
    },
    photoEditBadge: {
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FFFFFF",
    },
    photoHint: {
        fontSize: 14,
        marginTop: Spacing.sm,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: Spacing.sm,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: 16,
    },
    passwordContainer: {
        position: "relative",
    },
    passwordInput: {
        paddingRight: 48,
    },
    passwordToggle: {
        position: "absolute",
        right: Spacing.md,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        width: 40,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
