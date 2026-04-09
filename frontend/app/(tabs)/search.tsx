import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goals, instruments, theme } from '@/admin/content';
import { useAuth } from '@/context/auth-context';
import { useJourney } from '@/context/journey-context';
import { getJsonAuth, postJsonAuth } from '@/lib/api';

type RiskId = (typeof goals.options)[number]['id'];
type Instrument = (typeof instruments)[RiskId][number];
type PlanItem = {
  instrumentId: string;
};
type PortfolioPlanResponse = {
  items: PlanItem[];
};

const flatInstruments: Array<Instrument & { riskId: RiskId }> = (
  Object.keys(instruments) as RiskId[]
).flatMap((riskId) => instruments[riskId].map((inst) => ({ ...inst, riskId })));

export default function SearchTab() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const { riskId: userRiskId } = useJourney();

  const [query, setQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<RiskId | 'all'>('all');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>(flatInstruments[0]?.id ?? '');
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setPlanIds([]);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await getJsonAuth<PortfolioPlanResponse>('/me/portfolio-plan', token);
        setPlanIds(res.items.map((x) => x.instrumentId));
      } catch {
        // ignore load failures, user can still browse
      }
    };
    void run();
  }, [user]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return flatInstruments.filter((item) => {
      if (filterRisk !== 'all' && item.riskId !== filterRisk) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.riskLevel.toLowerCase().includes(q)
      );
    });
  }, [query, filterRisk]);

  const selected = results.find((item) => item.id === selectedId) || results[0];

  const toggleWatch = (id: string) => {
    setWatchlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addToPortfolioPlan = async () => {
    if (!user || !selected) return;
    try {
      setSavingPlan(true);
      setMessage('');
      const token = await user.getIdToken();
      await postJsonAuth(
        '/me/portfolio-plan',
        {
          instrumentId: selected.id,
          name: selected.name,
          category: selected.category,
          riskLevel: selected.riskLevel,
          historicalReturns: selected.historicalReturns,
          minInvestment: selected.minInvestment,
          liquidity: selected.liquidity,
          idealHorizon: selected.idealHorizon,
          details: selected.details,
          riskId: userRiskId,
        },
        token,
      );
      setPlanIds((prev) => (prev.includes(selected.id) ? prev : [...prev, selected.id]));
      setMessage('Added to your portfolio plan.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(`Unable to add to plan: ${msg}`);
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 18, paddingBottom: tabBarHeight + 24 },
      ]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Discover Funds</Text>
      <Text style={styles.subtitle}>Compare options and build your watchlist.</Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by fund name, category, risk..."
          placeholderTextColor={theme.textMuted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        <Pressable
          onPress={() => setFilterRisk('all')}
          style={[styles.chip, filterRisk === 'all' && styles.chipActive]}>
          <Text style={[styles.chipText, filterRisk === 'all' && styles.chipTextActive]}>All</Text>
        </Pressable>
        {goals.options.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => setFilterRisk(g.id)}
            style={[styles.chip, filterRisk === g.id && styles.chipActive]}>
            <Text style={[styles.chipText, filterRisk === g.id && styles.chipTextActive]}>
              {g.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>{results.length} instruments found</Text>
        <Text style={styles.summaryText}>Watchlist: {watchlist.length}</Text>
      </View>

      {results.map((item) => {
        const active = selected?.id === item.id;
        const preferred = item.riskId === userRiskId;
        const inWatch = watchlist.includes(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => setSelectedId(item.id)}
            style={[styles.rowCard, active && styles.rowCardActive]}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Pressable
                hitSlop={10}
                onPress={() => toggleWatch(item.id)}
                style={styles.watchBtn}>
                <Ionicons
                  name={inWatch ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={inWatch ? '#2563EB' : theme.textSecondary}
                />
              </Pressable>
            </View>
            <Text style={styles.rowMeta}>{item.category}</Text>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>Risk: {item.riskLevel}</Text>
              <Text style={styles.tag}>Returns: {item.historicalReturns}</Text>
              {preferred ? <Text style={[styles.tag, styles.goodTag]}>Matches your profile</Text> : null}
            </View>
          </Pressable>
        );
      })}

      {selected ? (
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>Instrument Summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.key}>Historical Returns</Text>
            <Text style={styles.val}>{selected.historicalReturns}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.key}>Min Investment</Text>
            <Text style={styles.val}>{selected.minInvestment}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.key}>Liquidity</Text>
            <Text style={styles.val}>{selected.liquidity}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.key}>Ideal Horizon</Text>
            <Text style={styles.val}>{selected.idealHorizon}</Text>
          </View>
          <Text style={styles.body}>{selected.details}</Text>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
            onPress={() => {
              void addToPortfolioPlan();
            }}
            disabled={savingPlan}>
            <Text style={styles.ctaText}>
              {savingPlan
                ? 'Saving...'
                : planIds.includes(selected.id)
                  ? 'Already in Portfolio Plan'
                  : 'Add to Portfolio Plan'}
            </Text>
          </Pressable>
          {message ? <Text style={styles.msg}>{message}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.backgroundGrey },
  scroll: { paddingHorizontal: 18 },
  title: { fontSize: 24, fontWeight: '900', color: theme.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: theme.textSecondary, marginBottom: 14, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.textPrimary, paddingVertical: 12, marginLeft: 8 },
  chipsRow: { gap: 8, paddingBottom: 6 },
  chip: {
    borderRadius: 99,
    borderWidth: 1,
    borderColor: theme.borderLight,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  chipText: { fontSize: 12, fontWeight: '800', color: theme.textSecondary },
  chipTextActive: { color: '#1E3A8A' },
  summary: { marginTop: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  summaryText: { fontSize: 12, color: theme.textMuted, fontWeight: '700' },
  rowCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  rowCardActive: { borderColor: '#93C5FD', backgroundColor: '#F8FAFF' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { flex: 1, fontSize: 14, color: theme.textPrimary, fontWeight: '900', paddingRight: 8 },
  watchBtn: { padding: 6 },
  rowMeta: { marginTop: 4, fontSize: 12, color: theme.textSecondary, fontWeight: '700' },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '700',
  },
  goodTag: { backgroundColor: '#DCFCE7', color: '#166534' },
  details: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 14,
  },
  detailsTitle: { fontSize: 15, fontWeight: '900', color: theme.textPrimary, marginBottom: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.borderLight,
  },
  key: { fontSize: 13, color: theme.textSecondary, fontWeight: '700', flex: 1, paddingRight: 8 },
  val: { fontSize: 13, color: theme.textPrimary, fontWeight: '900', flex: 1, textAlign: 'right' },
  body: { marginTop: 10, fontSize: 12, color: theme.textSecondary, lineHeight: 18, fontWeight: '600' },
  cta: {
    marginTop: 12,
    backgroundColor: theme.navyButton,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  msg: { marginTop: 8, fontSize: 12, color: theme.textSecondary, fontWeight: '700' },
});
