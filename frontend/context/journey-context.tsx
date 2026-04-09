import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { getJsonAuth, putJsonAuth } from '@/lib/api';

type JourneyContextValue = {
  userName: string;
  setUserName: (name: string) => void;
  goalId: string;
  setGoalId: (id: string) => void;
  riskId: 'safety' | 'income' | 'growth';
  setRiskId: (id: 'safety' | 'income' | 'growth') => void;
  horizonId: 'short' | 'mid' | 'long';
  setHorizonId: (id: 'short' | 'mid' | 'long') => void;
  monthlySurplus: string;
  setMonthlySurplus: (value: string) => void;
  taxPreference: 'yes' | 'no';
  setTaxPreference: (value: 'yes' | 'no') => void;
};

const JourneyContext = createContext<JourneyContextValue | null>(null);

type JourneyProfileResponse = {
  profile: {
    userName?: string | null;
    goalId?: string | null;
    riskId?: 'safety' | 'income' | 'growth' | null;
    horizonId?: 'short' | 'mid' | 'long' | null;
    monthlySurplus?: string | null;
    taxPreference?: 'yes' | 'no' | null;
  } | null;
};

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [goalId, setGoalId] = useState('growth');
  const [riskId, setRiskId] = useState<'safety' | 'income' | 'growth'>('income');
  const [horizonId, setHorizonId] = useState<'short' | 'mid' | 'long'>('mid');
  const [monthlySurplus, setMonthlySurplus] = useState('5000');
  const [taxPreference, setTaxPreference] = useState<'yes' | 'no'>('no');
  const hydratedRef = useRef(false);

  const deriveFallbackName = (email: string | null | undefined) => {
    if (!email) return '';
    const local = email.split('@')[0] || '';
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  };

  const value = useMemo(
    () => ({
      userName,
      setUserName,
      goalId,
      setGoalId,
      riskId,
      setRiskId,
      horizonId,
      setHorizonId,
      monthlySurplus,
      setMonthlySurplus,
      taxPreference,
      setTaxPreference,
    }),
    [userName, goalId, riskId, horizonId, monthlySurplus, taxPreference],
  );

  useEffect(() => {
    const run = async () => {
      hydratedRef.current = false;
      if (!user) {
        setUserName('');
        setGoalId('growth');
        setRiskId('income');
        setHorizonId('mid');
        setMonthlySurplus('5000');
        setTaxPreference('no');
        return;
      }

      const baseName = user.displayName || deriveFallbackName(user.email);
      setUserName(baseName);
      const token = await user.getIdToken();
      const res = await getJsonAuth<JourneyProfileResponse>('/me/profile', token).catch(() => null);
      if (res?.profile) {
        const p = res.profile;
        if (typeof p.userName === 'string' && p.userName.trim()) setUserName(p.userName);
        if (p.goalId === 'safety' || p.goalId === 'income' || p.goalId === 'growth') setGoalId(p.goalId);
        if (p.riskId === 'safety' || p.riskId === 'income' || p.riskId === 'growth') setRiskId(p.riskId);
        if (p.horizonId === 'short' || p.horizonId === 'mid' || p.horizonId === 'long') setHorizonId(p.horizonId);
        if (typeof p.monthlySurplus === 'string') setMonthlySurplus(p.monthlySurplus);
        if (p.taxPreference === 'yes' || p.taxPreference === 'no') setTaxPreference(p.taxPreference);
      }
      hydratedRef.current = true;
    };

    void run();
  }, [user]);

  useEffect(() => {
    if (!user || !hydratedRef.current) return;
    const timer = setTimeout(async () => {
      const token = await user.getIdToken();
      await putJsonAuth(
        '/me/profile',
        {
          userName,
          goalId,
          riskId,
          horizonId,
          monthlySurplus,
          taxPreference,
        },
        token,
      ).catch(() => undefined);
    }, 500);

    return () => clearTimeout(timer);
  }, [user, userName, goalId, riskId, horizonId, monthlySurplus, taxPreference]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) {
    throw new Error('useJourney must be used within JourneyProvider');
  }
  return ctx;
}
