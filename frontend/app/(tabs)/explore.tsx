import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatbot, explore, goals, instruments, riskProfiles, theme } from '@/admin/content';
import { useJourney } from '@/context/journey-context';

type RiskId = (typeof goals.options)[number]['id'];
type Instrument = (typeof instruments)[RiskId][number];

function formatRiskLabel(riskId: RiskId) {
  const profile = riskProfiles[riskId];
  return `${profile.label} (${profile.subLabel})`;
}

export default function ExploreTab() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { userName } = useJourney();

  const [riskId, setRiskId] = useState<RiskId>('income');
  const [selectedId, setSelectedId] = useState<string>(instruments[riskId][0]?.id ?? '');

  const riskOptions = goals.options;

  const list = useMemo(() => instruments[riskId], [riskId]);
  const selected: Instrument | undefined = useMemo(
    () => list.find((i) => i.id === selectedId) ?? list[0],
    [list, selectedId],
  );

  // Keep selection valid if risk profile changes.
  React.useEffect(() => {
    const next = instruments[riskId][0];
    if (!next) return;
    setSelectedId((prev) => (instruments[riskId].some((i) => i.id === prev) ? prev : next.id));
  }, [riskId]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 18, paddingBottom: tabBarHeight + 36 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{explore.title}</Text>
            <Text style={styles.subtitle}>{explore.subtitle}</Text>
          </View>
          <View style={styles.headerDot} />
        </View>

        <Text style={styles.sectionTitle}>{explore.riskLabel}</Text>
        <View style={styles.riskRow}>
          {riskOptions.map((opt) => {
            const active = opt.id === riskId;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setRiskId(opt.id as RiskId)}
                style={({ pressed }) => [styles.riskPill, active && styles.riskPillActive, pressed && { opacity: 0.92 }]}
              >
                <Text style={[styles.riskPillText, active && styles.riskPillTextActive]}>
                  {opt.label}
                </Text>
                <Text style={[styles.riskPillSub, active && styles.riskPillSubActive]}>
                  {opt.subLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{formatRiskLabel(riskId)}</Text>
        <View style={styles.list}>
          {list.map((inst) => {
            const active = inst.id === selected?.id;
            return (
              <Pressable
                key={inst.id}
                onPress={() => setSelectedId(inst.id)}
                style={({ pressed }) => [
                  styles.instrumentCard,
                  active && styles.instrumentCardActive,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <View style={styles.instrumentTop}>
                  <Ionicons
                    name={active ? 'sparkles' : 'document-text-outline'}
                    size={18}
                    color={active ? theme.purple : theme.textSecondary}
                  />
                  <Text style={styles.instrumentName} numberOfLines={1}>
                    {inst.name}
                  </Text>
                </View>
                <Text style={styles.instrumentMeta} numberOfLines={2}>
                  {inst.category}
                </Text>
                <Text style={styles.instrumentRisk}>Risk: {inst.riskLevel}</Text>
              </Pressable>
            );
          })}
        </View>

        {selected ? (
          <View style={styles.details}>
            <Text style={styles.detailsTitle}>{explore.detailsTitle}</Text>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>Historical returns</Text>
              <Text style={styles.detailsVal}>{selected.historicalReturns}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>Standard deviation</Text>
              <Text style={styles.detailsVal}>{selected.standardDeviation}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>Min investment</Text>
              <Text style={styles.detailsVal}>{selected.minInvestment}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>Liquidity</Text>
              <Text style={styles.detailsVal}>{selected.liquidity}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>Ideal horizon</Text>
              <Text style={styles.detailsVal}>{selected.idealHorizon}</Text>
            </View>

            <Text style={styles.detailsBody}>{selected.details}</Text>
            <Text style={styles.noteText}>{explore.riskMismatchNote}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[styles.floatingWrap, { bottom: tabBarHeight + Math.max(insets.bottom, 0) + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.floatingBtn, pressed && { opacity: 0.92 }]}
          onPress={() => {
            router.push('/chatbot' as Href);
          }}>
          <View style={styles.floatingIconWrap}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
          </View>
          <View style={styles.floatingTextWrap}>
            <Text style={styles.floatingTitle}>Ask ArthVeda AI</Text>
            <Text style={styles.floatingSub} numberOfLines={1}>
              {userName ? `Personalised for ${userName}` : 'Personalised guidance'} • {chatbot.title}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.backgroundLavender },
  scroll: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerDot: { width: 12, height: 12, borderRadius: 99, backgroundColor: theme.purple },
  title: { fontSize: 24, fontWeight: '800', color: theme.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  sectionTitle: { marginTop: 18, marginBottom: 10, fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  riskRow: { flexDirection: 'row', gap: 10 },
  riskPill: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  riskPillActive: {
    borderColor: theme.purple,
    backgroundColor: '#F5F3FF',
  },
  riskPillText: { fontSize: 13, fontWeight: '800', color: theme.textSecondary },
  riskPillTextActive: { color: theme.purpleDark },
  riskPillSub: { marginTop: 6, fontSize: 11, fontWeight: '600', color: theme.textMuted },
  riskPillSubActive: { color: theme.purpleDark },
  list: { gap: 10, marginBottom: 18 },
  instrumentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  instrumentCardActive: {
    borderColor: theme.purple,
    backgroundColor: '#F9FAFF',
  },
  instrumentTop: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 6 },
  instrumentName: { flex: 1, fontSize: 15, fontWeight: '800', color: theme.textPrimary },
  instrumentMeta: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  instrumentRisk: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
  details: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  detailsTitle: { fontSize: 16, fontWeight: '900', color: theme.textPrimary, marginBottom: 10 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderLight },
  detailsKey: { flex: 1, fontSize: 13, color: theme.textSecondary, fontWeight: '700', paddingRight: 12 },
  detailsVal: { flex: 1, fontSize: 13, color: theme.textPrimary, fontWeight: '800', textAlign: 'right' },
  detailsBody: { marginTop: 12, fontSize: 13, color: theme.textSecondary, lineHeight: 20 },
  noteText: { marginTop: 10, fontSize: 11, color: theme.textMuted, lineHeight: 16 },
  floatingWrap: {
    position: 'absolute',
    right: 14,
    left: 14,
  },
  floatingBtn: {
    backgroundColor: theme.navyButton,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 9,
  },
  floatingIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTextWrap: { flex: 1 },
  floatingTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  floatingSub: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '700', marginTop: 2 },
});
