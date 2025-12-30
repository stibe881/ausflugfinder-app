import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

interface ParticipantsModalProps {
    visible: boolean;
    planId: string;
    onClose: () => void;
    onDataChanged?: () => void; // Callback when participants change
}

interface Friend {
    id: number;
    friend_user_id: number;
    user?: {
        id: number;
        email: string;
        name?: string;
    };
}

interface Participant {
    id: string;
    user_id?: number;
    email?: string;
    role: string;
    adults_count: number;
    children_count: number;
    user?: {
        email: string;
        name?: string;
    };
}

export function ParticipantsModal({ visible, planId, onClose, onDataChanged }: ParticipantsModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [showAddCustom, setShowAddCustom] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
    const [customEmail, setCustomEmail] = useState('');
    const [customName, setCustomName] = useState('');
    const [adults, setAdults] = useState('1');
    const [children, setChildren] = useState('0');
    const [editEmail, setEditEmail] = useState('');

    useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible, planId]);

    const loadData = async () => {
        setLoading(true);

        // Load friends
        const { data: friendsData } = await supabase
            .from('friends')
            .select('*, user:users!friends_friend_user_id_fkey(id, email, name)')
            .eq('status', 'accepted');

        if (friendsData) {
            setFriends(friendsData as any);
        }

        // Load current participants
        const { data: participantsData } = await supabase
            .from('plan_participants')
            .select('*, user:users(email, name)')
            .eq('plan_id', planId);

        if (participantsData) {
            setParticipants(participantsData as any);
        }

        setLoading(false);
    };

    const addFriend = async (friend: Friend) => {
        if (!friend.user) return;

        const { error } = await supabase
            .from('plan_participants')
            .insert({
                plan_id: planId,
                user_id: friend.user.id,
                role: 'participant',
                adults_count: 1,
                children_count: 0,
                invitation_status: 'pending'
            });

        if (!error) {
            loadData();
            onDataChanged?.(); // Notify parent
        } else {
            Alert.alert('Fehler', 'Konnte nicht hinzugefügt werden');
        }
    };

    const addCustomParticipant = async () => {
        if (!customEmail.trim() && !customName.trim()) {
            Alert.alert('Fehler', 'Bitte Email oder Name eingeben');
            return;
        }

        const { error } = await supabase
            .from('plan_participants')
            .insert({
                plan_id: planId,
                email: customEmail.trim() || customName.trim(),
                role: 'participant',
                adults_count: isNaN(parseInt(adults)) ? 1 : parseInt(adults),
                children_count: isNaN(parseInt(children)) ? 0 : parseInt(children),
                invitation_status: 'pending'
            });

        if (!error) {
            setCustomEmail('');
            setCustomName('');
            setAdults('1');
            setChildren('0');
            setShowAddCustom(false);
            loadData();
            onDataChanged?.(); // Notify parent
        } else {
            Alert.alert('Fehler', 'Konnte nicht hinzugefügt werden');
        }
    };

    const editParticipant = (participant: Participant) => {
        setEditingParticipant(participant);
        setAdults(participant.adults_count.toString());
        setChildren(participant.children_count.toString());
        setEditEmail(participant.email || '');
    };

    const saveParticipantEdit = async () => {
        if (!editingParticipant) return;

        if (!editEmail.trim()) {
            Alert.alert('Fehler', 'Bitte einen Namen/Email eingeben');
            return;
        }

        const { error } = await supabase
            .from('plan_participants')
            .update({
                email: editEmail.trim(),
                adults_count: isNaN(parseInt(adults)) ? 1 : parseInt(adults),
                children_count: isNaN(parseInt(children)) ? 0 : parseInt(children),
            })
            .eq('id', editingParticipant.id);

        if (!error) {
            setEditingParticipant(null);
            setAdults('1');
            setChildren('0');
            setEditEmail('');
            loadData();
            onDataChanged?.(); // Notify parent
        } else {
            Alert.alert('Fehler', 'Konnte nicht aktualisiert werden');
        }
    };

    const removeParticipant = async (participantId: string) => {
        const { error } = await supabase
            .from('plan_participants')
            .delete()
            .eq('id', participantId);

        if (!error) {
            loadData();
            onDataChanged?.(); // Notify parent
        } else {
            Alert.alert('Fehler', 'Konnte nicht entfernt werden');
        }
    };

    const isAlreadyAdded = (userId: number) => {
        return participants.some(p => p.user_id === userId);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <ThemedText style={styles.title}>Teilnehmer</ThemedText>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
                    </Pressable>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Current Participants */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>
                                Aktuelle Teilnehmer ({participants.length})
                            </ThemedText>

                            {participants.length === 0 ? (
                                <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                                    <IconSymbol name="person.2" size={32} color={colors.textSecondary} />
                                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        Noch keine Teilnehmer
                                    </ThemedText>
                                </View>
                            ) : (
                                participants.map(participant => (
                                    <View
                                        key={participant.id}
                                        style={[styles.participantCard, {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border
                                        }]}
                                    >
                                        <View style={styles.participantInfo}>
                                            <IconSymbol name="person.fill" size={20} color={colors.primary} />
                                            <View style={styles.participantDetails}>
                                                <ThemedText style={styles.participantName}>
                                                    {participant.user?.name || participant.email || 'Unbekannt'}
                                                </ThemedText>
                                                <ThemedText style={[styles.participantMeta, { color: colors.textSecondary }]}>
                                                    {participant.adults_count} Erw. · {participant.children_count} Kinder
                                                </ThemedText>
                                            </View>
                                        </View>
                                        <View style={styles.participantActions}>
                                            <Pressable
                                                onPress={() => editParticipant(participant)}
                                                style={styles.actionButton}
                                            >
                                                <IconSymbol name="pencil" size={18} color={colors.primary} />
                                            </Pressable>
                                            <Pressable
                                                onPress={() => removeParticipant(participant.id)}
                                                style={styles.actionButton}
                                            >
                                                <IconSymbol name="trash" size={18} color="#EF4444" />
                                            </Pressable>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Add from Friends */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Freunde hinzufügen</ThemedText>

                            {friends.length === 0 ? (
                                <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                                    <IconSymbol name="person.2.slash" size={32} color={colors.textSecondary} />
                                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        Keine Freunde verfügbar
                                    </ThemedText>
                                </View>
                            ) : (
                                friends.map(friend => {
                                    if (!friend.user) return null;
                                    const alreadyAdded = isAlreadyAdded(friend.user.id);

                                    return (
                                        <Pressable
                                            key={friend.id}
                                            disabled={alreadyAdded}
                                            onPress={() => addFriend(friend)}
                                            style={[
                                                styles.friendCard,
                                                {
                                                    backgroundColor: colors.card,
                                                    borderColor: colors.border,
                                                    opacity: alreadyAdded ? 0.5 : 1
                                                }
                                            ]}
                                        >
                                            <IconSymbol name="person.circle" size={24} color={colors.primary} />
                                            <View style={styles.friendInfo}>
                                                <ThemedText style={styles.friendName}>
                                                    {friend.user.name || friend.user.email}
                                                </ThemedText>
                                                {friend.user.name && (
                                                    <ThemedText style={[styles.friendEmail, { color: colors.textSecondary }]}>
                                                        {friend.user.email}
                                                    </ThemedText>
                                                )}
                                            </View>
                                            {alreadyAdded ? (
                                                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                                            ) : (
                                                <IconSymbol name="plus.circle.fill" size={20} color={colors.primary} />
                                            )}
                                        </Pressable>
                                    );
                                })
                            )}
                        </View>

                        {/* Add Custom Participant */}
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Andere Person hinzufügen</ThemedText>

                            {!showAddCustom ? (
                                <Pressable
                                    onPress={() => setShowAddCustom(true)}
                                    style={[styles.addCustomButton, {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border
                                    }]}
                                >
                                    <IconSymbol name="person.badge.plus" size={20} color={colors.primary} />
                                    <ThemedText style={{ color: colors.primary }}>
                                        Person hinzufügen
                                    </ThemedText>
                                </Pressable>
                            ) : (
                                <View style={[styles.customForm, {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border
                                }]}>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                            borderColor: colors.border
                                        }]}
                                        placeholder="Email oder Name"
                                        placeholderTextColor={colors.textSecondary}
                                        value={customEmail}
                                        onChangeText={setCustomEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />

                                    <View style={styles.countersRow}>
                                        <View style={styles.counter}>
                                            <ThemedText style={[styles.counterLabel, { color: colors.textSecondary }]}>
                                                Erwachsene
                                            </ThemedText>
                                            <TextInput
                                                style={[styles.counterInput, {
                                                    backgroundColor: colors.background,
                                                    color: colors.text,
                                                    borderColor: colors.border
                                                }]}
                                                value={adults}
                                                onChangeText={setAdults}
                                                keyboardType="number-pad"
                                            />
                                        </View>

                                        <View style={styles.counter}>
                                            <ThemedText style={[styles.counterLabel, { color: colors.textSecondary }]}>
                                                Kinder
                                            </ThemedText>
                                            <TextInput
                                                style={[styles.counterInput, {
                                                    backgroundColor: colors.background,
                                                    color: colors.text,
                                                    borderColor: colors.border
                                                }]}
                                                value={children}
                                                onChangeText={setChildren}
                                                keyboardType="number-pad"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.formButtons}>
                                        <Pressable
                                            onPress={() => {
                                                setShowAddCustom(false);
                                                setCustomEmail('');
                                                setCustomName('');
                                                setAdults('1');
                                                setChildren('0');
                                            }}
                                            style={[styles.formButton, { backgroundColor: colors.surface }]}
                                        >
                                            <ThemedText>Abbrechen</ThemedText>
                                        </Pressable>
                                        <Pressable
                                            onPress={addCustomParticipant}
                                            style={[styles.formButton, { backgroundColor: colors.primary }]}
                                        >
                                            <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>
                                                Hinzufügen
                                            </ThemedText>
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                )}

                {/* Edit Participant Dialog */}
                {editingParticipant && (
                    <Modal
                        visible={true}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setEditingParticipant(null)}
                    >
                        <View style={styles.dialogOverlay}>
                            <View style={[styles.dialogContent, { backgroundColor: colors.surface }]}>
                                <ThemedText style={styles.dialogTitle}>Teilnehmer bearbeiten</ThemedText>
                                <ThemedText style={[styles.dialogMessage, { color: colors.textSecondary }]}>
                                    {editingParticipant.user?.name || editingParticipant.email}
                                </ThemedText>

                                {/* Name/Email Field */}
                                <View style={{ marginBottom: Spacing.md }}>
                                    <ThemedText style={[styles.counterLabel, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
                                        Name/Email
                                    </ThemedText>
                                    <TextInput
                                        style={[styles.emailInput, {
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                            borderColor: colors.border
                                        }]}
                                        value={editEmail}
                                        onChangeText={setEditEmail}
                                        placeholder="z.B. Max Mustermann"
                                        placeholderTextColor={colors.textSecondary}
                                        autoCapitalize="words"
                                    />
                                </View>

                                <View style={styles.countersRow}>
                                    <View style={styles.counter}>
                                        <ThemedText style={[styles.counterLabel, { color: colors.textSecondary }]}>
                                            Erwachsene
                                        </ThemedText>
                                        <TextInput
                                            style={[styles.counterInput, {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.border
                                            }]}
                                            value={adults}
                                            onChangeText={setAdults}
                                            keyboardType="number-pad"
                                        />
                                    </View>

                                    <View style={styles.counter}>
                                        <ThemedText style={[styles.counterLabel, { color: colors.textSecondary }]}>
                                            Kinder
                                        </ThemedText>
                                        <TextInput
                                            style={[styles.counterInput, {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.border
                                            }]}
                                            value={children}
                                            onChangeText={setChildren}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </View>

                                <View style={styles.formButtons}>
                                    <Pressable
                                        onPress={() => {
                                            setEditingParticipant(null);
                                            setAdults('1');
                                            setChildren('0');
                                            setEditEmail('');
                                        }}
                                        style={[styles.formButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                                    >
                                        <ThemedText>Abbrechen</ThemedText>
                                    </Pressable>
                                    <Pressable
                                        onPress={saveParticipantEdit}
                                        style={[styles.formButton, { backgroundColor: colors.primary }]}
                                    >
                                        <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>
                                            Speichern
                                        </ThemedText>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    closeButton: {
        padding: Spacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    emptyText: {
        fontSize: 14,
    },
    participantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 1,
    },
    participantDetails: {
        flex: 1,
    },
    participantName: {
        fontSize: 15,
        fontWeight: '500',
    },
    participantMeta: {
        fontSize: 12,
        marginTop: 2,
    },
    participantActions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    actionButton: {
        padding: Spacing.xs,
    },
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    dialogContent: {
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
    dialogTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    dialogMessage: {
        fontSize: 14,
        marginBottom: Spacing.lg,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        gap: Spacing.sm,
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 15,
        fontWeight: '500',
    },
    friendEmail: {
        fontSize: 12,
        marginTop: 2,
    },
    addCustomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    customForm: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: 15,
    },
    countersRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    counter: {
        flex: 1,
    },
    counterLabel: {
        fontSize: 13,
        marginBottom: Spacing.xs,
    },
    emailInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: 15,
    },
    counterInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        fontSize: 16,
        textAlign: 'center',
    },
    formButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    formButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
});
