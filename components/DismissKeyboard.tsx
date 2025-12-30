
import React from 'react';
import { Keyboard, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';

/**
 * A wrapper component that dismisses the keyboard when the user taps outside of a text input.
 * Useful for forms and screens with input fields.
 * 
 * Usage:
 * <DismissKeyboard>
 *   <YourContent />
 * </DismissKeyboard>
 */
export const DismissKeyboard = ({ children }: { children: React.ReactNode }) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
            {children}
        </View>
    </TouchableWithoutFeedback>
);
