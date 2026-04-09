import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, type Href } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { aiPortfolio, theme } from '@/admin/content';

export default function AiPortfolioScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 24, paddingBottom: tabBarHeight + 24 },
      ]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>{aiPortfolio.screenTitle}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{aiPortfolio.equityCard.title}</Text>
        {aiPortfolio.equityCard.rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <Text style={styles.rowKey}>{row.key}</Text>
            <Text style={styles.rowVal}>{row.value}</Text>
          </View>
        ))}
        <Text style={styles.why}>{aiPortfolio.equityCard.why}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{aiPortfolio.projectionCard.title}</Text>
        <Text style={styles.bigNum}>{aiPortfolio.projectionCard.principal}</Text>
        <Text style={styles.bigNum}>{aiPortfolio.projectionCard.rate}</Text>
        <Text style={styles.bigNum}>{aiPortfolio.projectionCard.years}</Text>
        <Text style={styles.future}>
          <Text style={styles.futureLabel}>{aiPortfolio.projectionCard.futureValueLabel} </Text>
          <Text style={styles.futureVal}>{aiPortfolio.projectionCard.futureValue}</Text>
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        onPress={() => router.push('/home/dashboard' as Href)}>
        <Text style={styles.ctaText}>{aiPortfolio.goToDashboard}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.backgroundGrey },
  scroll: { paddingHorizontal: 20 },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: theme.cardWhite,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.borderLight,
  },
  rowKey: { fontSize: 14, color: theme.textSecondary },
  rowVal: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  why: { marginTop: 14, fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
  bigNum: { fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginBottom: 6 },
  future: { marginTop: 12 },
  futureLabel: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  futureVal: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  cta: {
    backgroundColor: theme.navyButton,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  pressed: { opacity: 0.92 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
