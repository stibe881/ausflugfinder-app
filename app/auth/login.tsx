import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const { signIn } = useSupabaseAuth();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const hasCredentials = await SecureStore.getItemAsync('user_email');
      setIsBiometricSupported(compatible && enrolled && !!hasCredentials);
    })();
  }, []);

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Anmelden mit Face ID',
        fallbackLabel: 'Passwort verwenden',
      });

      if (result.success) {
        setLoading(true);
        const savedEmail = await SecureStore.getItemAsync('user_email');
        const savedPassword = await SecureStore.getItemAsync('user_password');

        if (savedEmail && savedPassword) {
          const { error } = await signIn(savedEmail, savedPassword);
          if (error) {
            Alert.alert('Login fehlgeschlagen', 'Gespeicherte Daten sind ungültig.');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          Alert.alert('Info', 'Keine Zugangsdaten für Face ID gespeichert.');
        }
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Biometrischer Login nicht möglich.');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Login fehlgeschlagen', error.message);
    } else {
      // Save credentials locally for biometric login
      try {
        await SecureStore.setItemAsync('user_email', email);
        await SecureStore.setItemAsync('user_password', password);
      } catch (e) {
        console.warn('Could not save credentials for biometrics');
      }
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 40,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Willkommen zurück</Text>
          <Text style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
            Melde dich an, um fortzufahren
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>E-Mail</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: tintColor }]}
              placeholder="deine@email.com"
              placeholderTextColor={textColor + '80'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Passwort</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: tintColor }]}
              placeholder="••••••••"
              placeholderTextColor={textColor + '80'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />
          </View>

          <Pressable
            onPress={() => router.push('/auth/reset-password' as any)}
            disabled={loading}
          >
            <Text style={[styles.forgotPassword, { color: tintColor }]}>
              Passwort vergessen?
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Anmelden</Text>
            )}
          </Pressable>

          {isBiometricSupported && (
            <Pressable
              style={[styles.biometricButton, { borderColor: tintColor }]}
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <IconSymbol name="faceid" size={24} color={tintColor} />
              <Text style={[styles.biometricButtonText, { color: tintColor }]}>Mit Face ID anmelden</Text>
            </Pressable>
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: textColor, opacity: 0.7 }]}>
              Noch kein Konto?{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/auth/register' as any)}
              disabled={loading}
            >
              <Text style={[styles.link, { color: tintColor }]}>Jetzt registrieren</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  forgotPassword: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: -8,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
});
