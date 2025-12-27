import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TextInput, Pressable } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface InputDialogProps {
    visible: boolean;
    title: string;
    message?: string;
    placeholder?: string;
    initialValue?: string;
    secondPlaceholder?: string; // For address field
    initialValue2?: string;
    onConfirm: (text: string, text2?: string) => void;
    onCancel: () => void;
}

export function InputDialog({
    visible,
    title,
    message,
    placeholder,
    initialValue,
    secondPlaceholder,
    initialValue2,
    onConfirm,
    onCancel,
}: InputDialogProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [inputValue, setInputValue] = useState('');
    const [inputValue2, setInputValue2] = useState('');

    // Set initial values when dialog opens
    useEffect(() => {
        if (visible) {
            setInputValue(initialValue || '');
            setInputValue2(initialValue2 || '');
        }
    }, [visible, initialValue, initialValue2]);

    const handleConfirm = () => {
        onConfirm(inputValue, secondPlaceholder ? inputValue2 : undefined);
        setInputValue(''); // Reset
        setInputValue2(''); // Reset
    };

    const handleCancel = () => {
        onCancel();
        setInputValue(''); // Reset
        setInputValue2(''); // Reset
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
                    <ThemedText style={styles.title}>{title}</ThemedText>
                    {message && (
                        <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
                            {message}
                        </ThemedText>
                    )}

                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder={placeholder || 'Eingabe...'}
                        placeholderTextColor={colors.textSecondary}
                        value={inputValue}
                        onChangeText={setInputValue}
                        autoFocus
                    />

                    {secondPlaceholder && (
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text,
                                    marginTop: Spacing.sm,
                                },
                            ]}
                            placeholder={secondPlaceholder}
                            placeholderTextColor={colors.textSecondary}
                            value={inputValue2}
                            onChangeText={setInputValue2}
                        />
                    )}

                    <View style={styles.buttons}>
                        <Pressable
                            onPress={handleCancel}
                            style={[styles.button, { backgroundColor: colors.background }]}
                        >
                            <ThemedText style={{ color: colors.textSecondary }}>
                                Abbrechen
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={handleConfirm}
                            style={[styles.button, { backgroundColor: colors.primary }]}
                        >
                            <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>
                                OK
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    dialog: {
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
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    message: {
        fontSize: 14,
        marginBottom: Spacing.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: 16,
        marginBottom: Spacing.lg,
    },
    buttons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    button: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
});
