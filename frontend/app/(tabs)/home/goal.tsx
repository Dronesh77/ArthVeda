import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useJourney } from '@/context/journey-context';
import { goals, theme } from '@/admin/content';

export default function GoalScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { setGoalId } = useJourney();
  const [selected, setSelected] = useState<string>('growth');

  const onNext = () => {
    setGoalId(selected);
    router.push('/home/ai-portfolio' as Href);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 28, paddingBottom: tabBarHeight + 28 },
      ]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{goals.title}</Text>
      <Text style={styles.subtitle}>{goals.subtitle}</Text>

      <View style={styles.list}>
        {goals.options.map((opt) => {
          const active = selected === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setSelected(opt.id)}
              style={[styles.option, active && styles.optionActive]}>
              <Text style={styles.optionLabel}>
                {opt.label}{' '}
                <Text style={styles.optionSub}>({opt.subLabel})</Text>
              </Text>
              {active ? (
                <Ionicons name="checkmark-circle" size={24} color={theme.purple} />
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]} onPress={onNext}>
        <Text style={styles.nextBtnText}>{goals.nextButton}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.backgroundGrey },
  scroll: { paddingHorizontal: 20 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: theme.textSecondary, marginBottom: 28 },
  list: { gap: 12, marginBottom: 28 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: theme.cardWhite,
    borderColor: theme.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  optionLabel: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, flex: 1, paddingRight: 12 },
  optionSub: { fontWeight: '500', color: theme.textSecondary },
  radioEmpty: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: theme.borderLight },
  nextBtn: {
    backgroundColor: theme.navyButton,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pressed: { opacity: 0.92 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
