import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatbot, goals, instruments, riskProfiles, theme } from '@/admin/content';
import { useAuth } from '@/context/auth-context';
import { useJourney } from '@/context/journey-context';
import { postJsonAuth } from '@/lib/api';

type RiskId = (typeof goals.options)[number]['id'];
type HorizonId = 'short' | 'mid' | 'long';
type TaxId = 'yes' | 'no';

type UiMessage = { id: string; from: 'bot' | 'user'; text: string };
type HistoryMessage = { role: 'user' | 'assistant'; content: string };

function uid() {
  return Math.random().toString(16).slice(2);
}

function horizonMatchesIdeal(horizon: HorizonId, ideal: string) {
  const lower = ideal.toLowerCase();
  if (horizon === 'short') return lower.includes('month');
  if (horizon === 'mid') return lower.includes('year') || lower.includes('month');
  return ideal.includes('3') && ideal.includes('5');
}

function getFriendlyAiErrorMessage(raw: string) {
  const msg = raw.toLowerCase();
  if (
    msg.includes('nodename nor servname') ||
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('timeout')
  ) {
    return 'We are unable to reach the AI service right now due to a network issue. Please check your internet and try again.';
  }
  if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota')) {
    return 'The AI service is currently busy. Please try again in a minute.';
  }
  return 'AI suggestions are temporarily unavailable. Please try again shortly.';
}

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const { user } = useAuth();
  const {
    userName,
    goalId,
    riskId: savedRiskId,
    setRiskId: setSavedRiskId,
    horizonId: savedHorizonId,
    setHorizonId: setSavedHorizonId,
    monthlySurplus,
    setMonthlySurplus,
    taxPreference,
    setTaxPreference,
  } = useJourney();

  const [step, setStep] = useState(0);
  const [chatReady, setChatReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');

  const [riskId, setRiskId] = useState<RiskId>(savedRiskId);
  const [horizonId, setHorizonId] = useState<HorizonId>(savedHorizonId);
  const [surplus, setSurplus] = useState(monthlySurplus || '5000');
  const [taxId, setTaxId] = useState<TaxId>(taxPreference);

  const [uiMessages, setUiMessages] = useState<UiMessage[]>([
    { id: uid(), from: 'bot', text: `${chatbot.introPrefix} ${userName || 'there'}! ${chatbot.disclaimer}` },
    { id: uid(), from: 'bot', text: chatbot.questions.risk.label },
  ]);
  const [history, setHistory] = useState<HistoryMessage[]>([]);

  const riskOptions = chatbot.questions.risk.options;
  const horizonOptions = chatbot.questions.horizon.options;
  const taxOptions = chatbot.questions.tax.options;
  const surplusNum = useMemo(() => Number(surplus.replace(/[^\d]/g, '')) || 0, [surplus]);

  const eligible = useMemo(() => {
    const all = instruments[riskId];
    const filtered = all.filter((i) => horizonMatchesIdeal(horizonId, i.idealHorizon));
    return filtered.length ? filtered : all;
  }, [riskId, horizonId]);

  function pushUi(from: 'bot' | 'user', text: string) {
    setUiMessages((prev) => [...prev, { id: uid(), from, text }]);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  function pushHistory(role: 'user' | 'assistant', content: string) {
    setHistory((prev) => [...prev, { role, content }]);
  }

  async function askAi(userPrompt: string) {
    if (!user) {
      pushUi('bot', 'Please log in again to continue chatting.');
      return;
    }
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const nextHistory = [...history, { role: 'user' as const, content: userPrompt }].slice(-12);
      const res = await postJsonAuth<{ message: string }>(
        '/chat',
        {
          messages: nextHistory,
          context: {
            userName,
            goalId,
            riskId,
            horizonId,
            monthlySurplus: surplusNum ? String(surplusNum) : surplus,
            taxPreference: taxId,
            instruments: eligible.map((i) => ({
              name: i.name,
              category: i.category,
              historicalReturns: i.historicalReturns,
              standardDeviation: i.standardDeviation,
              minInvestment: i.minInvestment,
              liquidity: i.liquidity,
              riskLevel: i.riskLevel,
              idealHorizon: i.idealHorizon,
            })),
          },
        },
        token,
      );
      setHistory((prev) =>
        [
          ...prev,
          { role: 'user' as const, content: userPrompt },
          { role: 'assistant' as const, content: res.message },
        ].slice(-16),
      );
      pushUi('bot', res.message);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushUi('bot', getFriendlyAiErrorMessage(msg));
    } finally {
      setBusy(false);
    }
  }

  function onPickRisk(next: RiskId) {
    setRiskId(next);
    setSavedRiskId(next);
    pushUi('user', riskProfiles[next].label);
    setStep(1);
    pushUi('bot', chatbot.questions.horizon.label);
  }

  function onPickHorizon(next: HorizonId) {
    setHorizonId(next);
    setSavedHorizonId(next);
    pushUi('user', horizonOptions.find((o) => o.id === next)?.label ?? next);
    setStep(2);
    pushUi('bot', chatbot.questions.surplus.label);
  }

  function submitSurplus() {
    setMonthlySurplus(surplus);
    pushUi('user', `₹${surplus || '0'} / month`);
    setStep(3);
    pushUi('bot', chatbot.questions.tax.label);
  }

  function onPickTax(next: TaxId) {
    setTaxId(next);
    setTaxPreference(next);
    pushUi('user', taxOptions.find((o) => o.id === next)?.label ?? next);
    setStep(4);
    setChatReady(true);
    pushUi('bot', 'Great. I now have your preferences. Ask me anything about your portfolio, SIP, risk, or next action.');
    void askAi('Give me a personalised portfolio suggestion based on my profile and explain the rationale simply.');
  }

  async function sendFreeText() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    pushUi('user', text);
    await askAi(text);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.title}>{chatbot.title}</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.chat,
          { paddingBottom: (chatReady ? 84 : 24) + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}>
        {uiMessages.map((m) => (
          <View key={m.id} style={[styles.msgRow, m.from === 'user' ? styles.msgRowUser : styles.msgRowBot]}>
            <View style={[styles.bubble, m.from === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
              <Text style={[styles.bubbleText, m.from === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot]}>
                {m.text}
              </Text>
            </View>
          </View>
        ))}

        {busy ? (
          <View style={[styles.msgRow, styles.msgRowBot]}>
            <View style={[styles.bubble, styles.bubbleBot]}>
              <Text style={[styles.bubbleText, styles.bubbleTextBot]}>Thinking…</Text>
            </View>
          </View>
        ) : null}

        {step === 0 ? (
          <View style={styles.choiceGrid}>
            {riskOptions.map((opt) => (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [styles.choice, pressed && { opacity: 0.92 }]}
                onPress={() => onPickRisk(opt.id as RiskId)}>
                <Text style={styles.choiceText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.choiceGrid}>
            {horizonOptions.map((opt) => (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [styles.choice, pressed && { opacity: 0.92 }]}
                onPress={() => onPickHorizon(opt.id as HorizonId)}>
                <Text style={styles.choiceText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.surplusWrap}>
            <Text style={styles.inputLabel}>{chatbot.questions.surplus.placeholder}</Text>
            <TextInput
              style={styles.input}
              value={surplus}
              keyboardType="numeric"
              onChangeText={setSurplus}
            />
            <Pressable style={styles.primaryBtn} onPress={submitSurplus}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.choiceGrid}>
            {taxOptions.map((opt) => (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [styles.choice, pressed && { opacity: 0.92 }]}
                onPress={() => onPickTax(opt.id as TaxId)}>
                <Text style={styles.choiceText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {chatReady ? (
        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.composerRow}>
            <TextInput
              style={styles.composerInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask follow-up: e.g., should I increase SIP by ₹2,000?"
              placeholderTextColor={theme.textMuted}
              editable={!busy}
              onSubmitEditing={() => {
                void sendFreeText();
              }}
              returnKeyType="send"
            />
            <Pressable
              style={({ pressed }) => [styles.sendBtn, (pressed || busy) && { opacity: 0.9 }]}
              onPress={() => {
                void sendFreeText();
              }}
              disabled={busy}>
              <Ionicons name="send" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.backgroundLavender },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: theme.backgroundLavender,
  },
  backBtn: { padding: 6 },
  topTitleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: theme.textPrimary },
  chat: { paddingHorizontal: 14, paddingTop: 10 },
  msgRow: { flexDirection: 'row', marginBottom: 10 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '84%', borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: theme.purple, alignSelf: 'flex-end' },
  bubbleBot: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.borderLight },
  bubbleText: { fontSize: 13, fontWeight: '700' },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot: { color: theme.textPrimary },
  choiceGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 10 },
  choice: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  choiceText: { fontSize: 13, fontWeight: '800', color: theme.textPrimary },
  surplusWrap: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  inputLabel: { fontSize: 13, fontWeight: '800', color: theme.textSecondary, marginBottom: 8 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: theme.navyButton,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  composerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(243,241,250,0.98)',
  },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composerInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: theme.textPrimary,
    fontWeight: '700',
  },
  sendBtn: {
    backgroundColor: theme.navyButton,
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
