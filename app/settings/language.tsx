import { Stack } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage, Language } from "@/contexts/language-context";

const LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
];

export default function LanguageSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { language, setLanguage } = useLanguage();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, headerTitle: "Sprache" }} />
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
            Wähle die Sprache für die App-Oberfläche
          </ThemedText>

          <View style={styles.languageList}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[
                  styles.languageItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: language === lang.code ? colors.primary : colors.border,
                    borderWidth: language === lang.code ? 2 : 1,
                  },
                ]}
              >
                <ThemedText style={styles.flag}>{lang.flag}</ThemedText>
                <View style={styles.languageInfo}>
                  <ThemedText style={styles.languageName}>{lang.nativeName}</ThemedText>
                  <ThemedText style={[styles.languageEnglish, { color: colors.textSecondary }]}>
                    {lang.name}
                  </ThemedText>
                </View>
                {language === lang.code && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  description: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  languageList: {
    gap: Spacing.sm,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  flag: {
    fontSize: 32,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
  },
  languageEnglish: {
    fontSize: 13,
    marginTop: 2,
  },
});
