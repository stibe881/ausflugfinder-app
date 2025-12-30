import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
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
import {
    sendBroadcastNotification,
    getNotificationTemplates,
    createNotificationTemplate,
    deleteNotificationTemplate,
    type NotificationTemplate
} from "@/lib/supabase-api";
import { useAdmin } from "@/contexts/admin-context";

type TabType = 'manual' | 'templates';

export default function BroadcastNotificationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const { canEdit } = useAdmin();

    const [activeTab, setActiveTab] = useState<TabType>('manual');
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);
    const [newTemplateTitle, setNewTemplateTitle] = useState("");
    const [newTemplateMessage, setNewTemplateMessage] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Redirect if not admin
    if (!canEdit) {
        router.back();
        return null;
    }

    // Load templates on mount
    useEffect(() => {
        if (activeTab === 'templates') {
            loadTemplates();
        }
    }, [activeTab]);

    const loadTemplates = async () => {
        setIsLoadingTemplates(true);
        const result = await getNotificationTemplates();
        if (result.success && result.templates) {
            setTemplates(result.templates);
        }
        setIsLoadingTemplates(false);
    };

    const handleUseTemplate = (template: NotificationTemplate) => {
        setTitle(template.title);
        setBody(template.message);
        setActiveTab('manual');
    };

    const handleDeleteTemplate = async (id: number) => {
        Alert.alert(
            "Template löschen",
            "Möchtest du dieses Template wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        const result = await deleteNotificationTemplate(id);
                        if (result.success) {
                            loadTemplates();
                        } else {
                            Alert.alert("Fehler", result.error || "Template konnte nicht gelöscht werden");
                        }
                    },
                },
            ]
        );
    };

    const handleCreateTemplate = async () => {
        if (!newTemplateTitle.trim() || !newTemplateMessage.trim()) {
            Alert.alert("Fehler", "Bitte Titel und Nachricht eingeben");
            return;
        }

        setIsCreating(true);
        const result = await createNotificationTemplate(newTemplateTitle.trim(), newTemplateMessage.trim());
        setIsCreating(false);

        if (result.success) {
            setShowCreateTemplate(false);
            setNewTemplateTitle("");
            setNewTemplateMessage("");
            loadTemplates();
            Alert.alert("Erfolg", "Template wurde erstellt");
        } else {
            Alert.alert("Fehler", result.error || "Template konnte nicht erstellt werden");
        }
    };

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
                            Alert.alert("Fehler", result.error ? `${result.error}` : "Unbekannter Fehler");
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
                {/* Tab Navigation */}
                <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                    <Pressable
                        onPress={() => setActiveTab('manual')}
                        style={[
                            styles.tab,
                            activeTab === 'manual' && styles.activeTab,
                            activeTab === 'manual' && { borderBottomColor: colors.primary }
                        ]}
                    >
                        <IconSymbol
                            name="pencil"
                            size={18}
                            color={activeTab === 'manual' ? colors.primary : colors.textSecondary}
                        />
                        <ThemedText style={[
                            styles.tabText,
                            activeTab === 'manual' && { color: colors.primary, fontWeight: '600' }
                        ]}>
                            Manuell
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={() => setActiveTab('templates')}
                        style={[
                            styles.tab,
                            activeTab === 'templates' && styles.activeTab,
                            activeTab === 'templates' && { borderBottomColor: colors.primary }
                        ]}
                    >
                        <IconSymbol
                            name="doc.text.fill"
                            size={18}
                            color={activeTab === 'templates' ? colors.primary : colors.textSecondary}
                        />
                        <ThemedText style={[
                            styles.tabText,
                            activeTab === 'templates' && { color: colors.primary, fontWeight: '600' }
                        ]}>
                            Templates
                        </ThemedText>
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                >
                    {activeTab === 'manual' ? (
                        <>
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
                        </>
                    ) : (
                        /* Templates Tab */
                        <>
                            {isLoadingTemplates ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : templates.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <IconSymbol name="doc.text" size={48} color={colors.textSecondary} />
                                    <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                                        Keine Templates vorhanden
                                    </ThemedText>
                                    <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                        Erstelle dein erstes Template für schnellere Benachrichtigungen
                                    </ThemedText>
                                </View>
                            ) : (
                                <View>
                                    {templates.map((template) => (
                                        <View
                                            key={template.id}
                                            style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        >
                                            <View style={styles.templateHeader}>
                                                <ThemedText style={styles.templateTitle}>{template.title}</ThemedText>
                                                {template.is_system && (
                                                    <View style={[styles.systemBadge, { backgroundColor: colors.primary + "15" }]}>
                                                        <ThemedText style={[styles.systemBadgeText, { color: colors.primary }]}>
                                                            System
                                                        </ThemedText>
                                                    </View>
                                                )}
                                            </View>
                                            <ThemedText style={[styles.templateMessage, { color: colors.textSecondary }]}>
                                                {template.message}
                                            </ThemedText>
                                            <View style={styles.templateActions}>
                                                <Pressable
                                                    onPress={() => handleUseTemplate(template)}
                                                    style={[styles.useButton, { backgroundColor: colors.primary }]}
                                                >
                                                    <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                                                    <ThemedText style={styles.useButtonText}>Verwenden</ThemedText>
                                                </Pressable>
                                                {!template.is_system && (
                                                    <Pressable
                                                        onPress={() => handleDeleteTemplate(template.id)}
                                                        style={[styles.deleteButton, { borderColor: colors.border }]}
                                                    >
                                                        <IconSymbol name="trash" size={16} color="#EF4444" />
                                                    </Pressable>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Create Template Button - Floating Action Button */}
                            {activeTab === 'templates' && (
                                <Pressable
                                    onPress={() => setShowCreateTemplate(true)}
                                    style={[styles.fab, { backgroundColor: colors.primary }]}
                                >
                                    <IconSymbol name="plus" size={24} color="#FFFFFF" />
                                </Pressable>
                            )}
                        </>
                    )}
                </ScrollView>

                {/* Create Template Modal */}
                <Modal
                    visible={showCreateTemplate}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setShowCreateTemplate(false)}
                >
                    <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <ThemedText style={styles.modalTitle}>Neues Template</ThemedText>
                            <Pressable onPress={() => setShowCreateTemplate(false)}>
                                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        {/* Modal Content */}
                        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Titel</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={newTemplateTitle}
                                    onChangeText={setNewTemplateTitle}
                                    placeholder="z.B. Sommer-Aktion"
                                    placeholderTextColor={colors.textSecondary}
                                    maxLength={100}
                                />
                                <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
                                    {newTemplateTitle.length}/100
                                </ThemedText>
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Nachricht</ThemedText>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                        { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                                    ]}
                                    value={newTemplateMessage}
                                    onChangeText={setNewTemplateMessage}
                                    placeholder="Template-Nachricht..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={6}
                                    maxLength={500}
                                    textAlignVertical="top"
                                />
                                <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
                                    {newTemplateMessage.length}/500
                                </ThemedText>
                            </View>

                            {/* Create Button */}
                            <Pressable
                                onPress={handleCreateTemplate}
                                disabled={isCreating || !newTemplateTitle.trim() || !newTemplateMessage.trim()}
                                style={({ pressed }) => [
                                    styles.createTemplateButton,
                                    {
                                        backgroundColor: !newTemplateTitle.trim() || !newTemplateMessage.trim() ? colors.border : colors.primary,
                                        opacity: pressed ? 0.8 : 1,
                                    },
                                ]}
                            >
                                {isCreating ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                                        <ThemedText style={styles.createTemplateButtonText}>Template erstellen</ThemedText>
                                    </>
                                )}
                            </Pressable>
                        </ScrollView>
                    </View>
                </Modal>
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: "row",
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 15,
        fontWeight: "500",
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: Spacing.xxl,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xxl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: Spacing.lg,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: Spacing.sm,
        textAlign: "center",
        lineHeight: 20,
    },
    templateCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    templateHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.sm,
    },
    templateTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
    },
    systemBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        marginLeft: Spacing.sm,
    },
    systemBadgeText: {
        fontSize: 11,
        fontWeight: "600",
    },
    templateMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    templateActions: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    useButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    useButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4.5,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    modalScroll: {
        flex: 1,
    },
    modalContent: {
        padding: Spacing.lg,
    },
    createTemplateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    createTemplateButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
