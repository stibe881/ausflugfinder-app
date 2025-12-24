import { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DateTimePickerProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime';
    onChange: (date: Date) => void;
}

export function DateTimePicker({ value, mode = 'date', onChange }: DateTimePickerProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [show, setShow] = useState(false);

    const handleChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }
        if (selectedDate) {
            onChange(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        if (mode === 'time') {
            return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <View>
            <Pressable
                onPress={() => setShow(true)}
                style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <ThemedText style={{ color: colors.text }}>{formatDate(value)}</ThemedText>
            </Pressable>

            {show && (
                <DateTimePicker
                    value={value}
                    mode={mode}
                    display="default"
                    onChange={handleChange}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        minHeight: 44,
        justifyContent: 'center',
    },
});
