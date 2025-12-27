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
}

interface Friend {
    id: number;
    friend_user_id: number;
    user?: {
        id: number;
        email: string;
        username?: string;
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
        username?: string;
    };
}

export function ParticipantsModal({ visible, planId, onClose }: ParticipantsModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [showAddCustom, setShowAddCustom] = useState(false);
    const [customEmail, setCustomEmail] = useState('');
    const [customName, setCustomName] = useState('');
    const [adults, setAdults] = useState('1');
    const [children, setChildren] = useState('0');

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
            .select('*, user:users!friends_friend_user_id_fkey(id, email, username)')
            .eq('status', 'accepted');

        if (friendsData) {
            setFriends(friendsData as any);
        }

        // Load current participants
        const { data: participantsData } = await supabase
            .from('plan_participants')
            .select('*, user:users(email, username)')
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
                adults_count: parseInt(adults) || 1,
                children_count: parseInt(children) || 0,
                invitation_status: 'pending'
            });

        if (!error) {
            setCustomEmail('');
            setCustomName('');
            setAdults('1');
            setChildren('0');
            setShowAddCustom(false);
            loadData();
        } else {
            Alert.alert('Fehler', 'Konnte nicht hinzugefügt werden');
        }
    };

    const removeParticipant = async (participantId: string) => {
        const { error } = await supabase
            .from('plan_participants')
            .delete()
            .eq('id', participantId);

        if (!error) {
            loadData();
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
                                                    {participant.user?.username || participant.email || 'Unbekannt'}
                                                </ThemedText>
                                                <ThemedText style={[styles.participantMeta, { color: colors.textSecondary }]}>
                                                    {participant.adults_count} Erw. · {participant.children_count} Kinder
                                                </ThemedText>
                                            </View>
                                        </View>
                                        <Pressable
                                            onPress={() => removeParticipant(participant.id)}
                                            style={styles.removeButton}
                                        >
                                            <IconSymbol name="trash" size={18} color="#EF4444" />
                                        </Pressable>
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
                                                    {friend.user.username || friend.user.email}
                                                </ThemedText>
                                                {friend.user.username && (
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
    removeButton: {
        padding: Spacing.xs,
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
