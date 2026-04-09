import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goals, riskProfiles, theme } from '@/admin/content';
import { useAuth } from '@/context/auth-context';
import { useJourney } from '@/context/journey-context';
import { getJsonAuth, postJsonAuth } from '@/lib/api';

type TxType = 'sip' | 'buy' | 'sell' | 'dividend' | 'fee';

type LedgerTx = {
  id: string;
  date: string;
  type: TxType;
  instrument: string;
  amount: number;
  note?: string | null;
  createdAt?: string;
  pending?: boolean;
};

type TransactionsResponse = { transactions: LedgerTx[] };

const TX_TYPES: TxType[] = ['sip', 'buy', 'sell', 'dividend', 'fee'];
const rupee = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short' });

function formatInr(value: number) {
  const abs = rupee.format(Math.round(Math.abs(value)));
  return `${value < 0 ? '-' : ''}₹${abs}`;
}

function parseAmount(value: string) {
  const n = Number((value || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 5000;
}

function txSignedAmount(tx: LedgerTx) {
  if (tx.type === 'sell' || tx.type === 'dividend') return tx.amount;
  if (tx.type === 'fee') return -tx.amount;
  return tx.amount;
}

function buildSeedLedger(monthly: number) {
  const now = new Date();
  const mk = (monthsAgo: number, type: TxType, instrument: string, amount: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 7 + (monthsAgo % 10));
    return {
      date: d.toISOString().slice(0, 10),
      type,
      instrument,
      amount,
    };
  };
  return [
    mk(8, 'buy', 'Nifty 50 Index Fund', monthly * 2.5),
    mk(7, 'sip', 'Nifty 50 Index Fund', monthly),
    mk(6, 'sip', 'Flexi Cap Fund', monthly),
    mk(5, 'buy', 'Short Duration Debt Fund', monthly * 1.6),
    mk(4, 'dividend', 'Nifty 50 Index Fund', Math.max(300, monthly * 0.08)),
    mk(3, 'sip', 'Flexi Cap Fund', monthly),
    mk(2, 'fee', 'Platform Fees', Math.max(80, monthly * 0.02)),
    mk(1, 'sip', 'Nifty 50 Index Fund', monthly),
  ];
}

function buildHistory(transactions: LedgerTx[], riskId: 'safety' | 'income' | 'growth') {
  const monthlyReturn = riskId === 'safety' ? 0.005 : riskId === 'income' ? 0.008 : 0.011;
  const months: Array<{ key: string; label: string; invested: number; value: number }> = [];
  const now = new Date();
  let invested = 0;
  let value = 0;

  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = monthFmt.format(d);

    const monthFlows = transactions
      .filter((tx) => {
        const td = new Date(tx.date);
        return td.getFullYear() === y && td.getMonth() === m;
      })
      .reduce((acc, tx) => acc + txSignedAmount(tx), 0);

    invested = Math.max(0, invested + monthFlows);
    const shock = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.002;
    value = Math.max(0, value * (1 + monthlyReturn + shock) + monthFlows);

    months.push({ key: `${y}-${m}`, label, invested, value });
  }

  return months;
}

export default function PortfolioTab() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const { userName, goalId, riskId, horizonId, monthlySurplus } = useJourney();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<LedgerTx[]>([]);
  const [filter, setFilter] = useState<'all' | TxType>('all');

  const [newType, setNewType] = useState<TxType>('sip');
  const [newInstrument, setNewInstrument] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newNote, setNewNote] = useState('');
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(11);

  const monthly = parseAmount(monthlySurplus);
  const investorName = userName.trim() || user?.displayName?.trim() || 'Investor';
  const goalLabel = goals.options.find((g) => g.id === goalId)?.label || goalId;
  const goalTarget = goalId === 'safety' ? 300000 : goalId === 'income' ? 650000 : 1200000;
  const years = horizonId === 'short' ? 1 : horizonId === 'mid' ? 3 : 7;

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const token = await user.getIdToken();
        const res = await getJsonAuth<TransactionsResponse>('/me/transactions', token);
        if (res.transactions.length > 0) {
          setTransactions(res.transactions);
          return;
        }

        const seed = buildSeedLedger(monthly);
        const seeded = await postJsonAuth<TransactionsResponse>(
          '/me/transactions/bulk',
          { transactions: seed },
          token,
        );
        setTransactions(seeded.transactions);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`Unable to load transactions: ${msg}`);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user, monthly]);

  const history = useMemo(() => buildHistory(transactions, riskId), [transactions, riskId]);
  const latest = history[history.length - 1];
  const portfolioValue = latest?.value || 0;
  const invested = latest?.invested || 0;
  const pnl = portfolioValue - invested;
  const goalProgress = Math.min(100, Math.round((portfolioValue / goalTarget) * 100));

  const maxSeries = Math.max(1, ...history.map((h) => Math.max(h.invested, h.value)));
  const selectedPoint = history[Math.min(selectedHistoryIndex, history.length - 1)] ?? history[history.length - 1];

  useEffect(() => {
    setSelectedHistoryIndex(Math.max(0, history.length - 1));
  }, [history.length]);

  const filteredLedger = useMemo(
    () =>
      [...transactions]
        .filter((tx) => (filter === 'all' ? true : tx.type === filter))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions, filter],
  );

  const syncPending = async () => {
    if (!user) return;
    const pending = transactions.filter((tx) => tx.pending);
    if (!pending.length) return;
    try {
      const token = await user.getIdToken();
      for (const tx of pending) {
        const created = await postJsonAuth<LedgerTx>(
          '/me/transactions',
          {
            date: tx.date,
            type: tx.type,
            instrument: tx.instrument,
            amount: tx.amount,
            note: tx.note || null,
          },
          token,
        );
        setTransactions((prev) => prev.map((item) => (item.id === tx.id ? created : item)));
      }
      setError('');
    } catch {
      // keep pending items for next retry
    }
  };

  const addTransaction = async () => {
    if (!user) return;
    const instrument = newInstrument.trim();
    const amount = parseAmount(newAmount);
    if (!instrument || !newDate) {
      setError('Please fill instrument and date.');
      return;
    }

    const optimisticId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic: LedgerTx = {
      id: optimisticId,
      date: newDate,
      type: newType,
      instrument,
      amount,
      note: newNote.trim() || null,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setTransactions((prev) => [optimistic, ...prev]);
    const txDate = new Date(newDate);
    const txMonth = txDate.getMonth();
    const idx = history.findIndex((h) => {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth() - (history.length - 1 - history.indexOf(h)), 1);
      return d.getMonth() === txMonth;
    });
    if (idx >= 0) setSelectedHistoryIndex(idx);

    setNewInstrument('');
    setNewAmount('');
    setNewNote('');

    try {
      setSaving(true);
      setError('');
      const token = await user.getIdToken();
      const created = await postJsonAuth<LedgerTx>(
        '/me/transactions',
        {
          date: optimistic.date,
          type: optimistic.type,
          instrument: optimistic.instrument,
          amount: optimistic.amount,
          note: optimistic.note || null,
        },
        token,
      );
      setTransactions((prev) => prev.map((item) => (item.id === optimisticId ? created : item)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTransactions((prev) => prev.map((item) => (item.id === optimisticId ? { ...item, pending: true } : item)));
      setError(`Saved locally. Sync pending (${msg}).`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 18, paddingBottom: tabBarHeight + 30 },
      ]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Portfolio Planner</Text>
      <Text style={styles.subtitle}>
        {investorName} • {riskProfiles[riskId].label} profile • {years}-year horizon
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Net Worth Snapshot</Text>
        <Text style={styles.bigValue}>{formatInr(portfolioValue)}</Text>
        <View style={styles.split}>
          <View style={styles.splitBlock}>
            <Text style={styles.key}>Invested</Text>
            <Text style={styles.val}>{formatInr(invested)}</Text>
          </View>
          <View style={styles.splitBlock}>
            <Text style={styles.key}>P&L</Text>
            <Text style={[styles.val, pnl >= 0 ? styles.positive : styles.negative]}>
              {formatInr(pnl)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portfolio History (12M)</Text>
        <View style={styles.chartMeta}>
          <Text style={styles.chartMetaText}>
            {selectedPoint?.label}: Invested {formatInr(selectedPoint?.invested || 0)}
          </Text>
          <Text style={styles.chartMetaTextStrong}>Value {formatInr(selectedPoint?.value || 0)}</Text>
        </View>
        <View style={styles.chartArea}>
          <View style={styles.chartBarsRow}>
            {history.map((point, index) => {
              const investedHeight = Math.max(4, Math.min(126, (point.invested / maxSeries) * 126));
              const valueHeight = Math.max(4, Math.min(126, (point.value / maxSeries) * 126));
              const active = index === selectedHistoryIndex;
              return (
                <Pressable
                  key={point.key}
                  onPress={() => setSelectedHistoryIndex(index)}
                  style={styles.barCluster}>
                  <View style={[styles.bar, styles.barInvested, { height: investedHeight, opacity: active ? 1 : 0.7 }]} />
                  <View style={[styles.bar, styles.barValue, { height: valueHeight, opacity: active ? 1 : 0.75 }]} />
                  <Text style={active ? styles.barLabelActive : styles.barLabel}>
                    {point.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#94A3B8' }]} />
            <Text style={styles.legendText}>Invested</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#1D4ED8' }]} />
            <Text style={styles.legendText}>Portfolio Value</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Goal Progress</Text>
        <View style={styles.progressHead}>
          <Text style={styles.key}>{goalLabel} target</Text>
          <Text style={styles.val}>{formatInr(goalTarget)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${goalProgress}%` }]} />
        </View>
        <Text style={styles.note}>{goalProgress}% completed against your selected goal.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Transaction</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {TX_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setNewType(t)}
              style={[styles.typePill, newType === t && styles.typePillActive]}>
              <Text style={[styles.typeText, newType === t && styles.typeTextActive]}>
                {t.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput
          style={styles.input}
          value={newInstrument}
          onChangeText={setNewInstrument}
          placeholder="Instrument / Category"
          placeholderTextColor={theme.textMuted}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={newAmount}
            onChangeText={setNewAmount}
            placeholder="Amount"
            keyboardType="numeric"
            placeholderTextColor={theme.textMuted}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={newDate}
            onChangeText={setNewDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <TextInput
          style={styles.input}
          value={newNote}
          onChangeText={setNewNote}
          placeholder="Notes (optional)"
          placeholderTextColor={theme.textMuted}
        />
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
          onPress={() => {
            void addTransaction();
          }}
          disabled={saving}>
          <Text style={styles.ctaText}>{saving ? 'Saving...' : 'Add Entry'}</Text>
        </Pressable>
        {transactions.some((t) => t.pending) ? (
          <Pressable style={styles.retryBtn} onPress={() => void syncPending()}>
            <Text style={styles.retryText}>Retry Sync Pending Entries</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.card}>
        <View style={styles.ledgerHead}>
          <Text style={styles.cardTitle}>Transaction Ledger</Text>
          <Text style={styles.mini}>{loading ? 'Loading...' : `${filteredLedger.length} records`}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          <Pressable
            onPress={() => setFilter('all')}
            style={[styles.typePill, filter === 'all' && styles.typePillActive]}>
            <Text style={[styles.typeText, filter === 'all' && styles.typeTextActive]}>ALL</Text>
          </Pressable>
          {TX_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setFilter(t)}
              style={[styles.typePill, filter === t && styles.typePillActive]}>
              <Text style={[styles.typeText, filter === t && styles.typeTextActive]}>
                {t.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filteredLedger.length === 0 ? (
          <Text style={styles.empty}>No transactions for this filter.</Text>
        ) : (
          filteredLedger.map((tx) => {
            const signed = txSignedAmount(tx);
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Text style={styles.txTitle}>{tx.instrument}</Text>
                  <Text style={styles.txMeta}>
                    {tx.type.toUpperCase()} • {tx.date}
                  </Text>
                  {tx.pending ? <Text style={styles.pendingText}>Pending sync</Text> : null}
                  {tx.note ? <Text style={styles.txNote}>{tx.note}</Text> : null}
                </View>
                <Text style={[styles.txAmount, signed >= 0 ? styles.positive : styles.negative]}>
                  {signed >= 0 ? '+' : ''}
                  {formatInr(signed)}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.backgroundGrey },
  scroll: { paddingHorizontal: 18 },
  title: { fontSize: 24, fontWeight: '900', color: theme.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 13, color: theme.textSecondary, marginBottom: 14, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: theme.textPrimary, marginBottom: 12 },
  bigValue: { fontSize: 30, fontWeight: '900', color: theme.textPrimary, marginBottom: 10 },
  split: { flexDirection: 'row', gap: 10 },
  splitBlock: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 10,
  },
  key: { fontSize: 13, color: theme.textSecondary, fontWeight: '700' },
  val: { fontSize: 14, color: theme.textPrimary, fontWeight: '900' },
  positive: { color: '#16A34A' },
  negative: { color: '#DC2626' },
  chartArea: {
    height: 168,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
    paddingTop: 10,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    flex: 1,
  },
  chartMeta: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartMetaText: { fontSize: 12, color: theme.textSecondary, fontWeight: '700' },
  chartMetaTextStrong: { fontSize: 12, color: theme.textPrimary, fontWeight: '900' },
  barCluster: { width: 22, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 7, borderRadius: 6, marginHorizontal: 1 },
  barInvested: { backgroundColor: '#94A3B8' },
  barValue: { backgroundColor: '#1D4ED8' },
  barLabel: { fontSize: 10, color: theme.textMuted, marginTop: 6, fontWeight: '700' },
  barLabelActive: { fontSize: 10, color: theme.textPrimary, marginTop: 6, fontWeight: '900' },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, color: theme.textSecondary, fontWeight: '700' },
  dot: { width: 9, height: 9, borderRadius: 99 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTrack: { height: 10, borderRadius: 99, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: '#16A34A', borderRadius: 99 },
  note: { marginTop: 8, fontSize: 12, color: theme.textMuted, fontWeight: '700' },
  typeRow: { gap: 8, paddingBottom: 6 },
  typePill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  typePillActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  typeText: { fontSize: 11, fontWeight: '800', color: theme.textSecondary },
  typeTextActive: { color: '#1E3A8A' },
  input: {
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.textPrimary,
    marginBottom: 8,
  },
  inputRow: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  cta: {
    marginTop: 4,
    backgroundColor: theme.navyButton,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  retryBtn: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    paddingVertical: 10,
  },
  retryText: { color: '#1E3A8A', fontSize: 12, fontWeight: '900' },
  error: { marginTop: 8, fontSize: 12, color: '#B91C1C', fontWeight: '700' },
  ledgerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mini: { fontSize: 11, color: theme.textMuted, fontWeight: '700' },
  empty: { fontSize: 12, color: theme.textMuted, fontWeight: '700', marginTop: 8 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.borderLight,
    gap: 10,
  },
  txLeft: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: '900', color: theme.textPrimary },
  txMeta: { marginTop: 3, fontSize: 11, color: theme.textSecondary, fontWeight: '700' },
  pendingText: { marginTop: 4, fontSize: 11, color: '#B45309', fontWeight: '800' },
  txNote: { marginTop: 4, fontSize: 11, color: theme.textMuted, fontWeight: '600' },
  txAmount: { fontSize: 13, fontWeight: '900' },
});
