import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useJourney } from '@/context/journey-context';
import { dashboard, theme } from '@/admin/content';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { userName } = useJourney();
  const displayName = userName.trim() || dashboard.greetingName;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 12, paddingBottom: tabBarHeight + 24 },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hi {displayName} 👋
        </Text>
        <Pressable hitSlop={12}>
          <Ionicons name="notifications-outline" size={24} color={theme.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.indicesRow}
        style={styles.indicesScroll}>
        {dashboard.indices.map((ix) => (
          <View key={ix.id} style={styles.indexCard}>
            <Text style={styles.indexLabel}>{ix.label}</Text>
            <Text style={styles.indexValue}>{ix.value}</Text>
            <Text
              style={[
                styles.indexChange,
                ix.positive ? styles.changeUp : styles.changeDown,
              ]}>
              {ix.change}
            </Text>
          </View>
        ))}
      </ScrollView>

      <TextInput
        style={styles.search}
        placeholder={dashboard.searchPlaceholder}
        placeholderTextColor={theme.textMuted}
        editable={false}
      />

      <LinearGradient
        colors={[theme.purple, theme.purpleDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featured}>
        <Text style={styles.featuredEyebrow}>{dashboard.featuredCard.eyebrow}</Text>
        <Text style={styles.featuredTitle}>{dashboard.featuredCard.title}</Text>
        <Text style={styles.featuredMeta}>{dashboard.featuredCard.meta}</Text>
      </LinearGradient>

      <View style={styles.quickRow}>
        {dashboard.quickActions.map((action) => (
          <Pressable key={action.id} style={styles.quickBtn}>
            <Ionicons
              name={
                action.id === 'sip'
                  ? 'layers-outline'
                  : action.id === 'goal'
                    ? 'disc-outline'
                    : 'trending-up-outline'
              }
              size={22}
              color={theme.textPrimary}
            />
            <Text style={styles.quickLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>{dashboard.portfolioValueLabel}</Text>
        <Text style={styles.portfolioValue}>{dashboard.portfolioValue}</Text>
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>{dashboard.aiInsightTitle}</Text>
        <Text style={styles.insightBody}>{dashboard.aiInsightBody}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.backgroundGrey },
  scroll: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  indicesScroll: { marginBottom: 16, marginHorizontal: -16 },
  indicesRow: { paddingHorizontal: 16, gap: 10 },
  indexCard: {
    backgroundColor: theme.cardWhite,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 108,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  indexLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '600', marginBottom: 4 },
  indexValue: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  indexChange: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  changeUp: { color: theme.positive },
  changeDown: { color: theme.negative },
  search: {
    backgroundColor: '#E8E8ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.textPrimary,
    marginBottom: 18,
  },
  featured: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
  },
  featuredEyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 6 },
  featuredTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  featuredMeta: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  quickBtn: {
    flex: 1,
    backgroundColor: theme.cardWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  portfolioCard: {
    backgroundColor: theme.cardWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 18,
    marginBottom: 14,
  },
  portfolioLabel: { fontSize: 13, color: theme.textMuted, marginBottom: 6 },
  portfolioValue: { fontSize: 28, fontWeight: '700', color: theme.textPrimary },
  insightCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 16,
  },
  insightTitle: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 },
  insightBody: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
});
