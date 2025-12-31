import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Clipboard, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    private copyToClipboard = () => {
        const { error, errorInfo } = this.state;
        const content = `Error: ${error?.toString()}\n\nStack: ${errorInfo?.componentStack}`;
        Clipboard.setString(content);
        Alert.alert('Kopiert', 'Fehlerbericht in Zwischenablage kopiert');
    };

    public render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
                            <Text style={styles.title}>Upps! Ein Fehler ist aufgetreten.</Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.errorTitle}>Fehler:</Text>
                            <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
                        </View>

                        {this.state.errorInfo && (
                            <View style={styles.card}>
                                <Text style={styles.errorTitle}>Stack Trace:</Text>
                                <Text style={styles.stackText}>
                                    {this.state.errorInfo.componentStack}
                                </Text>
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button} onPress={this.copyToClipboard}>
                                <Text style={styles.buttonText}>Bericht kopieren</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={this.handleReset}>
                                <Text style={styles.buttonText}>Neustart versuchen</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        fontFamily: 'Courier',
        fontWeight: '500',
    },
    stackText: {
        fontSize: 12,
        color: '#374151',
        fontFamily: 'Courier',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    button: {
        flex: 1,
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    resetButton: {
        backgroundColor: '#10B981',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
