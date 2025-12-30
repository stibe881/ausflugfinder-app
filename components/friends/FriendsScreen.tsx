import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    Modal,
    TouchableWithoutFeedback,
    Keyboard,
    RefreshControl
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Colors, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    sendFriendInvitation,
    getPendingInvitations,
    getFriends,
    acceptFriendInvitation,
    rejectFriendInvitation,
    removeFriend,
    FriendInvitation,
    Friendship
} from '@/lib/friends-api';

export function FriendsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [sending, setSending] = useState(false);

    const [pendingInvitations, setPendingInvitations] = useState<FriendInvitation[]>([]);
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([
            loadPendingInvitations(),
            loadFriends()
        ]);
        setLoading(false);
    };

    const loadPendingInvitations = async () => {
        const result = await getPendingInvitations();
        if (result.success && result.invitations) {
            setPendingInvitations(result.invitations);
        }
    };

    const loadFriends = async () => {
        const result = await getFriends();
        if (result.success && result.friends) {
            setFriends(result.friends);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleSendInvitation = async () => {
        if (!inviteEmail.trim()) {
            Alert.alert('Fehler', 'Bitte Email-Adresse eingeben');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail)) {
            Alert.alert('Fehler', 'Bitte gültige Email-Adresse eingeben');
            return;
        }

        setSending(true);
        const result = await sendFriendInvitation(inviteEmail, inviteMessage || undefined);
        setSending(false);

        if (result.success) {
            Alert.alert(
                'Einladung gesendet!',
                result.isNewUser
                    ? 'Eine Email-Einladung wurde versendet.'
                    : 'Push-Benachrichtigung wurde gesendet.'
            );
            setInviteEmail('');
            setInviteMessage('');
            setShowInviteDialog(false);
        } else {
            Alert.alert('Fehler', result.error || 'Einladung konnte nicht gesendet werden');
        }
    };

    const handleAcceptInvitation = async (invitationId: string) => {
        const result = await acceptFriendInvitation(invitationId);
        if (result.success) {
            Alert.alert('Erfolg', 'Freundschaftsanfrage angenommen!');
            await loadData();
        } else {
            Alert.alert('Fehler', result.error || 'Fehler beim Annehmen');
        }
    };

    const handleRejectInvitation = async (invitationId: string) => {
        Alert.alert(
            'Anfrage ablehnen',
            'Möchtest du diese Anfrage wirklich ablehnen?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Ablehnen',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await rejectFriendInvitation(invitationId);
                        if (result.success) {
                            await loadData();
                        } else {
                            Alert.alert('Fehler', result.error || 'Fehler beim Ablehnen');
                        }
                    }
                }
            ]
        );
    };

    const handleRemoveFriend = async (friendEmail: string, friendName?: string) => {
        Alert.alert(
            'Freund entfernen',
            `Möchtest du ${friendName || friendEmail} wirklich als Freund entfernen?`,
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Entfernen',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await removeFriend(friendEmail);
                        if (result.success) {
                            await loadData();
                        } else {
                            Alert.alert('Fehler', result.error || 'Fehler beim Entfernen');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Pending Invitations Section */}
                {pendingInvitations.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <View style={styles.sectionHeader}>
                            <IconSymbol name="envelope.badge" size={20} color={colors.primary} />
                            <ThemedText style={styles.sectionTitle}>
                                Freundschaftsanfragen ({pendingInvitations.length})
                            </ThemedText>
                        </View>

                        {pendingInvitations.map((invitation) => (
                            <View
                                key={invitation.id}
                                style={[styles.invitationCard, { borderColor: colors.border }]}
                            >
                                <View style={styles.invitationInfo}>
                                    <ThemedText style={styles.invitationName}>
                                        {invitation.sender_name || invitation.sender_email}
                                    </ThemedText>
                                    {invitation.message && (
                                        <ThemedText
                                            style={[styles.invitationMessage, { color: colors.textSecondary }]}
                                        >
                                            "{invitation.message}"
                                        </ThemedText>
                                    )}
                                    <ThemedText style={[styles.invitationDate, { color: colors.textSecondary }]}>
                                        {new Date(invitation.created_at).toLocaleDateString('de-CH')}
                                    </ThemedText>
                                </View>

                                <View style={styles.invitationActions}>
                                    <Pressable
                                        onPress={() => handleAcceptInvitation(invitation.id)}
                                        style={[styles.actionButton, { backgroundColor: '#34C759' }]}
                                    >
                                        <IconSymbol name="checkmark" size={18} color="#FFF" />
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handleRejectInvitation(invitation.id)}
                                        style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                                    >
                                        <IconSymbol name="xmark" size={18} color="#FFF" />
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Friends List Section */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="person.2.fill" size={20} color={colors.primary} />
                        <ThemedText style={styles.sectionTitle}>
                            Freunde ({friends.length})
                        </ThemedText>
                    </View>

                    {friends.length === 0 ? (
                        <View style={styles.emptyState}>
                            <IconSymbol name="person.2" size={48} color={colors.textSecondary} />
                            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Noch keine Freunde
                            </ThemedText>
                            <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Lade Freunde ein um loszulegen!
                            </ThemedText>
                        </View>
                    ) : (
                        friends.map((friend) => (
                            <View
                                key={friend.friend_email}
                                style={[styles.friendCard, { borderColor: colors.border }]}
                            >
                                <View style={styles.friendInfo}>
                                    <ThemedText style={styles.friendName}>
                                        {friend.friend_name || friend.friend_email}
                                    </ThemedText>
                                    <ThemedText style={[styles.friendDate, { color: colors.textSecondary }]}>
                                        Freunde seit {new Date(friend.friendship_created_at).toLocaleDateString('de-CH')}
                                    </ThemedText>
                                </View>

                                <Pressable
                                    onPress={() => handleRemoveFriend(friend.friend_email, friend.friend_name)}
                                    style={styles.removeFriendButton}
                                >
                                    <IconSymbol name="trash" size={18} color="#FF3B30" />
                                </Pressable>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <Pressable
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setShowInviteDialog(true)}
            >
                <IconSymbol name="person.badge.plus" size={24} color="#FFF" />
            </Pressable>

            {/* Invite Dialog */}
            <Modal
                visible={showInviteDialog}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInviteDialog(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <ThemedText style={styles.modalTitle}>Freund einladen</ThemedText>

                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }
                                ]}
                                placeholder="Email-Adresse"
                                placeholderTextColor={colors.textSecondary}
                                value={inviteEmail}
                                onChangeText={setInviteEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.messageInput,
                                    {
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }
                                ]}
                                placeholder="Nachricht (optional)"
                                placeholderTextColor={colors.textSecondary}
                                value={inviteMessage}
                                onChangeText={setInviteMessage}
                                multiline
                                numberOfLines={3}
                            />

                            <View style={styles.modalButtons}>
                                <Pressable
                                    onPress={() => setShowInviteDialog(false)}
                                    style={[
                                        styles.modalButton,
                                        { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }
                                    ]}
                                    disabled={sending}
                                >
                                    <ThemedText>Abbrechen</ThemedText>
                                </Pressable>
                                <Pressable
                                    onPress={handleSendInvitation}
                                    style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                    disabled={sending}
                                >
                                    <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>
                                        {sending ? 'Sende...' : 'Einladen'}
                                    </ThemedText>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: Spacing.md,
    },
    section: {
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    invitationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    invitationInfo: {
        flex: 1,
    },
    invitationName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    invitationMessage: {
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    invitationDate: {
        fontSize: 11,
    },
    invitationActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    friendDate: {
        fontSize: 11,
    },
    removeFriendButton: {
        padding: Spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        padding: Spacing.xl * 2,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: Spacing.md,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: Spacing.xs,
    },
    fab: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: Spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: Spacing.lg,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: 15,
        marginBottom: Spacing.md,
    },
    messageInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    modalButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
});
