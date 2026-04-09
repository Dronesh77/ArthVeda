/**
 * Central copy & config for FinPilot AI.
 * Sync to your admin API / CMS later; the app re-exports this via `frontend/admin/content.ts`.
 */

export const brand = {
  appName: 'ArthVeda',
  tagline: 'Where Investing Meets Intelligence',
  quote: "Don't work for money. Make money work for you.",
  featureChips: ['AI Driven', 'Beginner Friendly', 'Low Cost'] as const,
  personalizeTitle: "Let's personalise your journey",
  personalizeInputPlaceholder: 'Your name',
  startButton: 'Start Investing →',
  trustLine: 'Trusted by 10,000+ smart investors',
} as const;

export const goals = {
  title: "What's your goal?",
  subtitle: 'This helps us optimise your portfolio',
  nextButton: 'Next',
  options: [
    { id: 'safety', label: 'Safety', subLabel: 'capital protection' },
    { id: 'income', label: 'Income', subLabel: 'stable returns' },
    { id: 'growth', label: 'Growth', subLabel: 'wealth creation' },
  ] as const,
} as const;

export const aiPortfolio = {
  screenTitle: 'Your AI Portfolio',
  equityCard: {
    title: 'Equity Funds',
    rows: [
      { key: 'Expected Returns', value: '12-15%' },
      { key: 'Risk Level', value: 'High' },
      { key: 'Min Investment', value: '₹600' },
      { key: 'Volatility (Std)', value: 'High' },
    ],
    why: 'Why this? Longer horizon + high risk enables compounding via equities',
  },
  projectionCard: {
    title: 'Wealth Projection',
    principalLabel: 'Principal',
    principal: '10000',
    rateLabel: 'Rate %',
    rate: '12',
    yearsLabel: 'Years',
    years: '3',
    futureValueLabel: 'Future Value:',
    futureValue: '₹14049',
  },
  goToDashboard: 'Go to Dashboard',
} as const;

export const dashboard = {
  greetingName: 'mayur',
  indices: [
    { id: 'nifty', label: 'NIFTY', value: '22,350', change: '+0.9%', positive: true },
    { id: 'sensex', label: 'SENSEX', value: '73,200', change: '+0.0%', positive: true },
    { id: 'vix', label: 'INDIA VIX', value: '13.2', change: '-2.1%', positive: false },
  ],
  searchPlaceholder: 'Search investments...',
  featuredCard: {
    eyebrow: 'Your AI Portfolio',
    title: 'Equity Funds',
    meta: '12-15% returns • High risk',
  },
  quickActions: [
    { id: 'sip', label: 'SIP' },
    { id: 'goal', label: 'Goal' },
    { id: 'explore', label: 'Explore' },
  ],
  portfolioValueLabel: 'Portfolio Value',
  portfolioValue: '₹1,25,400',
  aiInsightTitle: 'AI Insight',
  aiInsightBody: 'Low VIX → stable markets, good entry opportunity',
} as const;

export const placeholders = {
  searchTitle: 'Search',
  searchBody: 'Search investments (coming soon).',
  portfolioTitle: 'Portfolio',
  portfolioBody: 'Your full portfolio view (coming soon).',
  profileTitle: 'Profile',
  profileBody: 'Account & settings (coming soon).',
} as const;

export const theme = {
  backgroundLavender: '#F3F1FA',
  backgroundGrey: '#F2F2F7',
  cardWhite: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  navyButton: '#151B33',
  purple: '#6D28D9',
  purpleDark: '#4C1D95',
  borderLight: '#E5E7EB',
  positive: '#16A34A',
  negative: '#DC2626',
  chipBg: '#EDE9FE',
} as const;

export const riskProfiles = {
  safety: {
    label: 'Safety',
    subLabel: 'capital protection',
    helper: 'Designed for shorter horizon + lower volatility.',
  },
  income: {
    label: 'Income',
    subLabel: 'stable returns',
    helper: 'Designed for regular returns with moderate risk.',
  },
  growth: {
    label: 'Growth',
    subLabel: 'wealth creation',
    helper: 'Designed for longer horizon + higher upside potential.',
  },
} as const;

export const instruments = {
  safety: [
    {
      id: 'fd',
      name: 'Fixed Deposit (FD)',
      category: 'Banking • Capital protection',
      historicalReturns: '6.5% - 8.0% (approx.)',
      standardDeviation: 'Low',
      minInvestment: '₹5,000',
      liquidity: 'Medium (penalty if early exit)',
      riskLevel: 'Low',
      idealHorizon: '3 - 12 months',
      details:
        'Suitable for emergency buffer and predictable returns. Not ideal for very long horizons.',
    },
    {
      id: 'liquid',
      name: 'Liquid Fund',
      category: 'Mutual Funds • Liquidity',
      historicalReturns: '4.0% - 6.5% (approx.)',
      standardDeviation: 'Low',
      minInvestment: '₹500',
      liquidity: 'High (near-term)',
      riskLevel: 'Low - Medium',
      idealHorizon: '1 - 6 months',
      details:
        'Good for parking money temporarily with reasonable stability. Returns can vary with rate cycles.',
    },
  ],
  income: [
    {
      id: 'ultra_short',
      name: 'Ultra Short Duration Debt',
      category: 'Mutual Funds • Short duration',
      historicalReturns: '6.0% - 8.5% (approx.)',
      standardDeviation: 'Medium',
      minInvestment: '₹1,000',
      liquidity: 'Medium - High',
      riskLevel: 'Medium',
      idealHorizon: '6 months - 2 years',
      details:
        'Balances stability with slightly higher returns. Best when you can hold through minor fluctuations.',
    },
    {
      id: 'conservative_hybrid',
      name: 'Conservative Hybrid Fund',
      category: 'Mutual Funds • Moderate risk',
      historicalReturns: '7.0% - 10.0% (approx.)',
      standardDeviation: 'Medium - High',
      minInvestment: '₹1,000',
      liquidity: 'Medium',
      riskLevel: 'Medium - High',
      idealHorizon: '1 - 3 years',
      details:
        'Mixes debt stability with equity participation for growth. Returns depend on market and rates.',
    },
  ],
  growth: [
    {
      id: 'index_equity',
      name: 'Index Equity Fund',
      category: 'Mutual Funds • Equity',
      historicalReturns: '10% - 14% (approx.)',
      standardDeviation: 'High',
      minInvestment: '₹500',
      liquidity: 'High',
      riskLevel: 'High',
      idealHorizon: '3 - 5+ years',
      details:
        'Potential for long-term compounding. Short-term volatility can be significant.',
    },
    {
      id: 'flexi_equity',
      name: 'Flexi Cap Equity Fund',
      category: 'Mutual Funds • Equity',
      historicalReturns: '10% - 16% (approx.)',
      standardDeviation: 'High',
      minInvestment: '₹500',
      liquidity: 'High',
      riskLevel: 'High',
      idealHorizon: '3 - 5+ years',
      details:
        'More diversified equity exposure. Suitable when the investor can stay invested during drawdowns.',
    },
  ],
} as const;

export const explore = {
  title: 'Explore instruments',
  subtitle: 'Pick your risk appetite. We’ll recommend suitable categories.',
  riskLabel: 'Your risk profile',
  personaliseBarLabel: 'Personalise your investment',
  detailsTitle: 'Instrument details',
  riskMismatchNote:
    'For demo purposes we recommend by risk profile. Always verify suitability with a professional.',
} as const;

export const chatbot = {
  title: 'ArthVeda AI Chat',
  introPrefix: 'Hi',
  disclaimer:
    'Educational recommendations only. Not financial advice. Suggestions are generated from hard-coded demo data.',
  questions: {
    risk: {
      id: 'risk',
      label: 'What is your risk appetite?',
      options: [
        { id: 'safety', label: 'Safety' },
        { id: 'income', label: 'Income' },
        { id: 'growth', label: 'Growth' },
      ] as const,
    },
    horizon: {
      id: 'horizon',
      label: 'What is your investment horizon?',
      options: [
        { id: 'short', label: 'Short (0-12 months)' },
        { id: 'mid', label: 'Intermediate (1-3 years)' },
        { id: 'long', label: 'Long (3-5+ years)' },
      ] as const,
    },
    surplus: {
      id: 'surplus',
      label: 'How much can you invest each month? (approx.)',
      placeholder: 'e.g., 5000',
    },
    tax: {
      id: 'tax',
      label: 'Do you prefer tax-saving options?',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ] as const,
    },
  },
  recommendationLabels: {
    topPicks: 'Personalised picks for you',
    nextSteps: 'Next steps',
  },
} as const;
