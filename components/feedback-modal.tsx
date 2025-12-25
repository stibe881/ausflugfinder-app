import { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View,
    ActivityIndicator,
    Linking,
} from "react-native";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type FeedbackModalProps = {
    visible: boolean;
    onClose: () => void;
};

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) {
            Alert.alert("Fehler", "Bitte fülle alle Felder aus.");
            return;
        }

        setIsSubmitting(true);

        // Create mailto link
        const emailSubject = encodeURIComponent(`Feedback: ${subject}`);
        const emailBody = encodeURIComponent(message);
        const mailtoUrl = `mailto:info@ausflugfinder.ch?subject=${emailSubject}&body=${emailBody}`;

        try {
            const supported = await Linking.canOpenURL(mailtoUrl);
            if (supported) {
                await Linking.openURL(mailtoUrl);
                Alert.alert(
                    "Danke!",
                    "Deine E-Mail-App wurde geöffnet. Bitte sende die E-Mail ab.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                setSubject("");
                                setMessage("");
                                onClose();
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    "Fehler",
                    "Es konnte keine E-Mail-App gefunden werden. Bitte sende dein Feedback manuell an info@ausflugfinder.ch"
                );
            }
        } catch (error) {
            Alert.alert("Fehler", "Feedback konnte nicht gesendet werden.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSubject("");
        setMessage("");
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>Feedback senden</ThemedText>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={20} color={colors.text} />
                        </Pressable>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                Betreff *
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    },
                                ]}
                                value={subject}
                                onChangeText={setSubject}
                                placeholder="z.B. Feature-Vorschlag, Bug-Report"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                Nachricht *
                            </ThemedText>
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
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Beschreibe dein Feedback..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={[
                            styles.submitButton,
                            { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 },
                        ]}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
                                <ThemedText style={styles.submitButtonText}>Senden</ThemedText>
                            </>
                        )}
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        maxHeight: "80%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    form: {
        marginBottom: Spacing.lg,
    },
    field: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: Spacing.xs,
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
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
