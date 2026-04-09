import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google.js';
import { Redirect } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/admin/content';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const config = useMemo(
    () => ({
      expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
    }),
    [],
  );

  const [request, response, promptAsync] = Google.useAuthRequest(config);

  const runEmailAuth = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name for sign up.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        return;
      }
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('auth/email-already-in-use')) {
        setError('Account already exists. Switch to Log in.');
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password.');
      } else if (msg.includes('auth/user-not-found')) {
        setError('No account found. Please sign up first.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!response || response.type !== 'success') {
        return;
      }

      const idToken =
        response.params?.id_token ||
        response.authentication?.idToken ||
        '';
      if (!idToken) {
        setError('Google login failed: no id_token received.');
        return;
      }

      try {
        setBusy(true);
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`Login failed: ${msg}`);
      } finally {
        setBusy(false);
      }
    };

    run();
  }, [response]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Checking session…</Text>
      </View>
    );
  }

  if (user) {
    return <Redirect href="/home" />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to FinPilot</Text>
        <Text style={styles.subtitle}>Create an account or log in to continue.</Text>

        <View style={styles.segment}>
          <Pressable
            onPress={() => setMode('login')}
            style={[styles.segmentBtn, mode === 'login' && styles.segmentBtnActive]}>
            <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Log in</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('signup')}
            style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}>
            <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>
              Sign up
            </Text>
          </Pressable>
        </View>

        {mode === 'signup' ? (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            autoCapitalize="words"
          />
        ) : null}
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 6 chars)"
          secureTextEntry
        />

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
          disabled={busy}
          onPress={() => {
            void runEmailAuth();
          }}>
          <Text style={styles.btnText}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </Text>
        </Pressable>

        <Text style={styles.orText}>or</Text>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
          disabled={!request || busy}
          onPress={() => {
            setError('');
            void promptAsync();
          }}>
          <Text style={styles.btnText}>{busy ? 'Signing in…' : 'Continue with Google'}</Text>
        </Pressable>

        {!!error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.backgroundGrey,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.borderLight,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '900', color: theme.textPrimary },
  subtitle: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
  },
  segmentText: { color: theme.textSecondary, fontWeight: '700' },
  segmentTextActive: { color: theme.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: theme.borderLight,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: theme.textPrimary,
  },
  btn: {
    backgroundColor: theme.navyButton,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  orText: { textAlign: 'center', color: theme.textSecondary, fontWeight: '700' },
  error: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },
});
