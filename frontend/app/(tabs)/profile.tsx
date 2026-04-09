import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goals, riskProfiles, theme } from '@/admin/content';
import { useAuth } from '@/context/auth-context';
import { useJourney } from '@/context/journey-context';

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, logout } = useAuth();
  const { userName, goalId, riskId, horizonId, monthlySurplus, taxPreference } = useJourney();
  const resolvedName = userName?.trim() || user?.displayName?.trim() || '—';

  const goal = goals.options.find((g) => g.id === goalId);
  const risk = riskProfiles[riskId];
  const horizonLabel =
    horizonId === 'short'
      ? 'Short (0-12 months)'
      : horizonId === 'mid'
        ? 'Intermediate (1-3 years)'
        : 'Long (3-5+ years)';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 18, paddingBottom: tabBarHeight + 28 },
      ]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your onboarding details (demo)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic</Text>
        <View style={styles.row}>
          <Text style={styles.key}>Email</Text>
          <Text style={styles.val}>{user?.email || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Name</Text>
          <Text style={styles.val}>{resolvedName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Goal</Text>
          <Text style={styles.val}>
            {goal ? `${goal.label} (${goal.subLabel})` : goalId}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Risk profile</Text>
        <View style={styles.row}>
          <Text style={styles.key}>Risk appetite</Text>
          <Text style={styles.val}>{`${risk.label} (${risk.subLabel})`}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Horizon</Text>
          <Text style={styles.val}>{horizonLabel}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Financial</Text>
        <View style={styles.row}>
          <Text style={styles.key}>Monthly invest (approx.)</Text>
          <Text style={styles.val}>₹{monthlySurplus || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Tax-saving preference</Text>
          <Text style={styles.val}>{taxPreference === 'yes' ? 'Yes' : 'No'}</Text>
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]} onPress={() => void logout()}>
        <Text style={styles.ctaText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.backgroundGrey },
  scroll: { paddingHorizontal: 18 },
  title: { fontSize: 24, fontWeight: '900', color: theme.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '900', color: theme.textPrimary, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.borderLight,
  },
  key: { flex: 1, paddingRight: 12, fontSize: 13, color: theme.textSecondary, fontWeight: '700' },
  val: { flex: 1, textAlign: 'right', fontSize: 13, color: theme.textPrimary, fontWeight: '900' },
  cta: {
    marginTop: 6,
    backgroundColor: theme.navyButton,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
