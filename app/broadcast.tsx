import { Stack, useRouter } from "expo-router";
import { useState } from "react";
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

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { sendBroadcastNotification } from "@/lib/supabase-api";
import { useAdmin } from "@/contexts/admin-context";

export default function BroadcastNotificationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const { canEdit } = useAdmin();

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Redirect if not admin
    if (!canEdit) {
        router.back();
        return null;
    }

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            Alert.alert("Fehler", "Bitte Titel und Nachricht eingeben");
            return;
        }

        Alert.alert(
            "Bestätigung",
            `Push-Benachrichtigung an alle User senden?\n\nTitel: ${title}\nNachricht: ${body}`,
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Senden",
                    style: "destructive",
                    onPress: async () => {
                        setIsSending(true);
                        const result = await sendBroadcastNotification(title, body);
                        setIsSending(false);

                        if (result.success) {
                            Alert.alert(
                                "Erfolg",
                                `Benachrichtigung an ${result.sent} Geräte gesendet!`,
                                [{ text: "OK", onPress: () => router.back() }]
                            );
                        } else {
                            Alert.alert("Fehler", result.error || "Unbekannter Fehler");
                        }
                    },
                },
            ]
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Push-Benachrichtigung",
                    headerShown: true,
                }}
            />
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                >
                    {/* Info Banner */}
                    <View style={[styles.infoBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                        <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
                        <ThemedText style={[styles.infoText, { color: colors.primary }]}>
                            Diese Benachrichtigung wird an alle User gesendet, die Push-Benachrichtigungen aktiviert haben.
                        </ThemedText>
                    </View>

                    {/* Title Input */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Titel</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="z.B. Neue Ausflugsziele verfügbar"
                            placeholderTextColor={colors.textSecondary}
                            maxLength={100}
                        />
                        <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
                            {title.length}/100
                        </ThemedText>
                    </View>

                    {/* Body Input */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Nachricht</ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                            ]}
                            value={body}
                            onChangeText={setBody}
                            placeholder="Beschreibe die Benachrichtigung..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={6}
                            maxLength={500}
                            textAlignVertical="top"
                        />
                        <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
                            {body.length}/500
                        </ThemedText>
                    </View>

                    {/* Preview */}
                    {(title || body) && (
                        <View style={styles.previewGroup}>
                            <ThemedText style={styles.label}>Vorschau</ThemedText>
                            <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.previewHeader}>
                                    <IconSymbol name="app.badge.fill" size={32} color={colors.primary} />
                                    <View style={styles.previewTextContainer}>
                                        <ThemedText style={styles.previewApp}>AusflugFinder</ThemedText>
                                        <ThemedText style={[styles.previewTime, { color: colors.textSecondary }]}>jetzt</ThemedText>
                                    </View>
                                </View>
                                {title && <ThemedText style={styles.previewTitle}>{title}</ThemedText>}
                                {body && <ThemedText style={[styles.previewBody, { color: colors.textSecondary }]}>{body}</ThemedText>}
                            </View>
                        </View>
                    )}

                    {/* Send Button */}
                    <Pressable
                        onPress={handleSend}
                        disabled={isSending || !title.trim() || !body.trim()}
                        style={({ pressed }) => [
                            styles.sendButton,
                            {
                                backgroundColor: !title.trim() || !body.trim() ? colors.border : colors.primary,
                                opacity: pressed ? 0.8 : 1,
                            },
                        ]}
                    >
                        {isSending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
                                <ThemedText style={styles.sendButtonText}>An alle User senden</ThemedText>
                            </>
                        )}
                    </Pressable>
                </ScrollView>
            </ThemedView>
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
    infoBanner: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
    },
    inputGroup: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: Spacing.sm,
    },
    input: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: 16,
    },
    textArea: {
        minHeight: 120,
    },
    charCount: {
        fontSize: 12,
        marginTop: Spacing.xs,
        textAlign: "right",
    },
    previewGroup: {
        marginBottom: Spacing.xl,
    },
    previewCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    previewHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    previewTextContainer: {
        flex: 1,
    },
    previewApp: {
        fontSize: 14,
        fontWeight: "600",
    },
    previewTime: {
        fontSize: 12,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: Spacing.xs,
    },
    previewBody: {
        fontSize: 14,
        lineHeight: 20,
    },
    sendButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    sendButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
