import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, type Href } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useJourney } from '@/context/journey-context';
import { brand, dashboard, theme } from '@/admin/content';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { userName, setUserName } = useJourney();
  const [name, setName] = useState('');
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (edited) return;
    setName(userName || '');
  }, [userName, edited]);

  const onStart = () => {
    const trimmed = name.trim();
    setUserName(trimmed || dashboard.greetingName);
    router.push('/home/goal' as Href);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 32,
            paddingBottom: tabBarHeight + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <View style={styles.logoSquare}>
            <Text style={styles.rupee}>₹</Text>
          </View>
          <Text style={styles.appName}>{brand.appName}</Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
          <Text style={styles.quote}>{brand.quote}</Text>
        </View>

        <View style={styles.chipsRow}>
          {brand.featureChips.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{brand.personalizeTitle}</Text>
          <TextInput
            style={styles.input}
            placeholder={brand.personalizeInputPlaceholder}
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={(v) => {
              setEdited(true);
              setName(v);
            }}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={onStart}>
            <Text style={styles.primaryBtnText}>{brand.startButton}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.btnIcon} />
          </Pressable>
          <Text style={styles.trust}>{brand.trustLine}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.backgroundLavender },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoSquare: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: theme.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rupee: { color: '#fff', fontSize: 28, fontWeight: '700' },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 6,
  },
  tagline: { fontSize: 15, color: theme.textSecondary, marginBottom: 10, textAlign: 'center' },
  quote: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  chip: {
    backgroundColor: theme.chipBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: theme.purpleDark },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.cardWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: theme.navyButton,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.9 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnIcon: { marginLeft: 4 },
  trust: {
    marginTop: 14,
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
  },
});
