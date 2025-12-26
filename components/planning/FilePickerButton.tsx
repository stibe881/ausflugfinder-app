import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FilePickerButtonProps {
    onFilePicked: (file: { uri: string; name: string; type?: string }) => void;
    currentFile?: string;
    label?: string;
}

export function FilePickerButton({ onFilePicked, currentFile, label = 'Datei hochladen' }: FilePickerButtonProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [picking, setPicking] = useState(false);

    const pickDocument = async () => {
        try {
            setPicking(true);
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const file = result.assets[0];
                onFilePicked({
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType,
                });
            }
        } catch (error) {
            Alert.alert('Fehler', 'Datei konnte nicht ausgewählt werden');
            console.error('File picker error:', error);
        } finally {
            setPicking(false);
        }
    };

    return (
        <View style={styles.container}>
            <Pressable
                style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={pickDocument}
                disabled={picking}
            >
                <IconSymbol name="doc.badge.plus" size={20} color={colors.primary} />
                <ThemedText style={styles.buttonText}>
                    {currentFile ? 'Datei ändern' : label}
                </ThemedText>
            </Pressable>
            {currentFile && (
                <View style={styles.fileInfo}>
                    <IconSymbol name="doc.fill" size={16} color={colors.textSecondary} />
                    <ThemedText style={[styles.fileName, { color: colors.textSecondary }]} numberOfLines={1}>
                        {currentFile.split('/').pop()}
                    </ThemedText>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.xs,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    buttonText: {
        fontSize: 15,
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingLeft: Spacing.sm,
    },
    fileName: {
        fontSize: 13,
        flex: 1,
    },
});
