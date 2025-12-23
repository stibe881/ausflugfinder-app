import { useState } from "react";
import {
    View,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { inviteParticipant, type ParticipantRole } from "@/lib/planning-api";

export function ParticipantInvite({ planId, onInvited }: { planId: string; onInvited: () => void }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleInvite = async () => {
        if (!email.trim() || !email.includes("@")) {
            Alert.alert("Fehler", "Bitte gib eine gültige E-Mail-Adresse ein");
            return;
        }

        setIsLoading(true);
        const result = await inviteParticipant(planId, email.trim(), "participant");
        setIsLoading(false);

        if (result.success) {
            Alert.alert("Erfolg", `Einladung an ${email} versendet`);
            setEmail("");
            onInvited();
        } else {
            Alert.alert("Fehler", result.error || "Einladung konnte nicht versendet werden");
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={styles.label}>Teilnehmer einladen</ThemedText>
            <View style={styles.row}>
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text,
                        },
                    ]}
                    placeholder="email@example.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                />
                <Pressable
                    onPress={handleInvite}
                    disabled={isLoading}
                    style={[
                        styles.button,
                        { backgroundColor: isLoading ? colors.border : colors.primary },
                    ]}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
    },
    row: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: 14,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        justifyContent: "center",
        alignItems: "center",
    },
});
